import { setServerStatus, toArrayIfNot } from "./helpers";
import { GameServer } from "./classes/MasaAPI";
import { ServerMetadata } from "./config";
import assert from "assert";
import chalk from "chalk";
import { client } from "./client";
import Lang from "./classes/Lang";
import { MessageEmbed } from "discord.js";
import { BackupManager } from "./classes/server/backup/BackupManager";
import path from "path";

export enum Presence {
  SERVER_ONLINE,
  SERVER_STARTING,
  SERVER_STOPPING,
  SERVER_OFFLINE
}


export abstract class ServerHandler {
  /**
   * Map has names as keys
   */
  private static serversMap = new Map<string, GameServer>();
  /**
   * Map has ids as keys
   */
  private static ids = new Map<string, string>();

  public static get servers() {
    return Array.from(ServerHandler.serversMap.values());
  }

  public static get serverNames() {
    return Array.from(ServerHandler.serversMap.keys());
  }

  static getServerByName(serverName: string): GameServer | undefined {
    return ServerHandler.serversMap.get(serverName);
  }
  static getServerById(id: string): GameServer | undefined {
    const name = ServerHandler.idToName(id);
    if (name) {
      return ServerHandler.serversMap.get(name);
    }
  }
  static nameToId(name: string) {
    return [...ServerHandler.ids.entries()].find((e) => e[1] == name);
  }
  static idToName(id: string) {
    return ServerHandler.ids.get(id);
  }
  static start = async (serverName: string) => {
    let server = ServerHandler.serversMap.get(serverName);
    assert(server);
    server.start();

    return await server.waitfor("ready");
  }

  static stop = async (serverName: string) => {
    let server = ServerHandler.serversMap.get(serverName);
    assert(server);
    return await server.stop();
  }

  static restart = async (serverName: string) => {
    let server = ServerHandler.serversMap.get(serverName);
    assert(server);

    if (server.hasStreams) {
      await server.stop();
    }
    await server.start();

    return await server.waitfor("ready");
  }


  static serverInitializer = (serverMeta: ServerMetadata[]) => {
    serverMeta.forEach((meta) => {
      assert(!ServerHandler.serversMap.get(meta.name), "One or more servers have the same name!");

      let server = new GameServer(meta.command, meta.directory, meta);
      if (meta.backups) {
        server.enableBackups();
      }

      setServerStatus(meta.name, server, Presence.SERVER_OFFLINE);


      server.on("join", (e) => {
        if (meta.advanced?.welcomeMsg) {
          let msg = meta.advanced.welcomeMsg;
          msg = msg.replaceAll("{PLAYER}", e.player.username);
          msg = msg.replaceAll("{ONLINE}", e.player.server.playerCount.toString());
          e.player.sendMessage(msg);
        }
        setServerStatus(meta.name, server, Presence.SERVER_ONLINE);
      });
      server.on("quit", (e) => {
        setServerStatus(meta.name, server, Presence.SERVER_ONLINE);
      });

      server.on("ready", () => {
        setServerStatus(meta.name, server, Presence.SERVER_ONLINE);
      });

      if (meta.logs) {
        console.log(`Logs are enabled on "${chalk.underline(meta.name)}"`)
        server.std.on("out", (reader) => {
          process.stdout.write(reader.data);
        });
      }

      server.on("close", e => setServerStatus(meta.name, server, Presence.SERVER_OFFLINE));


      if (meta.advanced?.chat?.channels) {
        const { sendPlayerNetworkEvents, sendServerReadyEvent, allowDuplex } = meta.advanced.chat;
        const channels = toArrayIfNot(meta.advanced.chat.channels);
        if (client.user) {
          setupChatStreaming(
            server,
            meta.name,
            channels,
            sendPlayerNetworkEvents,
            sendServerReadyEvent,
            allowDuplex
          );
        }else {
          client.once("ready", _ => setupChatStreaming(
            server,
            meta.name,
            channels,
            sendPlayerNetworkEvents,
            sendServerReadyEvent,
            allowDuplex
          ));
        }
      }else {
        console.log("Chat streaming is disabled!");
      }

      // TESTING
      const manager = new BackupManager(server, path.join(server.dir, "backups"));
      manager.createBackup().then(e => console.log("Backup created!!!!!!!"))
      // Setup backups
      // if (meta.backups) {
      //   const { backupInterval } = meta.backups;
      //   const { backupLimit } = meta.backups;

      //   let backupIntervalMs = typeof backupInterval == "string" ? ms(backupInterval) : backupInterval;

      //   assert(backupInterval && backupLimit);

      //   console.log(`Automatic backups are made every ${ms(backupIntervalMs, {long: true})} for server "${chalk.underline(meta.name)}".`);

      //   setInterval(() => {
      //     createBackup(server, meta.name, BackupType.Automatic, { backupLimit }).then((backup) => {
      //       console.log(`An automatic backup was succesfully created! ${backup.filename || ""}`);
      //     }).catch((err) => {
      //       console.warn(chalk.yellow(err));
      //     });
      //   }, backupIntervalMs);
      // }else {
      //   console.warn(chalk.yellow(`Automatic backups are ${chalk.bold("disabled")} for server "${chalk.underline(meta.name)}".`))
      // }


      ServerHandler.serversMap.set(meta.name, server);
      ServerHandler.ids.set(meta.tag, meta.name);
    });
  }
}

