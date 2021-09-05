import Discord from "discord.js";
import fs from "fs";
import path from "path";
import { Commands } from "./src/commands";
import { isAllowedChannel, setPresence, usesPrefix, withoutPrefix } from "./src/helpers";
import { start, stop, restart, Presence } from "./src/serverHandler";
import setup from "./src/setup";
import yaml from "js-yaml";
import { defaultConfig } from "./src/config";

export let config: {[key: string]: any};
try {
  const configPath = path.join(__dirname, "config.yml");

  if (fs.existsSync(configPath)) {
    config = yaml.load(fs.readFileSync(configPath, {encoding: "utf-8"})) as Object;

    console.log("Config was successfully loaded!");

  }else {
    fs.writeFileSync(configPath, defaultConfig, {encoding: "utf-8"});

    console.log("Please edit the config.yml file in the bot directory.");

    process.exit();
  }
}catch(err) {
  throw err;
}

export const client = new Discord.Client();

client.on("ready", () => {
  if (client.user) {
    console.log(`Logged in as ${client.user.tag}!`);

    setPresence(Presence.SERVER_OFFLINE);

    setup();
  }
});

client.on("message", msg => {
  if (usesPrefix(msg.content) && isAllowedChannel(msg.channel.id)) {
    Commands.runCommand(msg.content, msg);
  }
});

client.login(config["token"]);

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