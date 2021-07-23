import Discord from "discord.js";
import fs from "fs";
import path from "path";
import { start, stop, restart, getSeed } from "./serverHandler";

export const config = JSON.parse(fs.readFileSync(path.join(__dirname, "config.json"), {encoding: "utf-8"}));

const client = new Discord.Client();

client.on("ready", () => {
  if (client.user) {
    console.log(`Logged in as ${client.user.tag}!`);
  }
});

client.on("message", msg => {
  if (msg.content.startsWith(config["prefix"])) {
    switch (msg.content.substr(config["prefix"].length)) {
      case "start":
        msg.reply("Server starting now... :slight_smile:");

        start();
        break;
      
      case "stop":
        msg.reply("Stopping server... :cry:");
  
        stop();
        break;
      
      case "restart":
        msg.reply("Retarding Server...");
  
        restart();
        break;

      case "easteregg":
        msg.reply(config["easteregg"][Math.floor(Math.random() * config["easteregg"].length)]);
        break;

      case "":
        msg.reply(config["easteregg"][Math.floor(Math.random() * config["easteregg"].length)]);
        break;
      default:
        break;
    }
  }
});

client.login(config["token"]);