const setupChatStreaming = async(
  server: GameServer,
  serverName: string,
  channelIds: string[],
  sendPlayerNetworkEvents?: boolean,
  sendServerReadyEvent?: boolean,
  allowDuplex?: boolean
) => {
  const yellowMsgPrefix = "```fix\n";
  const yellowMsgSuffix = "```";

  const channels = await Promise.all(channelIds.map(async channelId => {
    const channel = await client.channels.fetch(channelId);
    assert(channel?.isText());
    return channel;
  }));

  server.on("chat", event => {
    channels.forEach(channel => channel.send(`\`\`\`<${event.player.username}> ${event.message}\`\`\``));
  });
  if (sendPlayerNetworkEvents) {
    server.on("join", event => {
      channels.forEach(channel => channel.send(`${yellowMsgPrefix}${Lang.parse("chat.playerJoined", {
        PLAYER_NAME: event.player.username,
        paramBolding: false
      })}${yellowMsgSuffix}`));
    });
    server.on("quit", event => {
      channels.forEach(channel => channel.send(`${yellowMsgPrefix}${Lang.parse("chat.playerLeft", {
        PLAYER_NAME: event.player.username,
        paramBolding: false
      })}${yellowMsgSuffix}`));
    });
  }
  if (sendServerReadyEvent) {
    server.on("ready", event => {
      channels.forEach(channel => channel.send(`${yellowMsgPrefix}${Lang.parse("chat.serverReady", {
        SERVER_NAME: serverName,
        paramBolding: false
      })}${yellowMsgSuffix}`));
    });
  }

  if (allowDuplex) {
    client.on("messageCreate", (msg) => {
      if (!msg.author.bot && channelIds.includes(msg.channelId) && server.isJoinable) {
        const tellraw = [
          { text: "<" },
          {
            text: `@${msg.member?.nickname || msg.author.username}`,
            color: "aqua",
            hoverEvent: { action: "show_text", value: `${msg.author.username}#${msg.author.discriminator}` },
            clickEvent: { action: "open_url", value: `https://discord.com/users/${msg.author.id}` },
          },
          { text: "> " },
          { text: msg.content }
        ];

        server.std.emit("in", `tellraw @a ${JSON.stringify(tellraw)}\n`);

        const embed = new MessageEmbed();

        embed.setDescription(Lang.parse("chat.chatSent", {
          MESSAGE_LINK: msg.url,
          SERVER_NAME: serverName,
        }));

        msg.channel.send({embeds: [embed]});
      }
    });
  }

  console.log("Successfully setup chat streaming to Discord!");
}