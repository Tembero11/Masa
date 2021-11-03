import fs from "fs";
import path from "path";
import AdmZip from "adm-zip";
import { config } from "../index";
import * as fse from "fs-extra";
import glob from "glob";
import { ConsoleColor, createDateTimeString, DateString, parseDateTimeString, serverDir } from "./helpers";
import {  isServerJoinable } from "./serverHandler";
import { GameServer } from "./classes/MasaAPI";
import chalk from "chalk";
import assert from "assert";

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
        console.log(`Backup folder not found. Creating... "${chalk.bgYellowBright(dir)}"`);

        await fs.promises.mkdir(dir);
    } else {
        console.log(`Backup folder exists already. Appending new backups to "${chalk.yellowBright(dir)}"!`, );
    }
}

interface CreateBackupOptions {
    backupLimit?: number,
    backupsDir?: string,
    compressionType?: "zip" | "tar"
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

export const createBackup = async(server: GameServer, serverName: string, options?: CreateBackupOptions) => {
    if (!options) options = {};
    let compressionType = options.compressionType || "zip";
    let backupLimit = options.backupLimit || config.backup.backupLimit;
    let dir = path.join(options.backupsDir || "backups", serverName);

    assert(compressionType == "zip", "Unsupported archive type!");

    if (!fs.existsSync(dir)) {
        await fs.promises.mkdir(dir);
    }

    if (server.isJoinable) {
        await server.events.disableAutosave();
        // await server.events.saveGame();

        let previousBackups: string[] = await fs.promises.readdir(dir);
        let previousBackupDates: Date[] = previousBackups.map((date) => parseDateTimeString(date.replace(".zip", "") as DateString)).sort();

        let quantity: number = previousBackups.length;

        if (quantity >= backupLimit) {
            await fs.promises.unlink(path.join(dir, createDateTimeString(previousBackupDates[0]) + ".zip"));
        }

        let backupName = createDateTimeString();

        // Create backup
        if (compressionType == "zip") {
            let zip = new AdmZip();

            let files = await getFilesAndDirectories(server.dir);
            for (const filepath of files) {
                try {
                    zip.addFile(filepath, await fs.promises.readFile(filepath));
                }catch(err) {
                    console.warn(chalk.yellow(`Failed to backup "${filepath}"! ${backupName}`));
                    continue;
                }
            }


            // files.forEach((filename) => zip.addLocalFile(path.join(server.dir, filename)));
            zip.addFile("masa.txt", Buffer.from(`This backup was created with MASA`, "utf8"));

            zip.writeZip(path.join(dir, `${backupName}.zip`))
        }

        await server.events.enableAutosave();

        return backupName;
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

        // TODO: Remove timeout & add event to ConsoleReader
        // Also create a better way to expect an event to occur
        // Make backups zip or tar.gz files
        // Only copy files that have been edited

        // return new Promise<string>((res, rej) => {
        //     // Save everything & Stop the locking of the files
        //     commandProcess?.stdin.write("save-all\nsave-off\n", (err) => {
        //         if (!err) {
        //             setTimeout(() => {
        //                 fse.copy(serverDir, path.join(dir, backupName)).then(() => {
        //                     // Turn on saving again
        //                     commandProcess?.stdin.write("save-on\n", (err) => {
        //                         if (!err) {
        //                             res(backupName);
        //                         }else {
        //                             rej(err);
        //                         }
        //                     });
        //                 }); 
        //             }, 9999);
        //         }else {
        //             rej(err);
        //         }
        //     });
        // });
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