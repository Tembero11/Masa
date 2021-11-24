import {  ActivityType, MessageActionRow, MessageButton, MessageEmbed, PresenceStatusData, TextChannel } from "discord.js";
import { client, config } from "../index";
import path from "path";
import { Presence } from "./serverHandler";
import { GameServer } from "./classes/MasaAPI";
import assert from "assert";
import date from "date-and-time";
import { BackupMetadata } from "./classes/server/BackupModule";
import Lang from "./classes/Lang";

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
    .setLabel(Lang.buttons.start())
    .setStyle("PRIMARY")
    .setDisabled(server.hasStreams),
    new MessageButton()
    .setCustomId(`server_stop:${serverName}`)
    .setLabel(Lang.buttons.stop())
    .setStyle("DANGER")
    .setDisabled(!server.hasStreams),
    new MessageButton()
    .setCustomId(`server_restart:${serverName}`)
    .setLabel(Lang.buttons.restart())
    .setStyle("DANGER")
  ]);
}


// TODO: add support for channel names
export const setServerStatus = (serverName: string, server: GameServer, status: Presence) => {
  assert(client.user);
  

  let statusText: string | undefined;
  let statusType: PresenceStatusData | undefined;
  let activityType: ActivityType | undefined;

  switch (status) {
    case Presence.SERVER_ONLINE:
      statusType = "online";
      activityType = "PLAYING";

      if (server.playerCount === 1) {
        statusText = Lang.status.serverWithPlayer(serverName, server.playersArray[0].username);
      } else if (server.playerCount > 1) {
        statusText = Lang.status.serverWithPlayers(serverName, server.playerCount);
      }else {
        statusText = Lang.status.serverOnline(serverName);
      }
      break;
    case Presence.SERVER_STARTING:
      statusType = "dnd";
      activityType = "WATCHING";
      statusText = Lang.status.serverStarting(serverName);
      break;

    case Presence.SERVER_STOPPING:
      statusType = "dnd";
      activityType = "WATCHING";
      statusText = Lang.status.serverStopping(serverName);
      break;

    default:
      statusType = "idle";
      activityType = "LISTENING";
      statusText = Lang.status.serverOffline(serverName);
      break;
  }
  console.log("statusText", statusText);

  client.user.setPresence({
    status: statusType,
    activities: [
      {
        type: activityType,
        name: statusText
      },
    ]
  });
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
      ...(e.desc ? [`> **${Lang.backups.description()}**: \`${e.desc}\``] : []),
      `> **${Lang.backups.created()}**_    _: \`${created}\``,
      ...(e.author ? [`> **${Lang.backups.author()}**_     _: <@${e.author}>`] : []),
      `> **${Lang.backups.ID()}**_         _: \`${e.id}\``,
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