# MASA

A [Discord](https://discord.com/) bot built around hosting a Minecraft Server.

## Why?
I Build MASA for first as kind of a meme when we needed to easily be able to restart the server and well... what a better way to do just that than a Discord bot with restart commands. Now I did get off tracks a little bit and added other functionality like backups and I'm planning on adding a lot of new features.

**Note**: Many of these commands can be configured quite easily.


## How To install? (for now)
MASA is currently officially supported and tested on Windows 10 & Ubuntu 20.04 (LTS) x64 


Required Software to run version `0.0.1`
* **Node.js <= 12.0.0**
* **npm**
* **git**
* **Java JRE** is required for actually running the Minecraft server

Before you install anything please make sure you have a [Discord Application](https://discord.com/developers/applications) with a bot created within the wanted application.

Now back to the installation:

To install clone the repo using 

  `$ git clone https://github.com/Tembero11/MASA.git`
  
Now cd into the directory using

  `$ cd MASA`
  
Then install all the required packages run

  `$ npm i`
 
Now to run the setup for the bot run

  `$ npm start`

## Setting up a server

MASA will now ask you to enter your bot/app details to the server console. After entering the bot details MASA will prompt you to install a server software E.g. Vanilla or Paper. 

You can cancel the automatic installation & use a custom installation or a previous server you have one. To install a server manually you need to have a basic understanding of JSON. Head on over to the MASA directory and search for the `config` folder this should have a `servers.json` file inside if there isn't, create one. Here is an easy example of a server:

```json
{
  "name": "example",
  "command": "java -Xmx1024M -Xms1024M -jar example_server.jar nogui",
  "description": "This is an example server.",
  "directory": "~/example/dir"
}
```
The above JSON is called a server metadata object.


The first field `name` should be the name you want to call the server.
The second field `command` is the command MASA runs when it wants to start the server.
The fourth field `directory` is the directory where the command is executed.

The servers are stored inside the file in brackets `[]` or in other words a JSON array. There is no limit to how many servers MASA can handle.

**Note**: MASA cannot run the server if the eula is not accepeted.

**Another note**: Everytime you make a configuration change make sure to restart MASA to reload all configurations.


## Planned Features before 1.0
- [x] Add buttons to the command results
- [x] Add a server installer
- [ ] Add chat streaming to Discord & make server commands runnable from Discord
- [ ] Add a build script
- [ ] Add a better way to see and interact with the server console
- [ ] Make the bot easier to install
- [ ] Add a finer control over the command permissions
- [ ] Better config error handling




