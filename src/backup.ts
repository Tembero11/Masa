import fs from "fs";
import path from "path";
import { config } from "../index";
import * as fse from "fs-extra";
import { ConsoleColor, createDateTimeString, DateString, parseDateTimeString, serverDir } from "./helpers";

export const BACKUP_TYPE = {
    UserBackup: path.join(process.cwd(), "user_backups"),
    AutomaticBackup: path.join(process.cwd(), "backups"),
}

/**
 * Creates backup folder if needed
 */
export const createBackupsFolder = async (dir: string) => {
    let exists = await fs.existsSync(dir);


    if (!exists) {
        console.log(`Backup folder not found. Creating... ${ConsoleColor.BgMagenta}"%s${ConsoleColor.Reset}"`, dir);

        await fs.promises.mkdir(dir);
    } else {
        console.log(`Backup folder exists already. Appending new backups to ${ConsoleColor.BgMagenta}"%s"${ConsoleColor.Reset}!`, dir);
    }
}

export const createNewBackup = async (dir: string, isAutomatic = false, backupLimit: number = config["backup"]["backupLimit"]) => {
    let previousBackups: string[] = await fs.promises.readdir(dir)
    let previousBackupDates: Date[] = previousBackups.map((date) => parseDateTimeString(date as DateString)).sort();

    let quantity: number = previousBackups.length;


    const backupName = createDateTimeString();

    if (quantity >= backupLimit) {
        await fs.promises.rm(path.join(dir, createDateTimeString(previousBackupDates[0])), { 
            recursive: true, force: true 
        });
    }

    await fse.copy(serverDir, path.join(dir, backupName));


    return backupName;
}

export const listBackups = async(dir: string) => fs.promises.readdir(dir);

// export const getLatestBackup = async(checkAll: boolean = true, dir?: string) => {
//     let backups: Date[] = (await fs.promises.readdir(dir)).map((date) => parseDateTimeString(date as DateString)).sort();
    
//     return backups[backups.length - 1];
// }