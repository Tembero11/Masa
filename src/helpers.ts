import {  MessageActionRow, MessageButton, MessageEmbed } from "discord.js";
import { client, config } from "../index";
import path from "path";
import { Presence } from "./serverHandler";
import { GameServer } from "./classes/MasaAPI";
import assert from "assert";
import date from "date-and-time";
import { BackupMetadata } from "./classes/server/BackupModule";

export const serverDir = path.join(process.cwd(), "server");


export const isAllowedChannel = (channelID: string) => {
  if (!config.allowedChannels) return true;
  for (const allowedChannel of config.allowedChannels) {
    if (allowedChannel === channelID) {
      return true;
    }
  }

  return false;
}

export const generateButtonRow = (serverName: string, server: GameServer) => {
  return new MessageActionRow().addComponents([
    new MessageButton()
    .setCustomId(`server_start:${serverName}`)
    .setLabel("Start")
    .setStyle("PRIMARY")
    .setDisabled(server.hasStreams),
    new MessageButton()
    .setCustomId(`server_stop:${serverName}`)
    .setLabel("Stop")
    .setStyle("DANGER")
    .setDisabled(!server.hasStreams),
    new MessageButton()
    .setCustomId(`server_restart:${serverName}`)
    .setLabel("Restart")
    .setStyle("DANGER")
  ]);
}


// TODO: add support for channel names
export const setServerStatus = (serverName: string, server: GameServer, status: Presence, usePresence: boolean = true) => {
  assert(client.user);
  // let channel = client.channels.cache.find((channel) => channel.id == channelID);

  switch (status) {
    case Presence.SERVER_ONLINE:
      let presenceName: string = serverName;

      // TODO add show players check
      if (true) {
        if (server.playerCount === 1) {
          presenceName = `${serverName} with ${server.playersArray[0].username}`;
        }else if (server.playerCount > 1) {
          presenceName = `${serverName} with ${server.playerCount} others`;
        }
      }

      if (usePresence) {
        client.user.setPresence({
          status: "online",
          activities: [
            {
              type: "PLAYING",
              name: presenceName
            },
          ]
        });
      }
      // TODO Add status as channel names
      break;
    
    case Presence.SERVER_STARTING:
      
      client.user.setPresence({
        status: "dnd",
        activities: [
          {
            type: "WATCHING",
            name: `${serverName} is starting...`
          },
        ]
      });
      // TODO Add status as channel names
      break;
    
    case Presence.SERVER_STOPPING:
      client.user.setPresence({
        status: "dnd",
        activities: [
          {
            type: "WATCHING",
            name: `${serverName} is stopping...`
          },
        ]
      });
      // TODO Add status as channel names
      break;
  
    default:

      client.user.setPresence({
        status: "idle",
        activities: [
          {
            type: "LISTENING",
            name: `${serverName} is offline!`
          },
        ]
      });

      break;
  }
}

export const setPresence = (presence: Presence) => {
  if (client && client.user) {
    
  }
}


export const getDefaultCommandEmbed = (authorName: string, avatarURL?: string | null) => {
  return new MessageEmbed()
      .setAuthor(authorName, avatarURL || undefined);
}
export const fieldFromBackup = (backup: BackupMetadata) => {
  const e = backup;
  const created = date.format(new Date(e.created), "ddd, MMM DD YYYY, HH:mm");
  return {
    name: e.name || created,
    value: [
      ...(e.desc ? [`> **Description**: \`${e.desc}\``] : []),
      `> **Created**_    _: \`${created}\``,
      ...(e.author ? [`> **Author**_     _: <@${e.author}>`] : []),
      `> **ID**_         _: \`${e.id}\``,
    ].join("\n")
  }
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