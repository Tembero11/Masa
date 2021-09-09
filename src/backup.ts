import fs from "fs";
import path from "path";
import { config } from "../index";
import * as fse from "fs-extra";
import { ConsoleColor, createDateTimeString, DateString, parseDateTimeString, serverDir } from "./helpers";
import { isServerJoinable } from "./serverHandler";

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
    if (isServerJoinable) {
        let previousBackups: string[] = await fs.promises.readdir(dir)
        let previousBackupDates: Date[] = previousBackups.map((date) => parseDateTimeString(date as DateString)).sort();

        let quantity: number = previousBackups.length;


        const backupName = createDateTimeString();

        if (quantity >= backupLimit) {
            await fs.promises.rm(path.join(dir, createDateTimeString(previousBackupDates[0])), { 
                recursive: true, force: true 
            });
        }

        let maxTries = config["retryFailedBackups"];
        let timesTried = 0;

        const copyFiles = async() => {
            try {
                await fse.copy(serverDir, path.join(dir, backupName));
            }catch(err) {
                timesTried++;
                if (timesTried < maxTries) {
                    copyFiles();
                }else {
                    throw "Automatic backup creation failed!";
                }
            }
        };

        copyFiles();


        return backupName;
    }else {
        throw "Server is not joinable.";
    }
}

export const listBackups = async(dir: string) => fs.promises.readdir(dir);

export const getLatestBackup = async(checkAll: boolean = true, dir?: string) => {
    let backups;
    if (checkAll) {
        let autoBackups: Date[] = (await fs.promises.readdir(BACKUP_TYPE.AutomaticBackup)).map((date: string) => parseDateTimeString(date as DateString));
        let userBackup: Date[] = (await fs.promises.readdir(BACKUP_TYPE.UserBackup)).map((date: string) => parseDateTimeString(date as DateString));

        backups = [...autoBackups, ...userBackup].sort();
    }else if (dir) {
        backups = (await fs.promises.readdir(dir)).map((date: string) => parseDateTimeString(date as DateString));
    }else {
        throw "Check all was false but dir was not provided!";
    }

    
    
    return createDateTimeString(backups[backups.length - 1]);
}