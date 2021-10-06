import { BACKUP_TYPE, createBackupsFolder, createNewBackup } from "./backup";
import { ConsoleColor, createDateTimeString, parseDateTimeString, serverDir } from "./helpers";
import fs from "fs";
import { config } from "..";
import { isServerJoinable } from "./serverHandler";
import { socketConnect } from "./socket/connect";

const setup = async() => {
    await createBackupsFolder(BACKUP_TYPE.AutomaticBackup);
    await createBackupsFolder(BACKUP_TYPE.UserBackup);
    await createServerFolder();

    let automaticBackups = config["backup"]["automaticBackups"];

    if (automaticBackups >= 1) {
        console.log('Automatic backups are enabled.');
        setInterval(() => {
            if (isServerJoinable) {
                createNewBackup(BACKUP_TYPE.AutomaticBackup, true).then((backupName) => {
                    console.log("An automatic backup was succesfully created! %s", backupName);
                }).catch((err) => {
                    console.warn(ConsoleColor.FgYellow, err, ConsoleColor.Reset);
                });
            }
        }, automaticBackups * 1000 * 60);
    }else {
        console.log('Automatic backups are disabled, you can change this by changing the "automaticBackups" to a value greater than 1.');
    }


    return true;
}

const createServerFolder = async() => {
    if (!fs.existsSync(serverDir)) {
        console.log("Server folder not found! Creating...");

        await fs.promises.mkdir(serverDir);
    }else {
        console.log("Server folder found! Using...");
    }
}

export default setup;