import { BACKUP_TYPE, createBackupsFolder, createNewBackup } from "./backup";
import { ConsoleColor, createDateTimeString, parseDateTimeString, serverDir } from "./helpers";
import fs from "fs";
import { config } from "../";
import { serverInitializer } from "./serverHandler";
import { loadServerList } from "./config";
import inquirer, { ui } from "inquirer";
import inquirerAutocompletePrompt from "inquirer-autocomplete-prompt";
import VanillaInstaller from "./classes/server/installer/VanillaInstaller";

inquirer.registerPrompt("autocomplete", inquirerAutocompletePrompt);

const setup = async() => {
    let serverList = await loadServerList();

    if (serverList.length <= 0) {
        let result = await inquirer.prompt([
            {
                message: "No servers found. Would you like to install a new one?",
                name: "install",
                type: "confirm",
            },
            {
                message: "What kind of server would you like to install?",
                name: "server_type",
                type: "list",
                choices: [
                    {name: "Vanilla"},
                    {name: "Spigot",},
                    {name: "Forge"},
                    {name: "Paper"},
                ]
            },
            {
                message: "What version do you want to play?",
                name: "version",
                type: "autocomplete",
                source: async function(answersSoFar: any, input: string) {
                    input = input || "latest";
                    let manifest = await VanillaInstaller.getVersions();

                    if (input.startsWith("latest")) {
                        input = manifest.latest.release;
                    }

                    return manifest.versions
                    .filter((value) => value.id.startsWith(input) && (value.type == "release"))
                    .map((e) => e.id);
                }
            }
        ]);
    }

    serverInitializer(serverList);

    await createBackupsFolder(BACKUP_TYPE.AutomaticBackup);
    await createBackupsFolder(BACKUP_TYPE.UserBackup);
    await createServerFolder();

    let automaticBackups = config["backup"]["automaticBackups"];

    // if (automaticBackups >= 1) {
    //     console.log('Automatic backups are enabled.');
    //     setInterval(() => {
    //         if (isServerJoinable) {
    //             createNewBackup(BACKUP_TYPE.AutomaticBackup, true).then((backupName) => {
    //                 console.log("An automatic backup was succesfully created! %s", backupName);
    //             }).catch((err) => {
    //                 console.warn(ConsoleColor.FgYellow, err, ConsoleColor.Reset);
    //             });
    //         }
    //     }, automaticBackups * 1000 * 60);
    // }else {
    //     console.log('Automatic backups are disabled, you can change this by changing the "automaticBackups" to a value greater than 1.');
    // }


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