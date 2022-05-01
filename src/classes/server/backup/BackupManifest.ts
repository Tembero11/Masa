import fs from "fs";
import path from "path";

enum BackupType {
  Manual = "manual",
  Automatic = "auto"
}

interface BackupManifest {
  backups: BackupMetadata[]
}

interface BackupMetadata {
  id: string
  created: number
  type: BackupType
}
type ManualBackupMetadata = {
  name: string
  desc: string
  author: string
} & BackupMetadata

export class BackupManifestController {
  manifest: BackupManifest
  readonly dest: string
  readonly filepath: string
  constructor(dest: string) {
    this.dest = dest;
    this.filepath = path.join(dest, "manifest.json");

    this.manifest = { backups: [] };
  }

  write = async() => await fs.promises.writeFile(this.filepath, this.toString(), { encoding: "utf8", });
  writeSync = () => fs.writeFileSync(this.filepath, this.toString(), { encoding: "utf8" });

  toString() {
    return JSON.stringify(this.manifest, null, 2);
  }
}