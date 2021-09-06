import Discord from "discord.js";
import { config } from "../index";
import { BACKUP_TYPE, createNewBackup, getLatestBackup, listBackups } from "./backup";

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

// Adds Commands
export const addCommands = () => {
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
    let embed = getDefaultCommandEmbed(msg)
    .setDescription("Server is stopping...");
  
    msg.channel.send(embed).then((msg) => {
      ServerHandler.stop().then((result) => {
        embed.setDescription(result.status);
        msg.edit(embed);
      });
    });
  });
  Commands.addCommand("restart", "Restart the server", (msg) => {
    let embed = getDefaultCommandEmbed(msg)
    .setDescription("Server is restarting...");
  
    msg.channel.send(embed).then((msg) => {
      ServerHandler.restart().then((result) => {
        embed.setDescription(result.status);
        msg.edit(embed);
      }).catch((result) => {
        embed.setDescription(result.status);
        msg.edit(embed);
      });
    })
  });
  Commands.addCommand("easteregg", "An easter egg :egg:", (msg) => {
    msg.reply(config["easteregg"][Math.floor(Math.random() * config["easteregg"].length)]);
  });
  
  
  Commands.addCommand("backup", "Create a backup", (msg) => {
    createNewBackup(BACKUP_TYPE.UserBackup).then(() => {
      let embed = getDefaultCommandEmbed(msg).setDescription("Backup succesfully created!");
  
      msg.channel.send(embed);
    }).catch(() => {
      let embed = getDefaultCommandEmbed(msg).setDescription("Backup creation failed!");
  
      msg.channel.send(embed);
    });
  });
  
  Commands.addCommand("backups", "List all backups", (msg) => {
    listBackups(BACKUP_TYPE.AutomaticBackup).then((autoBackups) => {
      listBackups(BACKUP_TYPE.UserBackup).then((userBackups) => {
        const mapper = (backup: string) => {
          return `- ${backup}`
        }
        let backups = [
          "**User backups**",
          ...userBackups.map(mapper),
          userBackups.length < 1 ? "No user backups" : "",
  
          "\n**Automatic Backups**",
          ...autoBackups.map(mapper),
          autoBackups.length < 1 ? "No automatic backups" : "",
        ];
  
        let embed = getDefaultCommandEmbed(msg).setTitle("Backups listed").setTimestamp();
    
        embed.setDescription(backups.join("\n"));
    
        msg.channel.send(embed);
      });
    });
  });
  
  Commands.addCommand("latest_backup", "Get the latest backup", (msg) => {
    getLatestBackup(true).then((latest) => {
      let embed = getDefaultCommandEmbed(msg).setTitle("The latest backup is...").setDescription(latest);
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
  
  Commands.addCommand("online", "List of players currently online on the server", (msg) => {
    let embed = getDefaultCommandEmbed(msg);
  
    embed.setTitle("Server Status");
  
    if (ServerHandler.isServerJoinable) {
      embed.setDescription("All systems operational :green_circle:");
    }else if (!ServerHandler.commandProcess) {
      embed.setDescription(`${config["serverName"] || "Server"} is currenly offline :red_circle:`);
    }else if (ServerHandler.serverStatus === ServerHandler.Presence.SERVER_STARTING) {
      embed.setDescription(`${config["serverName"] || "Server"} is currenly starting :yellow_circle:`);
    }else if (ServerHandler.serverStatus === ServerHandler.Presence.SERVER_STOPPING) {
      embed.setDescription(`${config["serverName"] || "Server"} is currenly stopping :yellow_circle:`);
    }
  
    if (config["showPlayers"]) {
      let playerList = Array.from(ServerHandler.players.keys()).join("\n");
  
      if (!playerList) {
        playerList = "No players online";
      }
  
      embed.addField(`${ServerHandler.players.size} online`, playerList);
    }
  
    
  
    embed.setTimestamp();
  
    msg.channel.send(embed);
  });
  
  // Only add the seeds command if seed are enabled
  if (config["showWorldSeeds"]) {
    Commands.addCommand("seeds", "Gets the seed(s) for the world(s)", msg => {
      ServerHandler.getSeed().then((seeds) => {
        let embed = getDefaultCommandEmbed(msg);
    
        if (seeds.length > 1) {
          embed.setTitle("World seeds");
        }else {
          embed.setTitle("World seed");
        }
    
        embed.setDescription(seeds.map((seed) => `${seed}`).join("\n"));
    
        msg.channel.send(embed);
      }).catch((err) => {
        let embed = getDefaultCommandEmbed(msg);
    
        embed.setDescription(err);
    
        msg.channel.send(embed);
      });
    });
  }
}