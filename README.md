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

This will create a `config/config.yml` file in your bot's directory. This is where you need to paste your token from the Discord bot menu.
Now you can also configure other settings in the bot like how often to make backups. Also remember to set the allowedChannels to have at least one channel ID, otherwise the bot won't work.

When you have edited & saved the new config, run

  `$ npm start`

to start the bot.

To add your own server please create (if doesn't exist) a folder called "server". Here you need to add your own server file.
**Note**: MASA cannot run the server if the eula is not accepeted.

## Planned Features
- [ ] Add a build script
- [ ] Add a better way to see and interact with the server console
- [ ] Make the bot easier to install
- [ ] Add a finer control over the command permissions
- [ ] Better config error handling




