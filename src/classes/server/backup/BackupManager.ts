import AdmZip from "adm-zip";
import tar from "tar";
import fs from "fs";
import path from "path";
import { Readable } from "stream";
import GameServer from "../GameServer";
import { AutoBackupMetadata, AutoOrManualBackupMetadata, BackupManifestController, BackupType, ManualBackupMetadata } from "./BackupManifest";
import { nanoid } from "nanoid";
import { NoBackupError } from "../../Errors";

export type CompressionType = "zip" | "gzip";

export interface BackupManagerOptions {
  compression?: CompressionType
}

export class BackupManager {
  readonly origin: string;
  readonly dest: string;

  readonly compression: CompressionType;

  manifest: BackupManifestController


  constructor(origin: string, dest: string, options?: BackupManagerOptions) {
    this.origin = origin;
    this.dest = this.normalizePathDelimiters(path.resolve(dest));

    this.compression = options?.compression || "gzip";

    this.manifest = new BackupManifestController(this.dest);
  }

  async createBackupDir() {
    try {
      await fs.promises.stat(this.dest);
    } catch (err) {
      await fs.promises.mkdir(this.dest, { recursive: true });
      return true;
    }
    return false;
  }

  async readdirRecursiveFlat(dir: string, options?: { ignoreDestDir?: boolean, filter?: (filepath: string, dirent: fs.Dirent) => boolean}) {
    const contents = await fs.promises.readdir(dir, { withFileTypes: true });
    let flatList: string[] = [];

    for (const dirent of contents) {
      let direntPath = this.normalizePathDelimiters(path.join(dir, dirent.name));

      if (options?.ignoreDestDir) {
        if (direntPath.startsWith(this.dest)) {
          continue;
        }
      }
      if (options?.filter && !options.filter(direntPath, dirent)) continue;

      if (dirent.isDirectory()) {
        flatList.push(...await this.readdirRecursiveFlat(direntPath, options));
      } else {
        flatList.push(direntPath);
      }
    }


    return flatList;
  }

  async createReadStream(files: string[], options?: { compression?: CompressionType, withOriginDir?: boolean }) {
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
      filter: (filepath, dirent) => path.extname(dirent.name) != ".jar"
    });
    const readStream = await this.createReadStream(filesFlat, {
      compression,
      withOriginDir: false
    });
    const writeStream = fs.createWriteStream(filepath);

    return new Promise<void>(resolve => {
      writeStream.on("close", resolve);
      readStream.pipe(writeStream);
    });
  }

  createBackup(meta: { name: string, desc: string, author: string }): Promise<ManualBackupMetadata>
  createBackup(meta?: undefined): Promise<AutoBackupMetadata>
  async createBackup(meta?: { name: string, desc: string, author: string }) {
    const compression = this.compression;

    const id = this.genBackupId();
    await this.writeBackupArchive(id);

    const isoDate = new Date().toISOString();

    let backup: AutoOrManualBackupMetadata = {
      id,
      created: isoDate,
      compression,
      ...(meta ? { ...meta, type: BackupType.Manual } : {
        type: BackupType.Automatic
      })
    }
    this.manifest.add(backup);

    await this.manifest.write();

    return backup;
  }

  async deleteBackup(id: string) {
    const meta = this.manifest.get(id);
    if (!meta) throw new NoBackupError(id);

    const filepath = this.getPotentialPath(id, meta.compression);

    try {
      await fs.promises.unlink(filepath);
    } catch (err) {
      console.log(err)
    }

    this.manifest.remove(id);

    await this.manifest.write();
  }

  async extractBackup(id: string, dest: string, options?: { overwrite?: boolean }) {
    const meta = this.manifest.get(id);
    if (!meta) throw new NoBackupError(id);

    const filepath = this.getPotentialPath(id, meta.compression);

    if (meta.compression == "zip") {
      const zipBuffer = await fs.promises.readFile(filepath);
      const zip = new AdmZip(zipBuffer);

      return new Promise<boolean>((resolve, reject) => {
        zip.extractAllToAsync(dest, options?.overwrite, (err) => {
          if (err) {
            reject(err);
          } else {
            resolve(true);
          }
        });
      });
    } else {
      await tar.x({
        file: filepath,
        cwd: dest,
        keep: !options?.overwrite
      });
      return true;
    }
  }

  async revertBackup(id: string) {
    const meta = this.manifest.get(id);
    if (!meta) throw new NoBackupError(id);


    const dirents = await fs.promises.readdir(this.origin, { withFileTypes: true });

    for (const dirent of dirents) {
      const direntPath = this.normalizePathDelimiters(path.join(this.origin, dirent.name));
      if (dirent.isDirectory()) {
        if (direntPath != this.dest) {
          await fs.promises.rm(direntPath, { recursive: true });
        }
      }else {
        await fs.promises.unlink(direntPath);
      }
    }

    await this.extractBackup(id, this.origin, { overwrite: false });
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