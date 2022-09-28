import assert from "assert";
import chalk from "chalk";
import { MessageEmbed } from "discord.js";
import ms from "ms";
import path from "path";
import { client } from "../client";
import { ServerMetadata } from "../config";
import { setServerStatus, toArrayIfNot } from "../helpers";
import Lang from "./Lang";
import GameServerBackupManager from "./server/backup/GameServerBackupManager";
import GameServer from "./server/GameServer";


export enum Presence {
    SERVER_ONLINE,
    SERVER_STARTING,
    SERVER_STOPPING,
    SERVER_OFFLINE
}

interface ServerItem {
    tag: string,
    name: string
    gameServer: GameServer
}

const serverList: ServerItem[] = [];

function getServers() {
    return Object.freeze(serverList.map(server => server.gameServer));
}
function getServerNames() {
    return serverList.map(server => server.name);
}
function getServerByTag(tag: string) {
    return serverList.find(server => server.tag === tag)?.gameServer;
}
function getServerByName(name: string) {
    return serverList.find(server => server.name === name)?.gameServer;
}
function deleteFromMemoryByTag(tag: string) {
    const index = serverList.findIndex(server => server.tag === tag);
    if (index > -1) return false;
    serverList.splice(index, 1);
    return true;
}

function deleteFromMemoryByName(name: string) {
    const index = serverList.findIndex(server => server.name === name);
    if (index > -1) return false;
    serverList.splice(index, 1);
    return true;
}

async function initializeServers(serverMeta: ServerMetadata[]) {
    for (const meta of serverMeta) {
        await createServer(meta);
    }
}


async function createServer(meta: ServerMetadata) {
    assert(!getServerByName(meta.name), "One or more servers have the same name!");

    if (getServerByTag(meta.tag)) {
        deleteFromMemoryByTag(meta.tag);
    }

    const server = new GameServer(meta.command, meta.directory, { disableRCON: false, metadata: meta });

    setServerStatus(meta.name, server, Presence.SERVER_OFFLINE);


    server.on("join", (e) => {
        if (meta.advanced?.welcomeMsg) {
            let msg = meta.advanced.welcomeMsg;
            msg = msg.replaceAll("{PLAYER}", e.player.getUsername());
            msg = msg.replaceAll("{ONLINE}", e.player.getServer().playerCount.toString());
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
            void setupChatStreaming(
                server,
                meta.name,
                channels,
                sendPlayerNetworkEvents,
                sendServerReadyEvent,
                allowDuplex
            );
        } else {
            client.once("ready", _ => setupChatStreaming(
                server,
                meta.name,
                channels,
                sendPlayerNetworkEvents,
                sendServerReadyEvent,
                allowDuplex
            ));
        }
    } else {
        console.log("Chat streaming is disabled!");
    }

    // Setup backups
    if (meta.backups) {
        const { backupInterval, backupLimit } = meta.backups;

        const backupIntervalMs = typeof backupInterval == "string" ? ms(backupInterval) : backupInterval;

        assert(backupInterval && backupLimit);

        console.log(`Automatic backups are made every ${ms(backupIntervalMs, { long: true })} for server "${chalk.underline(meta.name)}".`);

        const backupPath = path.join(server.dir, "backups");

        const manager = new GameServerBackupManager(server, backupPath);

        await manager.createBackupDir()

        setInterval(async () => {
            if (manager.manifest.backupCount >= backupLimit) {
                const backupMeta = manager.manifest.getOldestAutomatic();
                if (backupMeta) {
                    await manager.deleteBackup(backupMeta.id);
                }
            }
            await manager.prepareForBackup();
            const backup = await manager.createBackup();
            await manager.afterBackup();
            console.log(`An automatic backup was succesfully created! ${manager.getFilename(backup.id)}`);
        }, backupIntervalMs);
    } else {
        console.warn(chalk.yellow(`Automatic backups are ${chalk.bold("disabled")} for server "${chalk.underline(meta.name)}".`))
    }

    serverList.push({
        tag: meta.tag,
        name: meta.name,
        gameServer: server
    });
}


const setupChatStreaming = async (
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
        channels.forEach(channel => channel.send(`\`\`\`<${event.player.getUsername()}> ${event.message}\`\`\``));
    });
    if (sendPlayerNetworkEvents) {
        server.on("join", event => {
            channels.forEach(channel => channel.send(`${yellowMsgPrefix}${Lang.parse("chat.playerJoined", {
                PLAYER_NAME: event.player.getUsername(),
                paramBolding: false
            })}${yellowMsgSuffix}`));
        });
        server.on("quit", event => {
            channels.forEach(channel => channel.send(`${yellowMsgPrefix}${Lang.parse("chat.playerLeft", {
                PLAYER_NAME: event.player.getUsername(),
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

                msg.channel.send({ embeds: [embed] });
            }
        });
    }

    console.log("Successfully setup chat streaming to Discord!");
}

const Masa = {
    getServers,
    getServerNames,
    getServerByTag,
    getServerByName,
    Presence,
    createServer,
    deleteFromMemoryByTag,
    deleteFromMemoryByName,
    initializeServers
}
export default Masa;