import express, { Request, Response } from "express";
import http, { createServer } from "http";
import { WebSocketServer } from "ws";

import serverListRouter from "./serverList";
import playerListRouter from "./server/playerList";
import serverInfoRouter from "./server/serverInfo";
import changeServerNameRouter from "./server/changeServerName"
import statusControlRouter from "./server/statusControl";
import receiveCommandRouter from "./server/receiveCommand";
import loginRouter from "./login"
import { WS_EventSender } from "./events";
import { NetworkError } from "./NetworkError";
import assert from "assert";
import Masa from "../classes/Masa";
import DashKeyManager from "./DashKeyManager";

/**
 * HTTP Server default port
 */
const PORT = 55642;
const API_PREFIX = "/api/v1"

const app = express();

const server = createServer(app);

const wss = new WebSocketServer({ server, path: "/dash" });

export const keyManager = new DashKeyManager();

wss.on("connection", function connection(ws) {
    ws.on("message", function message(d) {
        const data = d.toString()
        console.log("received: %s", data);
    });

    const sender = new WS_EventSender(ws);

    Masa.getServers().forEach(gameServer => {
        gameServer.on("join", event => {
            if (!gameServer.tag) return;
            sender.sendEvent("join", {
                player: sender.createSocketPlayer(event.player),
                server: gameServer.tag,
                isoDate: sender.ISOFromGameEvent(event)
            });
        });
        gameServer.on("quit", event => {
            if (!gameServer.tag) return;
            sender.sendEvent("quit", {
                player: sender.createSocketPlayer(event.player),
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
        gameServer.on("chat", event => {
            if (!gameServer.tag) return;
            sender.sendEvent("chat", {
                server: gameServer.tag,
                player: sender.createSocketPlayer(event.player),
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
    app.use(API_PREFIX, loginRouter);

    app.disable("x-powered-by");
}

interface ApiResponseOptions {
    msg?: string
    [key: string]: unknown
}

function isOK(httpCode: number) {
    return httpCode >= 200 && httpCode < 300;
}

export function apiResponse(res: Response, httpCode: number, code: NetworkError, options?: ApiResponseOptions) {
    assert(isOK(httpCode) === (code === NetworkError.Ok));

    res.status(httpCode).json({
        ...options,
        httpCode,
        masaCode: "0x" + code.toString(16),
        msg: options?.msg ?? http.STATUS_CODES[httpCode],
        success: isOK(httpCode),
    });
}

export function fromTo(req: Request, maxItems: number): { from: number | undefined, to: number | undefined } {
    const parseErrorResult = { from: undefined, to: undefined }

    const positiveIntegerRegex = /^[0-9]{1,}$/;

    const from = req.query.from;
    const to = req.query.to;

    if (typeof from != "string") return parseErrorResult;
    if (typeof to != "string") return parseErrorResult;

    if (!positiveIntegerRegex.test(from)) return parseErrorResult;
    if (!positiveIntegerRegex.test(to)) return parseErrorResult;

    const fromParsed = parseInt(from);
    const toParsed = parseInt(to);

    const difference = toParsed - fromParsed;

    if (!(difference >= 0 && difference <= maxItems)) return parseErrorResult;

    return { from: fromParsed, to: toParsed }
}