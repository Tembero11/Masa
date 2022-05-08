import fs from "fs";
import path from "path";
import { CompressionType } from "./BackupManager";

export enum BackupType {
  Manual = "manual",
  Automatic = "auto"
}

interface BackupManifest {
  version: number
  backups: AutoOrManualBackupMetadata[]
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
export type AutoOrManualBackupMetadata = AutoBackupMetadata | ManualBackupMetadata;

export class BackupManifestController {
  readonly version = 1;

  protected manifest: BackupManifest
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
  add = (backup: AutoOrManualBackupMetadata) => this.manifest.backups.push(backup);

  remove = (id: string) => this.manifest.backups.filter(meta => meta.id == id);

  get = (id: string) => this.manifest.backups.find(meta => meta.id == id);

  getLatest() {
    return this.manifest.backups.sort((a, b) => {
      const aEpoch = new Date(a.created).getTime();   
      const bEpoch = new Date(b.created).getTime();
      return aEpoch - bEpoch;
    })[0];
  }

  getByName(name: string) {
    return this.manifest.backups.find(meta => {
      if (meta.type == BackupType.Manual) {
          return meta.name == name;
      }
      return false;
    }) as ManualBackupMetadata | undefined;
  }

  getAllManual = () => this.manifest.backups.filter(meta => meta.type == BackupType.Manual);
  getAllAutomatic = () => this.manifest.backups.filter(meta => meta.type == BackupType.Automatic);

  // TODO: add getByProperty

  get backups() {
    return this.manifest.backups;
  }

  get length() {
    return this.manifest.backups.length;
  }

  toString() {
    return JSON.stringify(this.manifest, null, 2);
  }
}