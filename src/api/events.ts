import WebSocket from "ws";
import Event from "../classes/Event";
import { OnlinePlayer, OfflinePlayer } from "../classes/Player";

export class WS_EventSender {
    websocket;
    constructor(ws: WebSocket) {
        this.websocket = ws;
    }
    sendEvent<T extends keyof WS_Events>(type: T, data: WS_Events[T]) {
        this.websocket.send(JSON.stringify({
            ...data,
            eventType: type
        }));
    }
    async createSocketPlayer(player: OnlinePlayer | OfflinePlayer): Promise<WS_EventPlayer> {
        return {
            username: player.getUsername(),
            uuid:  player.getUUID()
        }
    }

    ISOFromGameEvent(event: Event): string {
        return event.date.toISOString();
    }
}

interface WS_Events {
    join: WS_JoinEvent,
    quit: WS_QuitEvent,
    chat: WS_ChatEvent,
    serverReady: WS_ServerReadyEvent
    serverClose: WS_ServerCloseEvent
    serverConsole: WS_ServerConsoleEvent
}

interface WS_BaseEvent {
    isoDate: string
}

interface WS_JoinEvent extends WS_BaseEvent {
    player: WS_EventPlayer
    server: ServerTag
}
interface WS_QuitEvent extends WS_BaseEvent {
    player: WS_EventPlayer
    server: ServerTag
}
interface WS_ChatEvent extends WS_BaseEvent {
    player: WS_EventPlayer
    data: string
    server: ServerTag
}
interface WS_ServerReadyEvent extends WS_BaseEvent {
    server: ServerTag
}
interface WS_ServerCloseEvent extends WS_BaseEvent {
    server: ServerTag
}

interface WS_ServerConsoleEvent extends WS_BaseEvent {
    data: string
    server: ServerTag
}

type ServerTag = string;

interface WS_EventPlayer {
    username: string
    uuid?: string
}