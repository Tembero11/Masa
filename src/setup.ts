import figlet from "figlet";
import {  BotConfig, ServerMetadata, createConfigs, loadConfig, prettyPrint, writeConfig, writeServerMetadata, ServerListEntry, readServerMetadata, RawServerMetadata } from "./config";
import inquirer from "inquirer";
import inquirerAutocompletePrompt from "inquirer-autocomplete-prompt";
import chalk from "chalk";
import { client } from "./client";
import { nanoid } from "nanoid";
import Lang from "./classes/Lang";
import EnvCheck from "./classes/server/EnvCheck";
import pjson from "../package.json";
import { serverInstallerPrompt } from "./serverInstallerPrompt";
import { getBorderCharacters, table } from "table";
import openHTTP from "./api/openServer";
import Masa from "./classes/Masa";

inquirer.registerPrompt("autocomplete", inquirerAutocompletePrompt);

export let config: BotConfig;

const setup = async () => {
    // Print a cool 3D logo
    console.log(chalk.red(figlet.textSync("MASA", {
        font: "3D-ASCII"
    })));

    // Print the version of MASA
    console.log(`Running MASA ${chalk.green("v" + pjson.version)}`);

    const hasJava = await EnvCheck.hasJava(true);
    if (!hasJava) {
        console.log(chalk.yellow`WARNING: Java was not automatically detected! This may cause issues with running/installing servers. If an issue occurs please reinstall Java.`);
    }

    // Create all config files that don't already exist
    await createConfigs(async(filename) => {
        switch (filename) {
            case "bot.json":
                return prettyPrint(await botSetup());
            case "servers.json": {
                const installerResult = await serverInstallerPrompt([]);
                
                if (installerResult) {
                    const { dir } = installerResult;
                    const serverMeta = installerResult;
                    delete (serverMeta as RawServerMetadata & { dir?: string }).dir;
                    await writeServerMetadata(dir, serverMeta);

                    return prettyPrint([{ dir }])
                }

                return prettyPrint([]);
            }
            default:
                return null;
        }
    });

    // await createBackupsFolder(BackupType.Automatic);
    // await createBackupsFolder(BackupType.User);

    const serverList = await loadConfig<ServerListEntry[]>("servers.json");
    
    const serverMetaList: ServerMetadata[] = [];
    for (let i = 0; i < serverList.length; i++) {
        const serverEntry = serverList[i];
        // Generate a server tag if one doesn't exist yet
        if (!serverEntry.tag) {
            serverEntry.tag = nanoid(9);
        }
        try {
            const rawMeta = await readServerMetadata(serverEntry.dir);

            const meta: ServerMetadata = {
                ...rawMeta,
                tag: serverEntry.tag,
                directory: serverEntry.dir,
            }
            serverMetaList.push(meta);
        }catch(err) {
            console.log(chalk.yellow`WARNING: Server "${serverEntry.tag}" in directory "${serverEntry.dir}" has an invalid configuration and could not be loaded.`);
        }
    }
    await writeConfig("servers.json", prettyPrint(serverList));

    config = await loadConfig<BotConfig>("bot.json");

    // Set the bot locale
    Lang.setLocale(config.language);
    if (config.language) {
        console.log(`Using language ${Lang.langFile.name} (${config.language})`);
    }


    // Login to discord
    await connectToDiscord();

    const serverTable = table([
        ["Name", "Description", "Directory", "Tag"].map(title => chalk.bold.redBright(title)),
        ...serverMetaList.map(meta => {
            return [meta.name, meta.description || chalk.gray("No description"), meta.directory, meta.tag]
        }),
    ], {
        border: getBorderCharacters("honeywell")
    })

    console.log(serverTable.trim());

    await Masa.initializeServers(serverMetaList);
    
    openHTTP({ log: true })

    return true;
}

async function connectToDiscord() {
    console.log(`Connecting to ${chalk.blueBright("Discord")}...`);
    try {
        await client.login(config["token"]);

    }catch(err) {
        console.log(chalk.red`Could not connect to Discord! The token might be expired or invalid.\n`);

        const { setup } = await inquirer.prompt({
            message: "Do you want to reset the bot configuration?",
            name: "setup",
            type: "confirm",
        });

        if (setup) {
            config = await botSetup();
            await writeConfig("bot.json", prettyPrint(config));
            console.log(chalk.greenBright`Configuration saved successfully.`);
            await connectToDiscord();
        }else {
            console.log("Could not connect to Discord and a reset was cancelled. Masa will now kindly exit.");
            process.exit(0)
        }
    }
}

export const botSetup = async (): Promise<BotConfig> => {
    console.log(`Welcome to using ${chalk.red("Masa")}. To start off let's run a simple setup!`);

    const options: BotConfig = await inquirer.prompt(
        [
            {
                message: "Enter bot token",
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

export default setup;