import AdmZip from "adm-zip";
import tar from "tar";
import fs from "fs";
import path from "path";
import { Readable } from "stream";
import GameServer from "../GameServer";
import { BackupManifestController } from "./BackupManifest";

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

  normalizePathDelimiters = (p: string) => p.replaceAll("\\", "/");
}