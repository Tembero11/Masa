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
      this.dest = dest;
      this.origin = server.dir;

      this.compression = options?.compression || "gzip";

      this.manifest = new BackupManifestController(this.dest);
  }

  async readdirRecursiveFlat(dir: string) {
    const contents = await fs.promises.readdir(dir, { withFileTypes: true });
    const flatList: string[] = [];

    for (const dirent of contents) {
      const direntPath = this.normalizePathDelimiters(path.join(dir, dirent.name));

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

  async writeBackup(id: string, compression?: CompressionType) {
    const filepath = path.join(this.dest, id);

    const filesFlat = await this.readdirRecursiveFlat(this.origin);

    const readStream = await this.createReadStream(filesFlat, compression);
    const writeStream = fs.createWriteStream(filepath);

    readStream.pipe(writeStream);
  }

  async createBackup() {
    const id = this.genBackupId();
    await this.writeBackup(id);

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
}