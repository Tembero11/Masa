import figlet from "figlet";
import fs from "fs";
import path from "path";
import { ServerHandler } from "./serverHandler";
import {  BotConfig, ServerMetadata, createConfigs, loadConfig, prettyPrint, writeConfig } from "./config";
import inquirer from "inquirer";
import inquirerAutocompletePrompt from "inquirer-autocomplete-prompt";
import VanillaInstaller from "./classes/server/installer/VanillaInstaller";
import chalk from "chalk";
import Installer, { VersionManifest } from "./classes/server/installer/Installer";
import PaperInstaller from "./classes/server/installer/PaperInstaller";
import assert from "assert";
import { client } from "./client";
import { nanoid } from "nanoid";
import Lang from "./classes/Lang";

inquirer.registerPrompt("autocomplete", inquirerAutocompletePrompt);

export let config: BotConfig;

const setup = async () => {
    // Load the package.json file
    const packagejson = await fs.promises.readFile(path.join(process.cwd(), "package.json"), "utf8");
    // Parse the package.json file
    const parsedPackageJson = JSON.parse(packagejson);

    // Print the version of MASA
    console.log(`Running MASA ${chalk.green("v" + parsedPackageJson["version"])}`);
    
    // Print a cool 3D logo
    console.log(chalk.red(figlet.textSync("MASA", {
        font: "3D-ASCII"
    })));

    // Create all config files that don't already exist
    await createConfigs(async(filename) => {
        switch (filename) {
            case "bot.json":
                return prettyPrint(await botSetup());
            case "servers.json":
                return prettyPrint([await serverInstaller([])]);
            default:
                return null;
        }
    });

    // await createBackupsFolder(BackupType.Automatic);
    // await createBackupsFolder(BackupType.User);

    let serverList = await loadConfig<ServerMetadata[]>("servers.json");
    serverList = serverList.map((e) => {
        if (!e.tag) {
            e.tag = nanoid(9);
        }
        return e;
    });
    await writeConfig("servers.json", prettyPrint(serverList));
    

    config = await loadConfig<BotConfig>("bot.json");

    // Set the bot locale
    Lang.setLocale(config.language);
    if (config.language) {
        console.log(`Using language ${Lang.langFile.name} (${config.language})`);
    }


    // // Login to discord
    await client.login(config["token"]);

    ServerHandler.serverInitializer(serverList);


    return true;
}

export const botSetup = async (): Promise<BotConfig> => {
    console.log(`Welcome to using ${chalk.red("MASA")}. To start off let's run a simple setup!`);

    let options: BotConfig = await inquirer.prompt(
        [
            {
                message: "Enter the bot token",
                name: "token",
                type: "input",
            },
            {
                message: "Enter your bot application's client id",
                name: "clientID",
                type: "input",
            },
            {
                message: "Enter the server's id",
                name: "guildID",
                type: "input",
            },
        ],
    );
    return options;
}

export const serverInstaller = async (serverList: ServerMetadata[]) => {
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

        return {
            name: options.name as string,
            command: `java -Xmx1024M -Xms1024M -jar ${installer.filename} nogui`,
            description: "",
            directory: options.dir as string
        };
    }
}

export default setup;