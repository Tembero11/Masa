import path from "path";
import fs from "fs";
import yaml from "js-yaml";

export const defaultConfig = `
# the token for the bot
token: ''

# The apps clientID
clientID: ''
# The Discord server's id
guildID: ''

servers:
    # The name of the minecraft server
  - name: 'example server'
    description: 'an awesome server'
    # The command that starts the server. This runs inside the server folder
    command: 'java -Xmx1024M -Xms1024M -jar server.jar nogui'
    # The directory where the server files are
    directory: '~/server'

# A list of allowed channels that the bot can respond to
allowedChannels:
- '868036689384524811'


# A hex color value for the Discord embeds
embedColor: "#5800fc"

# whether to show world seed
showWorldSeeds: true

backup:
  # true if backups are enabled
  useBackups: true
  # true if users can create backups
  userBackups: true
  # The maximum amount of backups at once
  backupLimit: 5
  # Create automatic backups every x minutes. If less than 1 automatic backups will get disabled.
  automaticBackups: 1

# Whether to show online data about the players
showPlayers: true
`;

export interface ServerMetadata {
  /**
   * The name of the minecraft server
   */
  name: string
  description: string
  /**
   * the command that starts the server. This runs inside the server folder
   */
  command: string
  /**
   * The directory where the server files are
   */
  directory: string
}

export interface DefaultConfig {
  /**
   * the token for the bot
   */
  token: string
  /**
   * The apps clientID
   */
  clientID: string
  /**
   * The Discord server's id
   */
  guildID: string

  servers: ServerMetadata[]
  /**
   * A list of allowed channels that the bot can respond to
   */
  allowedChannels: string[]
  /**
   * A hex color value for the Discord embeds
   */
  embedColor: string
  /**
   * whether to show world seed
   */
  showWorldSeeds: boolean
  backup: {
    /**
     * true if backups are enabled
     */
    useBackups: boolean
    /**
     * true if users can create backups
     */
    userBackups: boolean
    /**
     * The maximum amount of backups at once
     */
    backupLimit: number
    /**
     * Create automatic backups every x minutes. If less than 1 automatic backups will get disabled.
     */
    automaticBackups: number
  }
  /**
   * Whether to show online data about the players
   */
  showPlayers: boolean
}

export const developerConfig = `# This file currently has no point`;

const configDir = path.join(process.cwd(), "config");

export const CONFIG_TYPE = {
  General: {
    path: path.join(configDir, "config.yml"),
    default: defaultConfig,
  },
  Developer: {
    path: path.join(configDir, "developer.yml"),
    default: ""
  }
}

/**
 * Creates all config files if doesn't exist
 * @returns true if a file was created
 */
export const createConfig = async () => {
  if (!fs.existsSync(configDir)) {
    await fs.promises.mkdir(configDir);
  }

  let result = false;

  for (const key in CONFIG_TYPE) {
    if (Object.prototype.hasOwnProperty.call(CONFIG_TYPE, key)) {
      const config = CONFIG_TYPE[key as "General" | "Developer"];
      if (!fs.existsSync(config.path)) {
        await fs.promises.writeFile(config.path, config.default, { encoding: "utf-8" });
        result = true;
      }
    }
  }

  return result;
}


export const loadConfig = <T extends "General" | "Developer">(type: T): T extends "General" ? DefaultConfig : any => {
  return yaml.load(fs.readFileSync(CONFIG_TYPE[type].path, { encoding: "utf-8" })) as any;
}
