import fs from "fs";
import path from "path";
import { config } from "../index";
import * as fse from "fs-extra";
import { createDateTimeString, DateString, parseDateTimeString, serverDir } from "./helpers";

const backupDirectory = path.join(process.cwd(), "backups");

/**
 * Creates backup folder if needed
 */
export const createBackupsFolder = async() => {
    let exists = await fs.existsSync(backupDirectory);


    if (!exists) {
        console.log("Backup folder not found. Creating...");

        await fs.promises.mkdir(backupDirectory);
    }else {
        console.log("Backup folder exists already. Appending new backups!");
    }
}

export const createNewBackup = async() => {
    let previousBackups = await fs.promises.readdir(backupDirectory)

    let limit: number = config["backup"]["backupLimit"];
    let quantity: number = previousBackups.length;

    

    let backups = previousBackups.map((value) => parseDateTimeString(value as DateString));

    backups.forEach((value) => console.log(value.getTime()))

    const backupName = createDateTimeString();

    // TODO
    if (quantity >= limit) {
        fs.promises.rmdir(path.join())
    }else {

    }

    await fse.copy(serverDir, path.join(backupDirectory, backupName));
}