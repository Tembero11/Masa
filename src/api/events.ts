import WebSocket from "ws";
import Player from "../classes/Player";

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
    async createSocketPlayer(player: Player): Promise<WS_EventPlayer> {
        return {
            username: player.username,
            uuid: await player.getUUID()
        }
    }
}

interface WS_Events {
    join: WS_JoinEvent,
    quit: WS_QuitEvent,
    serverReady: WS_ServerReadyEvent
    serverClose: WS_ServerCloseEvent
}

interface WS_BaseEvent {

}

interface WS_JoinEvent extends WS_BaseEvent {
    player: WS_EventPlayer
    server: ServerTag
}
interface WS_QuitEvent extends WS_BaseEvent {
    player: WS_EventPlayer
    server: ServerTag
}
interface WS_ServerReadyEvent extends WS_BaseEvent {
    server: ServerTag
}
interface WS_ServerCloseEvent extends WS_BaseEvent {
    server: ServerTag
}

type ServerTag = string;

interface WS_EventPlayer {
    username: string
    uuid: string
}