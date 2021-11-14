import path from "path";
import fs from "fs";
import chalk from "chalk";

export interface BotConfig {
  token: string
  clientID: string
  guildID: string
  allowedChannels?: string[]
}

export interface ServerMetadata {
  /**
   * The name of the minecraft server
   */
  name: string
  tag: string
  description: string
  /**
   * the command that starts the server. This runs inside the server folder
   */
  command: string
  /**
   * The directory where the server files are
   */
  directory: string,

  // Whether to show logs to the masa console
  logs?: boolean,

  backups?: {
    backupLimit: number,
    backupInterval: string | number,
  },
  advanced?: {
    welcomeMsg?: string
  }
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

export const prettyPrint = (data: Object) => {
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