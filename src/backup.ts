import fs from "fs";
import path from "path";
import AdmZip from "adm-zip";
import { GameServer } from "./classes/MasaAPI";
import chalk from "chalk";
import assert from "assert";
import date from "date-and-time";
import levenshtein from "fastest-levenshtein";

export enum BackupType {
    User = "user",
    Automatic = "auto"
}

const backupTypeToPath = (type: BackupType, serverName: string) => path.join(process.cwd(), "backups", serverName, type);

export interface BackupMetadata {
    name?: string,
    fullname: string
    filename: string,
    created: Date,
    ext: string
}
export interface BackupManifest {
    _comment: string,
    backups: {
        [key: string]: {
            name?: string,
            desc?: string,
            date: number
        }
    }
}



const datePattern = date.compile("DD.MM.YYYY-HH.mm.ss");
const backupExt = ".zip";
const warnFileContent = "Do not modify the files or folders here unless you know what you're doing!";


/**
 * Creates backup folder if needed
 */
export const createBackupsFolder = async (type: BackupType) => {
    const dir = path.join(process.cwd(), "backups")
    let exists = await fs.existsSync(dir);


    if (!exists) {
        console.log(`Backup folder not found. Creating... "${chalk.bgYellowBright(dir)}"`);

        await fs.promises.mkdir(dir);

        await fs.promises.writeFile(path.join(dir, "WARNING.txt"), warnFileContent, "ascii");
    } else {
        console.log(`Backup folder exists already. Appending new backups to "${chalk.yellowBright(dir)}"!`, );
    }
}


const getFilesAndDirectories = async(dir: string) => {
    let result: string[] = [];
    let files = await fs.promises.readdir(dir, {withFileTypes: true});
    for (const e of files) {
        let loc = path.join(dir, e.name);
        if (e.isDirectory()) {
            let subDirFiles = (await getFilesAndDirectories(loc));
            result.push(...subDirFiles);
        }else {
            result.push(loc);
        }
    }

    return result;
}

interface CreateBackupOptions {
    backupLimit?: number,
    name?: string
}

export const createBackup = async(server: GameServer, serverName: string, backupType: BackupType, options?: CreateBackupOptions) => {
    if (!options) options = {};

    let backupLimit = options.backupLimit || 5;
    const dir = backupTypeToPath(backupType, serverName);

    if (!fs.existsSync(dir)) {
        await fs.promises.mkdir(dir, { recursive: true });
    }

    if (server.isJoinable) {
        await server.events.disableAutosave();
        await server.events.saveGame();
    }

    const previousBackups = (await listBackups(serverName, backupType)).sort();

    let quantity: number = previousBackups.length;

    if (quantity >= backupLimit) {
        await fs.promises.unlink(path.join(dir, previousBackups[0].filename));
    }

    const created = new Date();
    let backupFullName = date.format(created, datePattern);
    if (options.name) {
        backupFullName = `${backupFullName}_${options.name}`;
    }

    // Create backup
    let zip = new AdmZip();

    const serverDir = path.resolve(server.dir);

    let files = await getFilesAndDirectories(serverDir);
    for (const fp of files) {
        if (path.extname(fp) == ".jar") continue;
        let filepath = fp.replace(serverDir, "").replaceAll("\\", "/");
        filepath = filepath.indexOf("/") == 0 ? filepath.substring(1) : filepath;
        try {
            zip.addFile(filepath, await fs.promises.readFile(fp));
        } catch (err) {
            console.warn(chalk.yellow(`Failed to backup "${filepath}"! ${backupFullName}`));
            continue;
        }
    }
    if (!zip.getEntry("masa.txt")) {
        // Add a masa.txt file if it doesn't exist
        zip.addFile("masa.txt", Buffer.from(`# This backup was created with MASA\n${new Date().getTime()}`, "utf8"));
    }

    if (server.isJoinable) {
        await server.events.enableAutosave();
    }
    
    return new Promise<BackupMetadata>((res, rej) => {
        zip.writeZip(path.join(dir, backupFullName + backupExt), (err) => {
            if (!err) {
                res({
                    name: options?.name,
                    fullname: backupFullName,
                    filename: backupFullName + backupExt,
                    created,
                    ext: backupExt
                });
            }else {
                rej(err);
            }
        });
    });
}
export const parseBackupName = (filename: string): BackupMetadata => {
    const fullname = filename.replace(backupExt, "");

    const [createdStr, name] = fullname.split("_");

    const created = date.parse(createdStr, datePattern);

    return {
        name,
        fullname,
        filename,
        created,
        ext: backupExt
    }
}

export const findBackupByName = async(serverName: string, backupName: string) => {
    const backups = await listBackups(serverName);
    const backup = parseBackupName(backupName);

    return backups.sort((a, b) => {
        if (backup.name) {
            const aName = a.name || "";
            const bName = b.name || "";
            const dstA = levenshtein.distance(aName, backup.name);
            const dstB = levenshtein.distance(bName, backup.name);
            if (dstA < dstB) {
                return -1;
            }
            return 1;
        }
        

        const dateDstA = backup.created.getTime() - a.created.getTime();
        const dateDstB = backup.created.getTime() - b.created.getTime();
        if (dateDstA < dateDstB) {
            return 1;
        }
        return -1;
    });
}


export const restoreFromBackup = async(server: GameServer, serverName: string, backupName: string) => {
    
}

export const listBackups = async(serverName: string, type: BackupType | BackupType[] = [BackupType.Automatic, BackupType.User]): Promise<BackupMetadata[]> => {
    let types = Array.isArray(type) ? type : [type];

    let backups = [];

    for (const t of types) {
        backups.push(...await fs.promises.readdir(backupTypeToPath(t, serverName)));
    }

    return backups.map(parseBackupName);
};


export const getLatestBackup = async(serverName: string, type: BackupType | BackupType[] = [BackupType.Automatic, BackupType.User]): Promise<BackupMetadata | null> => {
    let backups = (await listBackups(serverName, type)).sort();
    const latest: BackupMetadata | undefined = backups[backups.length - 1];
    return latest || null;
}
findBackupByName("test", "09.11.2021-18.48.15.zip");