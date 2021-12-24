import {  ActivityType, MessageActionRow, MessageButton, MessageEmbed, PresenceStatusData } from "discord.js";
import { client, config } from "../index";
import path from "path";
import { Presence } from "./serverHandler";
import { GameServer } from "./classes/MasaAPI";
import assert from "assert";
import date from "date-and-time";
import { BackupMetadata } from "./classes/server/BackupModule";
import Lang from "./classes/Lang";


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
    .setLabel(Lang.parse(Lang.langFile.buttons.start))
    .setStyle("PRIMARY")
    .setDisabled(server.hasStreams),
    new MessageButton()
    .setCustomId(`server_stop:${serverName}`)
    .setLabel(Lang.parse(Lang.langFile.buttons.stop))
    .setStyle("DANGER")
    .setDisabled(!server.hasStreams),
    new MessageButton()
    .setCustomId(`server_restart:${serverName}`)
    .setLabel(Lang.parse(Lang.langFile.buttons.restart))
    .setStyle("DANGER")
  ]);
}

export const toArrayIfNot = <T>(value: T | T[]): T[] => Array.isArray(value) ? value : [ value ];


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
        statusText = Lang.parse(Lang.langFile.commands.status.serverWithPlayer, {
          SERVER_NAME: serverName,
          PLAYER_NAME: server.playersArray[0].username,
          paramBolding: false,
        });
      } else if (server.playerCount > 1) {
        statusText = Lang.parse(Lang.langFile.commands.status.serverWithPlayers, {
          SERVER_NAME: serverName,
          PLAYER_COUNT: server.playerCount,
          paramBolding: false,
        });
      }else {
        statusText = Lang.parse(Lang.langFile.commands.status.serverOnline, {
          SERVER_NAME: serverName,
          paramBolding: false,
        });
      }
      break;
    case Presence.SERVER_STARTING:
      statusType = "dnd";
      activityType = "WATCHING";
      statusText = Lang.parse(Lang.langFile.commands.status.serverStarting, {SERVER_NAME: serverName, paramBolding: false});
      break;

    case Presence.SERVER_STOPPING:
      statusType = "dnd";
      activityType = "WATCHING";
      statusText = Lang.parse(Lang.langFile.commands.status.serverStopping, {SERVER_NAME: serverName, paramBolding: false});
      break;

    default:
      statusType = "idle";
      activityType = "LISTENING";
      statusText = Lang.parse(Lang.langFile.commands.status.serverOffline, {SERVER_NAME: serverName, paramBolding: false});
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
export const fieldFromBackup = (backup: BackupMetadata) => {
  const e = backup;
  const created = date.format(new Date(e.created), "ddd, MMM DD YYYY, HH:mm");
  return {
    name: e.name || created,
    value: [
      ...(e.desc ? [`> **${Lang.parse(Lang.langFile.commands.backup.description)}**: \`${e.desc}\``] : []),
      `> **${Lang.parse(Lang.langFile.commands.backup.created)}**_    _: \`${created}\``,
      ...(e.author ? [`> **${Lang.parse(Lang.langFile.commands.backup.author)}**_     _: <@${e.author}>`] : []),
      `> **${Lang.parse(Lang.langFile.commands.backup.ID)}**_         _: \`${e.id}\``,
    ].join("\n")
  }
}