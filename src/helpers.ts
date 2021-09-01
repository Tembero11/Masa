import { Message, MessageEmbed } from "discord.js";
import { client, config } from "../index";
import path from "path";

export const serverDir = path.join(process.cwd(), "server");

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

export type DateString = `${number}.${number}-${number}.${number}`;

export const createDateTimeString = (): DateString => {
  let date = new Date();
  return `${date.getDate()}.${date.getMonth() + 1}-${date.getHours()}.${date.getMinutes()}`;
}



export const parseDateTimeString = (timeString: DateString): Date => {
  let date = new Date();

  let array = timeString.split(/\.|\-/);

  date.setDate(parseInt(array[0]));
  date.setMonth(parseInt(array[1]));
  date.setHours(parseInt(array[2]));
  date.setMinutes(parseInt(array[3]));

  return date;
}