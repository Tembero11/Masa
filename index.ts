import Discord from "discord.js";
import fs from "fs";
import path from "path";
import { Commands } from "./src/commands";
import { isAllowedChannel, setPresence, usesPrefix, } from "./src/helpers";
import { Presence } from "./src/serverHandler";
import setup from "./src/setup";
import yaml from "js-yaml";
import { CONFIG_TYPE, createConfig, loadConfig } from "./src/config";

export let config: {[key: string]: any};

export const client = new Discord.Client();

client.once("ready", () => {
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


try {
  createConfig().then((created) => {
    if (created) {
      console.log("Please edit the config/config.yml file in the bot directory.");
      process.exit();
    }else {
      config = loadConfig(CONFIG_TYPE.General.path);

      console.log("Config was successfully loaded!");

      client.login(config["token"]);
    }
  });
  

  // if (fs.existsSync(configPath)) {
  //   config = yaml.load(fs.readFileSync(configPath, {encoding: "utf-8"})) as Object;

  //   console.log("Config was successfully loaded!");

  // }else {
  //   inquirer.prompt([
  //     {
  //       type: "confirm",
  //       message: '"config.yml" not found. Do you want to run a setup?',
  //       name: "runSetup",
  //     }
  //   ]).then((result) => {
  //     if (result.runSetup) {
  //       inquirer.prompt([
  //         {
  //           type: "input",
  //           message: "What's the server called?",
  //           name: "serverName",
  //         },
  //         {
  //           type: "input",
  //           message: "Enter the bot token here",
  //           name: "token",
  //         },
  //         {
  //           type: "confirm",
  //           message: "Do you want the bot to be able to show players that are online?",
  //           name: "showPlayers",
  //         },
  //         {
  //           type: "confirm",
  //           message: "Do you want to make the seed public?",
  //           name: "showWorldSeed",
  //         },
  //         {
  //           type: "confirm",
  //           message: "Do you want to enable backups?",
  //           name: "useBackups",
  //         },
  //       ]).then((result) => {
  //       }).catch((err) => console.log("An unknown error occured. Setup failed!"));
  //     }else {
  //       fs.writeFileSync(configPath, defaultConfig, {encoding: "utf-8"});
  //       console.log("Please edit the config.yml file in the bot directory.");
  //       process.exit();
  //     }
  //   }).catch((err) => {
  //     if (err) {
  //       fs.writeFileSync(configPath, defaultConfig, {encoding: "utf-8"});
  //       console.log("Please edit the config.yml file in the bot directory.");
  //       process.exit();
  //     }
  //   })
  // }
}catch(err) {
  throw err;
}


process.on("uncaughtException", (err) => {
  const logs = path.join(__dirname, "logs");
  
  if (!fs.existsSync(logs)) {
    fs.mkdirSync(logs);
  }

  let date = new Date();
  let logName = `${date.getDate()}.${date.getMonth() + 1}-${date.getHours()}.${date.getMinutes()}.log`;

  const errorMessage = `${err.name}:\n${err.message}\n${err.stack}`;

  fs.writeFileSync(path.join(logs, logName), errorMessage);

  throw err;
});