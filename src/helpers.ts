import { Message, MessageEmbed } from "discord.js";
import { client, config } from "../index";



export const withoutPrefix = (content: string) => content.substr(config["prefix"].length);

export const usesPrefix = (content: string) => content.startsWith(config["prefix"]);

export const isAllowedChannel = (channelID: string) => {
  for (const allowedChannel of config["allowedChannels"]) {
    if (allowedChannel === channelID) {
      return true;
    }
  }

  return false;
}

export enum Presence {
  SERVER_ONLINE = "Server is joinable!",
  SERVER_STARTING = "Server is starting...",
  SERVER_STOPPING = "Server is stopping...",
  SERVER_OFFLINE = "Server is offline."
}

export const setPresence = (presence: Presence) => {
  if (client && client.user) {
    switch (presence) {
      case Presence.SERVER_ONLINE:
        client.user.setPresence({
          status: "online",
          activity: {
            type: "PLAYING",
            name: config["serverName"] || "Minecraft"
          },
        });
        break;
      
      case Presence.SERVER_STARTING:
        client.user.setPresence({
          status: "dnd",
          activity: {
            type: "WATCHING",
            name: `${config["serverName"] || "Server"} is starting...`
          },
        });
        break;
      
      case Presence.SERVER_STOPPING:
        client.user.setPresence({
          status: "dnd",
          activity: {
            type: "WATCHING",
            name: `${config["serverName"] || "Server"} is stopping...`
          },
        });
        break;
    
      default:

        client.user.setPresence({
          status: "idle",
          activity: {
            type: "LISTENING",
            name: `${config["serverName"] || "Server"} is offline!`
          },
        });

        break;
    }
  }
} 


export const getDefaultCommandEmbed = (msg: Message) => {
  return new MessageEmbed()
      .setColor(config["embedColor"] || "#5800fc")
      .setAuthor(msg.author.username, msg.author.avatarURL() || undefined);
}