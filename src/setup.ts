import { BACKUP_TYPE, createBackupsFolder, createNewBackup } from "./backup";
import { ConsoleColor, createDateTimeString, parseDateTimeString, serverDir } from "./helpers";
import fs from "fs";
import { config } from "..";

const setup = () => {
    createBackupsFolder(BACKUP_TYPE.AutomaticBackup);
    createBackupsFolder(BACKUP_TYPE.UserBackup);
    createServerFolder();

    let automaticBackups = config["backup"]["automaticBackups"];

    if (automaticBackups >= 1) {
        console.log('Automatic backups are enabled.');
        setInterval(() => {
            createNewBackup(BACKUP_TYPE.AutomaticBackup, true).then((backupName) => {
                console.log("An automatic backup was succesfully created! %s", backupName);
            }).catch(() => {
                console.warn(ConsoleColor.FgYellow, "An automatic backup has failed!", ConsoleColor.Reset);
            });
        }, automaticBackups * 1000 * 60);
    }else {
        console.log('Automatic backups are disabled, you can change this by changing the "automaticBackups" to a value greater than 1.');
    }
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