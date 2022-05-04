import AdmZip from "adm-zip";
import tar from "tar";
import fs from "fs";
import path from "path";
import { Readable } from "stream";
import GameServer from "../GameServer";
import { BackupManifestController, BackupType } from "./BackupManifest";
import { nanoid } from "nanoid";

type CompressionType = "zip" | "gzip";

interface BackupManagerOptions {
  compression?: CompressionType
}

export class BackupManager {
  readonly origin: string;
  readonly dest: string;

  readonly compression: CompressionType;

  manifest: BackupManifestController


  constructor(server: GameServer, dest: string, options?: BackupManagerOptions) {
      this.dest = this.normalizePathDelimiters(path.resolve(dest));
      this.origin = this.normalizePathDelimiters(path.resolve(server.dir));

      this.compression = options?.compression || "gzip";

      this.manifest = new BackupManifestController(this.dest);
  }

  async createBackupDir() {
    try {
      await fs.promises.stat(this.dest);
    }catch(err) {
      await fs.promises.mkdir(this.dest, { recursive: true });
      return true;
    }
    return false;
  }

  async readdirRecursiveFlat(dir: string, options?: { ignoreDestDir?: boolean }) {
    const contents = await fs.promises.readdir(dir, { withFileTypes: true });
    const flatList: string[] = [];

    for (const dirent of contents) {
      const direntPath = this.normalizePathDelimiters(path.join(dir, dirent.name));

      if (options?.ignoreDestDir) {
        if (direntPath.startsWith(this.dest)) {
          continue;
        }
      }

      if (dirent.isDirectory()) {
        flatList.push(...await this.readdirRecursiveFlat(direntPath));
      } else {
        flatList.push(direntPath);
      }
    }
    return flatList;
  }

  async createReadStream(files: string[], compression?: CompressionType) {
    if (!compression) compression = this.compression;
    if (this.compression == "zip") {
      const zip = new AdmZip();

      await Promise.all(files.map(async filePath => {
        const content = await fs.promises.readFile(filePath);

        zip.addFile(filePath, content);
      }));

      return Readable.from(zip.toBuffer());
    }

    return tar.c({
      gzip: true
    }, files);
  }

  async writeBackupArchive(id: string, compression?: CompressionType) {
    const filepath = path.join(this.dest, id);

    const filesFlat = await this.readdirRecursiveFlat(this.origin, { ignoreDestDir: true });
    const readStream = await this.createReadStream(filesFlat, compression);
    const writeStream = fs.createWriteStream(filepath);

    readStream.pipe(writeStream);
  }

  async createBackup() {
    const id = this.genBackupId();
    const filename = this.getFilename(id, this.compression);
    await this.writeBackupArchive(filename);

    const isoDate = new Date().toISOString();

    this.manifest.addAuto({
      id,
      created: isoDate,
      type: BackupType.Automatic
    });

    await this.manifest.write();
  }

  genBackupId = () => nanoid(9) 

  normalizePathDelimiters = (p: string) => p.replaceAll("\\", "/");

  getFilename(idOrName: string, compression?: CompressionType) {
    if (!compression) compression = this.compression;
    if (compression == "gzip") {
      return idOrName + ".tar.gz"
    }
    return idOrName + ".zip"
  }
}