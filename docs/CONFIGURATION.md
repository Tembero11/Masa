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
Permissions can be set for any group of users with a Discord role.

#### `permissions: object`
the `permissions` object has two main fields:

#### `permissions.roles: object`
Define roles here.
**Note**: These roles are not Discord roles but they do link to one.

Here is an example:

```json
"admin": {
  "id": "910250949329702943",
  "level": 10
}
```

#### `id: string`
The id of the role the Masa role links to.
#### `level: integer`
The role level defines how high the role permission is. The higher permission level will always override the permissions with a lower permission level. A permission level cannot be negative.

#### `permissions.commands: object`
This object defines what features each role has the permissions to. By default every command is disabled.

The key is the command name. For example let's take our earlier example role:

```json
"commands": {
  "start": "admin"
}
```

This example tells Masa that `admin` has permissions to start a server. You can also set multiple roles to have the `start` command, like so:

```json
"commands": {
  "start": ["admin", "moderator"]
}
```

There are also special roles that can be applied. All special roles start with the "@" character. Masa currently has two special roles: `@nobody` and `@everyone`.

Setting a command `@nobody` will prevent anyone even the guild owner to run the command. On the other hand setting a command `@everyone` will allow anyone on the guild to run the command.

This is the current list of supported command permissions:

* `start`
* `stop`
* `restart`
* `status`
* `backup`
* `backups`
* `latest`
* `help`
* `ping`
