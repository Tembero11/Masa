import { BACKUP_TYPE, createBackupsFolder } from "./backup";
import { serverDir } from "./helpers";
import readline from "readline";
import figlet from "figlet";
import fs from "fs";
import path from "path";
import { config } from "../index";
import { serverInitializer } from "./serverHandler";
import { loadServerList, writeServerList } from "./config";
import inquirer from "inquirer";
import inquirerAutocompletePrompt from "inquirer-autocomplete-prompt";
import VanillaInstaller from "./classes/server/installer/VanillaInstaller";
import chalk from "chalk";
import Installer, { VersionManifest } from "./classes/server/installer/Installer";
import PaperInstaller from "./classes/server/installer/PaperInstaller";
import assert from "assert";

inquirer.registerPrompt("autocomplete", inquirerAutocompletePrompt);

const setup = async () => {
    let packageJson = JSON.parse(fs.readFileSync(path.join(process.cwd(), "package.json"), "utf-8"));

    console.log(`Running MASA ${chalk.green("v" + packageJson["version"])}`);
    
    console.log(chalk.red(figlet.textSync("MASA", {
        font: "3D-ASCII"
    })));

    await createBackupsFolder(BACKUP_TYPE.AutomaticBackup);
    await createBackupsFolder(BACKUP_TYPE.UserBackup);


    let serverList = await loadServerList();

    if (serverList.length <= 0) {
        console.log("No servers were found! Running setup.");
        serverInstaller();
    }

    serverInitializer(serverList);


    // Setup console commands
    // let rl = readline.createInterface({
    //     input: process.stdin,
    //     output: process.stdout
    // });
    // let recursiveQuestion = () => {
    //     rl.question("MASA> ", (answer) => {
    //         let index = answer.indexOf(" ");
    //         let end = index > 0 ? index : undefined;
    //         let command = answer.substring(0, end);
    //         let args = answer.split(" ").splice(1) || [];

    //         switch (command) {
    //             case "players":
    //                 if (args[0]) {
    //                     let server = servers.get(args[0]);
    //                     if (server) {
    //                         if (server.isJoinable) {
    //                             console.log(`Server has ${server.playerCount} players!`);
    //                         } else {
    //                             console.log(`Server is not joinable!`);
    //                         }
    //                     } else {
    //                         console.log(`Server was not found!`);
    //                     }
    //                 }
    //                 break;
    //             case "install":
    //                 serverInstaller();
    //                 break;
    //             case "exit":
    //                 process.exit();
    //             default:
    //                 if (answer.length > 0) {
    //                     console.log("Unknown command!");
    //                 }
    //                 break;
    //         }
    //         recursiveQuestion();
    //     });
    // }
    // recursiveQuestion();


    return true;
}

export const serverInstaller = async () => {
    let serverList = await loadServerList();
    let options: { [key: string]: any } = {};

    options.willInstall = (await inquirer.prompt(
        [{
            message: "No servers found. Would you like to install a new one?",
            name: "willInstall",
            type: "confirm",
        }],
    )).willInstall as boolean;

    if (!options.willInstall) {
        console.log("No servers to take care of. MASA will now exit :(");
        process.exit();
    }

    options.serverType = (await inquirer.prompt([{
        message: "What kind of server would you like to install?",
        name: "serverType",
        type: "list",
        choices: [
            { name: "Vanilla" },
            { name: "Spigot", },
            { name: "Forge" },
            { name: "Paper" },
        ]
    }])).serverType as string;

    options.version = (await inquirer.prompt([{
        message: "What version do you want to play?",
        name: "version",
        type: "autocomplete",
        source: async function (answersSoFar: any, input: string) {
            input = input || "latest";
            let manifest: VersionManifest | null = null;
            switch (options.serverType) {
                case "Vanilla":
                    manifest = await VanillaInstaller.getVersions();
                case "Paper":
                    manifest = await PaperInstaller.getVersions();
                default:
                    break;
            }
            if (manifest) {
                if (input.startsWith("latest")) {
                    input = manifest.latest.release;
                }
    
                return manifest.versions
                .filter((value) => value.id.startsWith(input) && (value.type == "release"))
                .map((e) => e.id);
            }
        }
    }])).version as string;

    options.dir = (await inquirer.prompt([{
        message: "Where will the server be installed? (path to folder)",
        name: "dir",
        type: "input",
        validate: async (input) => {
            if (fs.existsSync(input)) {
                let contents = await fs.promises.readdir(input);
                if (contents.length != 0) {
                    return "Directory not empty!";
                }
            }
            return true;
        }
    }])).dir as string;

    options.name = (await inquirer.prompt([{
        message: "What should we call the server?",
        name: "name",
        type: "input",
        validate: async (input) => {
            let server = serverList.find((e => e.name == input));
            if (server) {
                return "Server name is taken";
            }
            return true;
        }
    }])).name as string;

    let eula = (await inquirer.prompt([{
        message: "Do you accept the End User License Agreement (EULA) (https://account.mojang.com/documents/minecraft_eula)?",
        name: "eula",
        type: "confirm",
    }])).eula as boolean;

    if (options.willInstall && eula) {
        let installer: null | Installer = null;
        switch (options.serverType) {
            case "Vanilla":
                installer = new VanillaInstaller(options.version);
                break;
            case "Paper":
                installer = new PaperInstaller(options.version);
                break;
            default:
                break;
        }

        assert(installer);

        await installer.acceptEULA().install(options.dir);
        serverList.push({
            name: options.name as string,
            command: "j",
            description: "",
            directory: options.dir as string
        });

        await writeServerList(serverList);
    }
}

export default setup;