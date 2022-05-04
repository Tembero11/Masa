import fs from "fs";
import path from "path";

export enum BackupType {
  Manual = "manual",
  Automatic = "auto"
}

interface BackupManifest {
  backups: BackupMetadata[]
}

interface BackupMetadata {
  id: string
  created: string
  type: BackupType.Automatic
}
type ManualBackupMetadata = BackupMetadata & {
  name: string
  desc: string
  author: string
  type: BackupType.Manual
}

export class BackupManifestController {
  manifest: BackupManifest
  readonly dest: string
  readonly filepath: string
  constructor(dest: string) {
    this.dest = dest;
    this.filepath = path.join(dest, "manifest.json");

    try {
      this.manifest = this.readSync();
    }catch(err) {
      this.manifest = { backups: [] }; 
    }
  }


  read = async() => JSON.parse(await fs.promises.readFile(this.filepath, { encoding: "utf8" })) as BackupManifest;
  readSync = () => JSON.parse(fs.readFileSync(this.filepath, { encoding: "utf8" })) as BackupManifest;

  write = async() => await fs.promises.writeFile(this.filepath, this.toString(), { encoding: "utf8" });
  writeSync = () => fs.writeFileSync(this.filepath, this.toString(), { encoding: "utf8" });

  addAuto = (backup: BackupMetadata) => this.manifest.backups.push(backup);
  addManual = (backup: ManualBackupMetadata) => this.manifest.backups.push(backup);

  toString() {
    return JSON.stringify(this.manifest, null, 2);
  }
}