import fs from "fs";
import path from "path";
import { CompressionType } from "./BackupManager";

export enum BackupType {
  Manual = "manual",
  Automatic = "auto"
}

interface BackupManifest {
  version: number
  backups: BackupMetadata[]
}

export interface BackupMetadata {
  id: string
  created: string
  compression: CompressionType
}

export interface AutoBackupMetadata extends BackupMetadata {
  type: BackupType.Automatic
}

export interface ManualBackupMetadata extends BackupMetadata {
  name: string
  desc: string
  author: string
  type: BackupType.Manual
}

export class BackupManifestController {
  readonly version = 1;

  manifest: BackupManifest
  readonly dest: string
  readonly filepath: string
  constructor(dest: string) {
    this.dest = dest;
    this.filepath = path.join(dest, "manifest.json");

    try {
      this.manifest = this.readSync();
    }catch(err) {
      this.manifest = { version: this.version, backups: [] }; 
    }
  }


  read = async() => JSON.parse(await fs.promises.readFile(this.filepath, { encoding: "utf8" })) as BackupManifest;
  readSync = () => JSON.parse(fs.readFileSync(this.filepath, { encoding: "utf8" })) as BackupManifest;

  write = async() => await fs.promises.writeFile(this.filepath, this.toString(), { encoding: "utf8" });
  writeSync = () => fs.writeFileSync(this.filepath, this.toString(), { encoding: "utf8" });

  addAuto = (backup: AutoBackupMetadata) => this.manifest.backups.push(backup);
  addManual = (backup: ManualBackupMetadata) => this.manifest.backups.push(backup);
  add = (backup: BackupMetadata & {type: BackupType}) => this.manifest.backups.push(backup);

  remove = (id: string) => this.manifest.backups.filter(meta => meta.id == id);

  get = (id: string) => this.manifest.backups.find(meta => meta.id == id);
  // getByName = (name: string) => this.manifest.backups.find(meta => )

  toString() {
    return JSON.stringify(this.manifest, null, 2);
  }
}