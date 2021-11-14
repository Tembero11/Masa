import GameServer from "./GameServer";
import fs from "fs";
import path from "path";
import { prettyPrint } from "../../config";
import assert from "assert";
import { nanoid } from "nanoid";
import AdmZip from "adm-zip";
import chalk from "chalk";
import chokidar from "chokidar";
import { NotInitializedError } from "../Errors";

export enum BackupType {
    User = "user",
    Automatic = "auto"
}

export interface BackupMetadata {
  name?: string
  id: string
  desc?: string
  created: number
  author?: string
  type: "auto" | "user"
}
export interface BackupManifest {
  _comment: string
  version: string
  backups: BackupMetadata[]
}

const defaultManifest: BackupManifest = {
  _comment: "DO NOT MODIFY",
  version: "0.0.1",
  backups: []
}


export default class BackupModule {
  public static readonly DEFAULT_BACKUP_PATH = path.join(process.cwd(), "backups");
  public static readonly BACKUP_LIMIT = 2;
  public static readonly BACKUP_EXT = ".zip";

  protected server;
  private _manifest: BackupManifest | undefined;
  public backupsDir: string;

  private dirEventWatcher: chokidar.FSWatcher | undefined;

  /**
   * The path of the manifest.json file
   */
  public get manifestPath() {
    return path.join(this.backupsDir, "manifest.json");
  }

  protected set manifest(manifest: BackupManifest) {
    this._manifest = manifest;
  }
  protected get manifest() {
    assert(this._manifest, new NotInitializedError("manifest", "BackupModule"));
    return this._manifest;
  }

  constructor(server: GameServer, backupsDir = BackupModule.DEFAULT_BACKUP_PATH) {
    assert(server.metadata);
    this.server = server;
    this.backupsDir = path.join(backupsDir, server.metadata.tag);
  }

  /**
   * Initalize the module for use. Many methods throw an error if init has not been called
   */
  async init(): Promise<this> {
    await this.createBackupDirectory();
    await this.createBackupManifest();
    this.manifest = await this.getBackupManifest();

    this.dirEventWatcher = chokidar.watch(this.backupsDir).on("unlink", (filepath) => {
      // Check the file extension
      if (path.extname(filepath) == BackupModule.BACKUP_EXT) {
        // Remove the file path & extension
        const backupId = path.basename(filepath, BackupModule.BACKUP_EXT);

        // Get the list of backups without the file
        const updatedBackupsList = this.manifest.backups.filter((e) => e.id != backupId);

        if (updatedBackupsList.length != this.manifest.backups.length) {
          // Update the backup list
          this.manifest.backups = updatedBackupsList;
          console.warn(chalk.yellow(`${path.basename(filepath)} was removed by another process!`));
        }
      }else if (path.basename(filepath) == "manifest.json") {
        this.saveManifest();
        console.warn(chalk.yellow(`Do not delete the manifest file!`));
      }
    });

    return this;
  }
  /**
   * Creates a backup manifest file with default values
   */
  protected async createBackupManifest() {
    try {
      await fs.promises.access(this.manifestPath);
    }catch(err) {
      await fs.promises.writeFile(this.manifestPath, prettyPrint(defaultManifest), "utf8");
    }
  }
  /**
   * @description Loads the manifest.json file from the disk on to memory
   */
  protected async getBackupManifest() {
    const content = await fs.promises.readFile(this.manifestPath, "utf8");
    return JSON.parse(content) as BackupManifest;
  }
  /**
   * @description Creates the backup directory
   */
  public async createBackupDirectory() {
    try {
      await fs.promises.access(this.backupsDir);
    }catch(err) {
      await fs.promises.mkdir(this.backupsDir, { recursive: true });
    }
  }

  /**
   * Gets all files inside a directory
   * @param dir Starting directory
   * @returns A flat list of file paths all inside the directory
   */
  async getFilesFlat(dir: string) {
    let result: string[] = [];
    let files = await fs.promises.readdir(dir, { withFileTypes: true });
    for (const e of files) {
      let loc = path.join(dir, e.name);
      if (e.isDirectory()) {
        let subDirFiles = (await this.getFilesFlat(loc));
        result.push(...subDirFiles);
      } else {
        result.push(loc);
      }
    }

    return result;
  }

