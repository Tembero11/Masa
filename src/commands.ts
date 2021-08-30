import Discord from "discord.js";
import { config } from "../index";

import { withoutPrefix } from "./helpers";
import * as ServerHandler from "./serverHandler";

export type CommandHandler = (msg: Discord.Message) => void


export default interface Command {
  commandName: string 
  handler: CommandHandler
}

export class Commands {
  private static commands: { [key: string]: Command } = {};

  static getCommand = (content: string) => {
    let noPrefix = withoutPrefix(content);
    
  
    let firstSpaceIndex = noPrefix.indexOf(" ");
    let commandName = noPrefix.substr(0, firstSpaceIndex < 0 ? undefined : firstSpaceIndex);


    return Commands.commands[commandName];
  }
  static addCommand = (commandName: string, handler: CommandHandler) => {
    Commands.commands[commandName] = {
      commandName,
      handler
    }
  }

  static runCommand(command: string, msg: Discord.Message) {
    let handler = Commands.getCommand(command)?.handler;

    if (handler) {
      handler(msg);
    }else {
      let embed = new Discord.MessageEmbed()
      .setColor("#ff0000")
      .setAuthor(msg.author.username, msg.author.avatarURL() || undefined)
      .setDescription("Unknown command")

      msg.channel.send(embed);
    }
  }
}

// Add Commands
Commands.addCommand("start", (msg) => {
  msg.reply("Server starting now... :slight_smile:");

  ServerHandler.start();
});
Commands.addCommand("stop", (msg) => {
  msg.reply("Stopping server... :cry:");
  
  ServerHandler.stop();
});
Commands.addCommand("restart", (msg) => {
  msg.reply("Retarding Server...");
  
  ServerHandler.restart();
});
Commands.addCommand("easteregg", (msg) => {
  msg.reply(config["easteregg"][Math.floor(Math.random() * config["easteregg"].length)]);
})