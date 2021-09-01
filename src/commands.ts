import Discord from "discord.js";
import { config } from "../index";
import { createNewBackup } from "./backup";

import { getDefaultCommandEmbed, withoutPrefix } from "./helpers";
import * as ServerHandler from "./serverHandler";

export type CommandHandler = (msg: Discord.Message) => void


export default interface Command {
  commandName: string 
  handler: CommandHandler
  desc: string
}

export class Commands {
  static commands: { [key: string]: Command } = {};

  static getCommand = (content: string) => {
    let noPrefix = withoutPrefix(content);
    
  
    let firstSpaceIndex = noPrefix.indexOf(" ");
    let commandName = noPrefix.substr(0, firstSpaceIndex < 0 ? undefined : firstSpaceIndex);


    return Commands.commands[commandName];
  }
  static addCommand = (commandName: string, desc: string, handler: CommandHandler) => {
    Commands.commands[commandName] = {
      commandName,
      handler,
      desc
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
Commands.addCommand("start", "Start the server", (msg) => {
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
Commands.addCommand("stop", "Stop the server", (msg) => {
  msg.reply("Stopping server... :cry:");
  
  ServerHandler.stop();
});
Commands.addCommand("restart", "Restart the server", (msg) => {
  msg.reply("Retarding Server...");
  
  ServerHandler.restart();
});
Commands.addCommand("easteregg", "An easter egg :egg:", (msg) => {
  msg.reply(config["easteregg"][Math.floor(Math.random() * config["easteregg"].length)]);
});

Commands.addCommand("backup", "Create a backup", (msg) => {
  createNewBackup().then(() => {
    let embed = getDefaultCommandEmbed(msg).setDescription("Backup succesfully created!");

    msg.channel.send(embed);
  }).catch(() => {
    let embed = getDefaultCommandEmbed(msg).setDescription("Backup creation failed!");

    msg.channel.send(embed);
  });
});

Commands.addCommand("help", "List of helpful commands", (msg) => {
  let embed = getDefaultCommandEmbed(msg);

  embed.setTitle("List of commands");
  embed.setDescription("A list of helpful commands for noobs");
  
  let fields = Object.values(Commands.commands).map((command) => {
    return {
      name: command.commandName,
      value: command.desc,
      inline: false,
    }
  });

  embed.addFields(fields);

  msg.channel.send(embed);
});