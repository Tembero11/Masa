import Discord from "discord.js";
import fs from "fs";
import path from "path";
import { Commands } from "./src/commands";
import { isAllowedChannel, Presence, setPresence, usesPrefix, withoutPrefix } from "./src/helpers";
import { start, stop, restart } from "./src/serverHandler";
import setup from "./src/setup";

export const config = JSON.parse(fs.readFileSync(path.join(__dirname, "config.json"), {encoding: "utf-8"}));

export const client = new Discord.Client();

client.on("ready", () => {
  if (client.user) {
    console.log(`Logged in as ${client.user.tag}!`);

    setPresence(Presence.SERVER_OFFLINE);

    // debug
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