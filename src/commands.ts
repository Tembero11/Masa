import Discord from "discord.js";
import { config } from "../index";
import { createNewBackup } from "./backup";

import { getDefaultCommandEmbed, withoutPrefix } from "./helpers";
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
      let embed = getDefaultCommandEmbed(msg)
      .setColor("#ff0000")
      .setDescription("Unknown command")

      msg.channel.send(embed);
    }
  }
}

// Add Commands
Commands.addCommand("start", (msg) => {
  let embed = getDefaultCommandEmbed(msg)
  .setDescription("Server is starting...")

  msg.channel.send(embed).then((msg) => {
    ServerHandler.start().then((result) => {
      embed.setDescription(result.status);
      msg.edit(embed);
    }).catch((result) => {
      embed.setDescription(result.status);
      msg.edit(embed);
    });
  });
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
});

Commands.addCommand("backup", (msg) => {
  createNewBackup()

  msg.reply("Hello")
});