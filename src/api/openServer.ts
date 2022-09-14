import express from "express";
import { createServer } from "http";
import { WebSocketServer } from "ws";

import serverListRouter from "./serverList";
import playerListRouter from "./playerList";
import serverInfoRouter from "./serverInfo";
import changeServerNameRouter from "./changeServerName"
import statusControlRouter from "./statusControl";
import receiveCommandRouter from "./receiveCommand";
import { ServerHandler } from "../serverHandler";
import { WS_EventSender } from "./events";

/**
 * HTTP Server default port
 */
const PORT = 55642;
const API_PREFIX = "/api/v1"

const app = express();

const server = createServer(app);

const wss = new WebSocketServer({ server, path: "/dash" });

wss.on("connection", function connection(ws) {
    ws.on("message", function message(d) {
        const data = d.toString()
        console.log("received: %s", data);
    });

    const sender = new WS_EventSender(ws);

    ServerHandler.servers.forEach(gameServer => {
        gameServer.on("join", async(event) => {
            if (!gameServer.tag) return;
            sender.sendEvent("join", {
                player: await sender.createSocketPlayer(event.player),
                server: gameServer.tag,
                isoDate: sender.ISOFromGameEvent(event)
            });
        });
        gameServer.on("quit", async(event) => {
            if (!gameServer.tag) return;
            sender.sendEvent("quit", {
                player: await sender.createSocketPlayer(event.player),
                server: gameServer.tag,
                isoDate: sender.ISOFromGameEvent(event)
            });
        });
        gameServer.on("ready", (event) => {
            if (!gameServer.tag) return;
            sender.sendEvent("serverReady", {
                server: gameServer.tag,
                isoDate: sender.ISOFromGameEvent(event)
            });
        });
        gameServer.on("close", (event) => {
            if (!gameServer.tag) return;
            sender.sendEvent("serverClose", {
                server: gameServer.tag,
                isoDate: sender.ISOFromGameEvent(event)
            });
        });
        gameServer.std.on("out", reader => {
            if (!gameServer.tag) return;
            sender.sendEvent("serverConsole", {
                data: reader.data,
                server: gameServer.tag,
                isoDate: reader.date.toISOString(),
            })
        });
        gameServer.on("chat", async event => {
            if (!gameServer.tag) return;
            sender.sendEvent("chat", {
                server: gameServer.tag,
                player: await sender.createSocketPlayer(event.player),
                data: event.message,
                isoDate: sender.ISOFromGameEvent(event)
            });
        });
    });
});

/**
 * @description Opens a HTTP API server for dashboard usage
 * @param options 
 */
export default function openHTTP(options?: { port?: number, log?: boolean }) {
    openRoutes();
    server.listen(options?.port || PORT);
    if (options?.log) {
        console.log(`HTTP Server successfully started on port ${PORT}.`);
    }
}

export function openRoutes() {
    app.get("/", (req, res)  => {
        res.send("Hello from Masa. This service is clealy up!");
    });

    app.use(API_PREFIX, serverListRouter);
    app.use(API_PREFIX, playerListRouter);
    app.use(API_PREFIX, serverInfoRouter);
    app.use(API_PREFIX, statusControlRouter);
    app.use(API_PREFIX, receiveCommandRouter);
    app.use(API_PREFIX, changeServerNameRouter);

    app.disable("x-powered-by")
}