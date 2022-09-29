import {  ActivityType, MessageActionRow, MessageEmbed, PresenceStatusData } from "discord.js";
import { client, config } from "./index";
import { nanoid } from "nanoid";
import GameServer from "./classes/server/GameServer";
import assert from "assert";
import date from "date-and-time";
import Lang from "./classes/Lang";
import { StartButton } from "./buttons/StartButton";
import { RestartButton } from "./buttons/RestartButton";
import { StopButton } from "./buttons/StopButton";
import { ManualBackupMetadata } from "./classes/server/backup/BackupManifest";
import Masa, { Presence } from "./classes/Masa";



export const isAllowedChannel = (channelID: string) => {
  if (!config.allowedChannels) return true;
  for (const allowedChannel of config.allowedChannels) {
    if (allowedChannel === channelID) {
      return true;
    }
  }

  return false;
}

export const getExecutableGameCommand = (command: string) => {
  command = command.trim();
  
  if (command.startsWith("/")) {
    command = command.substring(1);
  }
  command += "\n";
  return command;
}
export const getMessageGameCommand = (command: string) => {
  command = command.trim();

  if (!command.startsWith("/")) {
    command = "/" + command;
  }
  return command;
}

export const generateServerButtonRow = (serverName: string) => {
  return new MessageActionRow().addComponents([
    new StartButton().setParameters({serverName}).getMessageButton(),
    new StopButton().setParameters({serverName}).getMessageButton(),
    new RestartButton().setParameters({serverName}).getMessageButton()
  ]);
}

export const toArrayIfNot = <T>(value: T | T[]): T[] => Array.isArray(value) ? value : [ value ];

export const normalizeFilePath = (filepath: string) => filepath.replaceAll("\\", "/")

export const genServerTag = () => nanoid(9);

// TODO: add support for channel names
export const setServerStatus = (serverName: string, server: GameServer, status: Presence) => {
  assert(client.user);
  

  let statusText: string | undefined;
  let statusType: PresenceStatusData | undefined;
  let activityType: ActivityType | undefined;

  switch (status) {
    case Masa.Presence.SERVER_ONLINE:
      statusType = "online";
      activityType = "PLAYING";

      if (server.playerCount === 1) {
        statusText = Lang.parse("commands.status.serverWithPlayer", {
          SERVER_NAME: serverName,
          PLAYER_NAME: server.getOnlinePlayersArray()[0].getUsername(),
          paramBolding: false,
        });
      } else if (server.playerCount > 1) {
        statusText = Lang.parse("commands.status.serverWithPlayers", {
          SERVER_NAME: serverName,
          PLAYER_COUNT: server.playerCount,
          paramBolding: false,
        });
      }else {
        statusText = Lang.parse("commands.status.serverOnline", {
          SERVER_NAME: serverName,
          paramBolding: false,
        });
      }
      break;
    case Masa.Presence.SERVER_STARTING:
      statusType = "dnd";
      activityType = "WATCHING";
      statusText = Lang.parse("commands.status.serverStarting", {SERVER_NAME: serverName, paramBolding: false});
      break;

    case Masa.Presence.SERVER_STOPPING:
      statusType = "dnd";
      activityType = "WATCHING";
      statusText = Lang.parse("commands.status.serverStopping", {SERVER_NAME: serverName, paramBolding: false});
      break;

    default:
      statusType = "idle";
      activityType = "LISTENING";
      statusText = Lang.parse("commands.status.serverOffline", {SERVER_NAME: serverName, paramBolding: false});
      break;
  }

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

export const fieldFromBackup = (backup: ManualBackupMetadata) => {
  const e = backup;
  const dateFormat = Lang.getDateOrTimeFormat("longDate");
  const timeFormat = Lang.getDateOrTimeFormat("time");
  const created = Lang.translateDateAndTime(date.format(new Date(e.created), dateFormat + " " + timeFormat));
  return {
    name: e.name || created,
    value: [
      ...(e.desc ? [`> **${Lang.parse("commands.backup.description")}**: \`${e.desc}\``] : []),
      `> **${Lang.parse("commands.backup.created")}**_    _: \`${created}\``,
      ...(e.author ? [`> **${Lang.parse("commands.backup.author")}**_     _: <@${e.author}>`] : []),
      `> **${Lang.parse("commands.backup.ID")}**_         _: \`${e.id}\``,
    ].join("\n")
  }
}