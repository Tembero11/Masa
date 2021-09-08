import Discord from "discord.js";
import fs from "fs";
import path from "path";
import { Commands } from "./src/commands";
import { isAllowedChannel, setPresence, usesPrefix, withoutPrefix } from "./src/helpers";
import { start, stop, restart, Presence } from "./src/serverHandler";
import setup from "./src/setup";
import { defaultConfig } from "./src/config";
import inquirer from "inquirer";
import yaml from "js-yaml";
import YAWN from "yawn-yaml";

export let config: {[key: string]: any};
try {
  let yawn = new YAWN(defaultConfig);

  const configPath = path.join(__dirname, "config.yml");

  

  if (fs.existsSync(configPath)) {
    config = yaml.load(fs.readFileSync(configPath, {encoding: "utf-8"})) as Object;

    console.log("Config was successfully loaded!");

  }else {
    inquirer.prompt([
      {
        type: "confirm",
        message: '"config.yml" not found. Do you want to run a setup?',
        name: "runSetup",
      }
    ]).then((result) => {
      console.log(result);

      if (result.runSetup) {
        inquirer.prompt([
          {
            type: "input",
            message: "What's the server called?",
            name: "serverName",
          },
          {
            type: "input",
            message: "Enter the bot token here",
            name: "token",
          },
          {
            type: "confirm",
            message: "Do you want the bot to be able to show players that are online?",
            name: "showPlayers",
          },
          {
            type: "confirm",
            message: "Do you want to make the seed public?",
            name: "showWorldSeed",
          },
          {
            type: "confirm",
            message: "Do you want to enable backups?",
            name: "useBackups",
          },
        ]).then((result) => {
          console.log(result);


        }).catch((err) => console.log("An unknown error occured. Setup failed!"));
      }else {
        fs.writeFileSync(configPath, defaultConfig, {encoding: "utf-8"});
        console.log("Please edit the config.yml file in the bot directory.");
        process.exit();
      }
    }).catch((err) => {
      if (err) {
        fs.writeFileSync(configPath, defaultConfig, {encoding: "utf-8"});
        console.log("Please edit the config.yml file in the bot directory.");
        process.exit();
      }
    })
  }
}catch(err) {
  throw err;
}

export const client = new Discord.Client();

client.on("ready", () => {
  if (client.user) {
    console.log(`Logged in as ${client.user.tag}!`);

    setPresence(Presence.SERVER_OFFLINE);

    setup().then((success) => {
      if (success) {
        console.log("Successfully started!");
      }
    });
  }
});

client.on("message", msg => {
  if (usesPrefix(msg.content) && isAllowedChannel(msg.channel.id)) {
    Commands.runCommand(msg.content, msg);
  }
});

// client.login(config["token"]);

// process.on("uncaughtException", (err) => {
//   const logs = path.join(__dirname, "logs");
  
//   if (!fs.existsSync(logs)) {
//     fs.mkdirSync(logs);
//   }

//   let date = new Date();
//   let logName = `${date.getDate()}.${date.getMonth() + 1}-${date.getHours()}.${date.getMinutes()}.log`;

//   const errorMessage = `${err.name}:\n${err.message}\n${err.stack}`;

//   fs.writeFileSync(path.join(logs, logName), errorMessage);

//   throw err;
// });