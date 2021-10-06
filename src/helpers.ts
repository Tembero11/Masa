import { Message, MessageEmbed } from "discord.js";
import { client, config } from "../index";
import path from "path";
import { players, Presence } from "./serverHandler";

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



export const setPresence = (presence: Presence) => {
  if (client && client.user) {
    switch (presence) {
      case Presence.SERVER_ONLINE:
        let gameName = config["serverName"] || "Minecraft"
        let presenceName: string = gameName;

        if (config["showPlayers"]) {
          if (players.size === 1) {
            presenceName = `${gameName} with ${Array.from(players.values())[0].username}`
          }else if (players.size > 1) {
            presenceName = `${gameName} with ${players.size} others`
          }
        }

        // client.user.setPresence({
        //   status: "online",
        //   activity: {
        //     type: "PLAYING",
        //     name: presenceName
        //   },
        // });
        break;
      
      case Presence.SERVER_STARTING:
        // client.user.setPresence({
        //   status: "dnd",
        //   activity: {
        //     type: "WATCHING",
        //     name: `${config["serverName"] || "Server"} is starting...`
        //   },
        // });
        break;
      
      case Presence.SERVER_STOPPING:
        // client.user.setPresence({
        //   status: "dnd",
        //   activity: {
        //     type: "WATCHING",
        //     name: `${config["serverName"] || "Server"} is stopping...`
        //   },
        // });
        break;
    
      default:

        // client.user.setPresence({
        //   status: "idle",
        //   activity: {
        //     type: "LISTENING",
        //     name: `${config["serverName"] || "Server"} is offline!`
        //   },
        // });

        break;
    }
  }
}


export const getDefaultCommandEmbed = (authorName: string, avatarURL?: string | null) => {
  return new MessageEmbed()
      .setColor(config["embedColor"] || "#5800fc")
      .setAuthor(authorName, avatarURL || undefined);
}



export type DateString = `${number}.${number}-${number}.${number | string}`;

export const createDateTimeString = (date?: Date): string => {
  if (!date) {
    date = new Date();
  }

  let minutes = date.getMinutes();
  let minutesString = minutes < 10 ? `0${minutes}` : minutes.toString();

  return `${date.getDate()}.${date.getMonth() + 1}-${date.getHours()}.${minutesString}`;
}


export const parseDateTimeString = (timeString: DateString): Date => {
  let date = new Date();

  let array = timeString.split(/\.|\-/);

  date.setDate(parseInt(array[0]));
  date.setMonth(parseInt(array[1]) - 1);
  date.setHours(parseInt(array[2]));
  date.setMinutes(parseInt(array[3]));

  return date;
}

// Thanks to Bud Damyanov
// https://stackoverflow.com/users/632524/bud-damyanov
export enum ConsoleColor {
  Reset = "\x1b[0m",
  Bright = "\x1b[1m",
  Dim = "\x1b[2m",
  Underscore = "\x1b[4m",
  Blink = "\x1b[5m",
  Reverse = "\x1b[7m",
  Hidden = "\x1b[8m",

  FgBlack = "\x1b[30m",
  FgRed = "\x1b[31m",
  FgGreen = "\x1b[32m",
  FgYellow = "\x1b[33m",
  FgBlue = "\x1b[34m",
  FgMagenta = "\x1b[35m",
  FgCyan = "\x1b[36m",
  FgWhite = "\x1b[37m",

  BgBlack = "\x1b[40m",
  BgRed = "\x1b[41m",
  BgGreen = "\x1b[42m",
  BgYellow = "\x1b[43m",
  BgBlue = "\x1b[44m",
  BgMagenta = "\x1b[45m",
  BgCyan = "\x1b[46m",
  BgWhite = "\x1b[47m",
}