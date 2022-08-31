import express from "express";
import { createServer } from "http";
import { WebSocketServer } from "ws";

import serverListRouter from "./serverList";
import playerListRouter from "./playerList";
import { ServerHandler } from "../serverHandler";

/**
 * HTTP Server default port
 */
const PORT = 55642;

const app = express();

const server = createServer(app);

const wss = new WebSocketServer({ server, path: "/dash" });

wss.on("connection", function connection(ws) {
    ws.on("message", function message(d) {
        const data = d.toString()
        console.log("received: %s", data);
    });

    ServerHandler.servers.forEach(gameServer => {
        gameServer.on("join", (event) => {
            ws.send(JSON.stringify({
                username: event.player.username,
                server: gameServer.tag,
                eventType: "join"
            }))
        });
        gameServer.on("quit", (event) => {
            ws.send(JSON.stringify({
                username: event.player.username,
                server: gameServer.tag,
                eventType: "quit"
            }))
        });
        gameServer.on("ready", (event) => {
            ws.send(JSON.stringify({
                server: gameServer.tag,
                eventType: "serverReady"
            }))
        });
        gameServer.on("close", (event) => {
            ws.send(JSON.stringify({
                server: gameServer.tag,
                eventType: "serverClose"
            }))
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
    app.use("/api/v1", serverListRouter);
    app.use("/api/v1", playerListRouter);


    app.disable("x-powered-by")
}