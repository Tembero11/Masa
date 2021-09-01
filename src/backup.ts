import fs from "fs";
import path from "path";
import { config } from "../index";
import * as fse from "fs-extra";
import { createDateTimeString, DateString, parseDateTimeString, serverDir } from "./helpers";

const backupDirectory = path.join(process.cwd(), "backups");

/**
 * Creates backup folder if needed
 */
export const createBackupsFolder = async () => {
    let exists = await fs.existsSync(backupDirectory);


    if (!exists) {
        console.log("Backup folder not found. Creating...");

        await fs.promises.mkdir(backupDirectory);
    } else {
        console.log("Backup folder exists already. Appending new backups!");
    }
}

export const createNewBackup = async () => {
    let previousBackups: string[] = await fs.promises.readdir(backupDirectory)
    let previousBackupDates: Date[] = previousBackups.map((date) => parseDateTimeString(date as DateString)).sort();

    let limit: number = config["backup"]["backupLimit"];
    let quantity: number = previousBackups.length;


    const backupName = createDateTimeString();

    // TODO
    if (quantity >= limit) {
        await fs.promises.rm(path.join(backupDirectory, createDateTimeString(previousBackupDates[0])), { 
            recursive: true, force: true 
        });
    }

    await fse.copy(serverDir, path.join(backupDirectory, backupName));
}