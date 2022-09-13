import path from "path";
import fs from "fs";
import chalk from "chalk";
import { Language } from "./classes/Lang";
import { PermissionSettings } from "./classes/PermissionManager";

export interface BotConfig {
  token: string
  clientID: string
  guildID: string
  language?: Language,
  developer?: {
    skipLanguageParsing?: boolean
  }
  permissions?: {
    roles: PermissionSettings
  }
  allowedChannels?: string[]
}

export interface RawServerMetadata {
  /**
   * The name of the minecraft server
   */
  name: string
  description: string
  /**
   * the command that starts the server. This runs inside the server folder
   */
  command: string


  // Whether to show logs to the masa console
  logs?: boolean,

  backups?: {
    backupLimit: number,
    backupInterval: string | number,
  },
  advanced?: {
    welcomeMsg?: string
    chat?: {
      channels?: string | string[]
      sendPlayerNetworkEvents?: boolean
      sendServerReadyEvent?: boolean
      allowDuplex?: boolean
    }
  }
}
export type ServerMetadata = { tag: string, directory: string, shouldTriggerRCONReset?: boolean } & RawServerMetadata;

export interface ServerListEntry {
  dir: string
  tag: string
  /**
   * Replaces the default masa.json file name with this value
   */
  index?: string
}

const configDir = path.join(process.cwd(), "config");

const configFiles = [
  "bot.json",
  "servers.json"
];

interface ConfigCreationResult {
  filename: string,
  content: string,
}

export const createConfigs = async(content?: (filename: string) => Promise<string | null>, soft: boolean = true): Promise<ConfigCreationResult[]> => {
  // Create the config folder if needed
  try {
    await fs.promises.stat(configDir);
  } catch (err) {
    await fs.promises.mkdir(configDir);
  }

  let createdConfigs: ConfigCreationResult[] = [];
  
  for (const filename of configFiles) {
    const filepath = path.join(configDir, filename);
    
    if (soft) {
      try {
        await fs.promises.stat(filepath);
        continue;
      }catch(err) {}
    }
    let fileContent: string = "";
    if (content) {
      fileContent = (await content(filename)) || "";
    }
    console.log(`Creating configuration file "${chalk.blueBright(filename)}"!`);
    await fs.promises.writeFile(filepath, fileContent, "utf8");

    createdConfigs.push({
      filename,
      content: fileContent
    });
  }

  return createdConfigs;
}

export const prettyPrint = (data: object) => {
  return JSON.stringify(data, null, 2);
}

export const loadConfig = async<T extends any>(filename: string): Promise<T> => {
  const filePath = path.join(configDir, filename);
  
  const content = await fs.promises.readFile(filePath, "utf8");
  const contentParsed = JSON.parse(content);
  return contentParsed as T;
}

export const writeConfig = async(filename: string, data: string) => {
  await fs.promises.writeFile(path.join(configDir, filename), data, {encoding: "utf8"});
}

export async function writeServerMetadata(serverDir: string, metadata: RawServerMetadata, index = "masa.json") {
  await fs.promises.writeFile(path.join(serverDir, index), prettyPrint(metadata), {encoding: "utf8"});
}
export async function readServerMetadata(serverDir: string, index = "masa.json") {
  return JSON.parse(await fs.promises.readFile(path.join(serverDir, index), {encoding: "utf8"})) as RawServerMetadata;
}