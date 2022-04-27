# Configuration

All Masa configs are inside a folder called `config` in the root directory. There are two main configuration files both using the [JSON](https://www.json.org/) format. The files are `bot.json` which includes the bot token and other information regarding the bot and `servers.json` which contains information about every Minecraft server you have installed.

# Server configuration
#### `servers.json`
Here is a `servers.json` example file

**Important Note**: This example is JSONC (JSON with comments) but in a real enviroment comments are not supported!

```jsonc
[
  {
    "name": "ExampleServer", // The name of the server
    "command": "java...", // The command that will be run to start the server
    "description": "", // A description of the server
    "directory": "~/server", // The server directory. This is where the command is run
    "logs": true, // Whether to enable this server's logs to the Masa console
    "advanced": {
      "welcomeMsg": "Hello {PLAYER}" // Sent to every player every time they join
    },
    "backups": { // If this field exists backups will be made
      "backupInterval": "30d", // How often to make backups
      "backupLimit": 5 // How many backups will be stored at once
    },
    "tag": "gVED_X1J8" // The server tag. Do not edit this field!
  },
]
```

## Fields one by one

#### `name: string`
The name of the server. This is used for the commands for example `/start nameHere`. It is recommended to have the name written as camelCase but almost any unicode character will work.
#### `command: string`
The command that will be ran when the server is asked to start. This is usually something along the lines of `java -jar server.jar nogui`
#### `description: string`
Something that describes your server.
#### `directory: string`
The directory where the above field `command` is ran. It is recommended that an absolute path to the directory is provided.
#### `logs: boolean`
Whether to enable or disable logs to the server console. If `true` logs are enabled.
#### `advanced: object`
This contains advanced fields.
#### `advanced.welcomeMsg: string`
This will be sent to any player every time they join. You can use dynamic arguments here like `{PLAYER}` will be replaced with the player's username who joined. Similarly using `{ONLINE}` will be replaced with the current player count on the server.
#### `backups: object`
If this field has a truthy value backups will automatically be enabled.
#### `backups.backupInterval: string`
How often a new automatic backup is made. This string is parsed using the [ms package](https://github.com/vercel/ms).
#### `backups.backupLimit: integer`
The amount of backups stored once. If this limit is exceeded the oldest backup will be deleted permanently when a new backup is made.
#### `tag: string`
This is a [nanoid](https://github.com/ai/nanoid) generated automatically. It is used as a discriminator between two servers, even if they have the same name. You shouldn't set this field manually.

# Bot configuration
#### `bot.json`

#### `token: string`
This is the bot token taken from Discord and is used to login to Discord.
#### `clientID: string`
This is the application's client ID found under the Discord application's OAuth menu.
#### `guildID: string`
Your Discord guild's (Server's) id.
#### `language: string`
The language that Masa uses when running commands in Discord. You can find the list of supported languages [here](https://github.com/MasaBot/Masa/blob/main/docs/LANGUAGES.md).

**Note**: This does not affect the logs Masa produces.

## Permissions

To setup permissions look at [permissions](https://github.com/MasaBot/Masa/blob/main/docs/PERMISSIONS.md).