  /**
   * Creates a user backup
   * @param name The name of the backup
   * @param desc The description of the backup
   * @param author The author/creator of the backup
   * @returns The metadata of the created backup
   */
  createUser = async(name?: string, desc?: string, author?: string) => await this.create(BackupType.User, name, desc, author);
  /**
   * Creates an automatic backup
   * @param name The name of the backup
   * @param desc The description of the backup
   * @param author The author/creator of the backup
   * @returns The metadata of the created backup
   */
  createAutomatic = async(name?: string, desc?: string) => await this.create(BackupType.Automatic, name, desc);

  /**
   * Creates a backup
   * @param backupType The type of backup that will be made
   * @param name The name of the backup
   * @param desc The description of the backup
   * @param author The author/creator of the backup
   * @returns The metadata of the created backup
   */
  async create(backupType: BackupType, name?: string, desc?: string, author?: string) {
    const backupLimit = BackupModule.BACKUP_LIMIT;

    if (this.server.isJoinable) {
        await this.server.events.disableAutosave();
        await this.server.events.saveGame();
    }

    const previousBackups = this.manifest.backups.filter(e => e.type === backupType).sort((a, b) => {
        if (a.created > b.created) {
            return 1;
        }
        return -1;
    });

    let quantity: number = previousBackups.length;

    if (quantity >= backupLimit) {
        const backup = previousBackups[0];
        await fs.promises.unlink(path.join(this.backupsDir, backup.id + BackupModule.BACKUP_EXT));
        this.manifest.backups = this.manifest.backups.filter((e) => e.id != backup.id);
    }

    const backupId = nanoid(9);
    const backupFilename = backupId + BackupModule.BACKUP_EXT;

    const created = new Date();

    // Create backup
    let zip = new AdmZip();

    const serverDir = path.resolve(this.server.dir);

    let files = await this.getFilesFlat(serverDir);
    for (const fp of files) {
        if (path.extname(fp) == ".jar") continue;
        let filepath = fp.replace(serverDir, "").replaceAll("\\", "/");
        filepath = filepath.indexOf("/") == 0 ? filepath.substring(1) : filepath;
        try {
            zip.addFile(filepath, await fs.promises.readFile(fp));
        } catch (err) {
            console.warn(chalk.yellow(`Failed to backup "${filepath}"! ${backupId}`));
            continue;
        }
    }
    if (!zip.getEntry("masa.txt")) {
        // Add a masa.txt file if it doesn't exist
        zip.addFile("masa.txt", Buffer.from(`# This backup was created with MASA\n${new Date().getTime()}`, "utf8"));
    }

    if (this.server.isJoinable) {
        await this.server.events.enableAutosave();
    }

    const result: BackupMetadata = {
      name,
      desc,
      author,
      created: created.getTime(),
      id: backupId,
      type: backupType
    }

    this.manifest.backups.push(result);

    await this.saveManifest();

    
    return new Promise<BackupMetadata>((res, rej) => {
        zip.writeZip(path.join(this.backupsDir, backupFilename), (err) => {
            if (!err) {
                res(result);
            }else {
                rej(err);
            }
        });
    });
  }

  /**
   * Lists all backups
   */
  listAll() {
    return this.manifest.backups;
  }
  /**
   * Lists all user backups
   */
  listUser() {
    return this.manifest.backups.filter(e => e.type === BackupType.User);
  }
  /**
   * Lists all automatic backups
   */
  listAutomatic() {
    return this.manifest.backups.filter(e => e.type === BackupType.Automatic);
  }

  private latestSorter = (a: BackupMetadata, b: BackupMetadata) => {
    if (a.created > b.created) {
      return -1;
    }
    return 1;
  }

  /**
   * Get the latest backup from all backups
   */
  getLatest = (): BackupMetadata | undefined => this.listAll().sort(this.latestSorter)[0];
  /**
   * Get the latest backup from all user backups
   */
  getLatestUser = (): BackupMetadata | undefined => this.listUser().sort(this.latestSorter)[0];
  /**
   * Get the latest backup from all automatic backups
   */
  getLatestAutomatic = (): BackupMetadata | undefined => this.listAutomatic().sort(this.latestSorter)[0];
  

  /**
   * Saves the in memory manifest to the disk
   */
  async saveManifest() {
    await fs.promises.writeFile(this.manifestPath, prettyPrint(this.manifest), "utf8");
  }
}
