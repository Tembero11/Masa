import AdmZip from "adm-zip";
import tar from "tar";
import fs from "fs";
import path from "path";
import { Readable } from "stream";
import GameServer from "../GameServer";
import { AutoBackupMetadata, BackupManifestController, BackupType, ManualBackupMetadata } from "./BackupManifest";
import { nanoid } from "nanoid";
import assert from "assert";
import { BackupMetadata } from "./BackupManifest";

export type CompressionType = "zip" | "gzip";

interface BackupManagerOptions {
  compression?: CompressionType
}

export class BackupManager {
  readonly server;
  
  get origin() {
    return this.normalizePathDelimiters(path.resolve(this.server.dir));
  }

  readonly dest: string;

  readonly compression: CompressionType;

  manifest: BackupManifestController


  constructor(server: GameServer, dest: string, options?: BackupManagerOptions) {
    this.server = server;
    this.dest = this.normalizePathDelimiters(path.resolve(dest));

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

  async readdirRecursiveFlat(dir: string, options?: { ignoreDestDir?: boolean, ignoredFileTypes?: string[]  }) {
    const contents = await fs.promises.readdir(dir, { withFileTypes: true });
    let flatList: string[] = [];

    for (const dirent of contents) {
      let direntPath = this.normalizePathDelimiters(path.join(dir, dirent.name));

      if (options?.ignoreDestDir) {
        if (direntPath.startsWith(this.dest)) {
          continue;
        }
      }
      if (options?.ignoredFileTypes) {
        let isIgnored = false;
        for (const ext of options.ignoredFileTypes) {
          if (path.extname(direntPath) == ext) {
            isIgnored = true;
            break;
          }
        }
        if (isIgnored) continue;
      }

      if (dirent.isDirectory()) {
        flatList.push(...await this.readdirRecursiveFlat(direntPath, options));
      } else {
        flatList.push(direntPath);
      }
    }
    

    return flatList;
  }

  async createReadStream(files: string[], options?: {compression?: CompressionType, withOriginDir?: boolean}) {
    let compression = options?.compression;
    let withOriginDir = options?.withOriginDir;
    if (!options?.compression) compression = this.compression;

    let relativeFiles = files.map(filePath => {
      // Remove origin directory
      if (!withOriginDir) {
        filePath = filePath.replace(new RegExp(`^${this.origin}`), "");
        if (filePath.startsWith("/")) filePath = filePath.substring(1);
      }
      return filePath;
    });
    
    if (compression == "zip") {
      const zip = new AdmZip();

      await Promise.all(relativeFiles.map(async (filePath, index) => {
        const absoluteFilePath = files[index];
        const content = await fs.promises.readFile(absoluteFilePath);
        
        zip.addFile(filePath, content);
      }));

      return Readable.from(zip.toBuffer());
    }
    return tar.c({
      cwd: this.origin,
      gzip: true,
    }, relativeFiles);
  }

  async writeBackupArchive(id: string, compression?: CompressionType) {
    const filepath = path.join(this.dest, this.getFilename(id, compression));

    const filesFlat = await this.readdirRecursiveFlat(this.origin, {
      ignoreDestDir: true,
      ignoredFileTypes: [".jar"]
    });
    const readStream = await this.createReadStream(filesFlat,{
      compression,
      withOriginDir: false
    });
    const writeStream = fs.createWriteStream(filepath);

    readStream.pipe(writeStream);
  }

  createBackup(meta: {name: string, desc: string, author: string}): Promise<ManualBackupMetadata>
  createBackup(meta?: undefined): Promise<AutoBackupMetadata>
  async createBackup(meta?: {name: string, desc: string, author: string}) {
    const compression = this.compression;

    const id = this.genBackupId();
    await this.writeBackupArchive(id);

    const isoDate = new Date().toISOString();

    let backup = {
      id,
      created: isoDate,
      compression,
      ...(meta ? {...meta, type: BackupType.Manual} : {
        type: BackupType.Automatic
      })
    }
    this.manifest.add(backup);

    await this.manifest.write();

    return backup;
  }

  async deleteBackup(id: string) {
    const backup = this.manifest.get(id);
    if (!backup) return;

    const filepath = this.getPotentialPath(id, backup.compression);

    try {
      await fs.promises.unlink(filepath);
    }catch(err) {
      console.log(err)
    }

    this.manifest.remove(id);

    await this.manifest.write();
  }

  genBackupId = () => nanoid(9) 

  normalizePathDelimiters = (p: string) => p.replaceAll("\\", "/");

  getPotentialPath(id: string, compression: CompressionType) {
    return this.normalizePathDelimiters(path.join(this.dest, this.getFilename(id, compression)));
  }

  getFilename(idOrName: string, compression?: CompressionType) {
    if (!compression) compression = this.compression;
    if (compression == "gzip") {
      return idOrName + ".tar.gz"
    }
    return idOrName + ".zip"
  }
}