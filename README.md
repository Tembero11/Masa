# MASA

A discord bot built around hosting a Minecraft Server


#### How To install? (for now)
MASA is currently officially supported and tested on Windows 10 & Ubuntu 20.04 (LTS) x64 

The current package requires  and npm is required for the installation process.
Required Software
* Node.js <= 12.0.0
* npm
* git

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

This will create a `config.yml` file in your bot's directory. This is where you need to paste your token from the Discord bot menu.
Now you can also configure other settings in the bot like how often to make backups. Also remember to set the allowedChannels to have at least one channel ID, otherwise the bot won't work.

When you have edited & saved the new config, run

  `$ npm start`

to start the bot.
