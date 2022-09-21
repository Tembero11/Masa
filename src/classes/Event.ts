import { OnlinePlayer } from "./Player";

export interface CommunicatorEvent {
    event: UnknownEvent,
    join: PlayerJoinEvent,
    login: PlayerLoginEvent,
    quit: PlayerQuitEvent,
    ready: GameReadyEvent,
    rconReady: RconReadyEvent,
    save: GameSaveEvent,
    autosaveOff: AutosaveOffEvent,
    autosaveOn: AutosaveOnEvent,
    close: GameCloseEvent,
    chat: PlayerChatEvent
}

export enum EventType {
    /**
     * The event was not detected
     */
    UnknownEvent = "event",

    /**
     * Called when the player has joined the game
     */
    PlayerJoinEvent = "join",
    /**
     * Called when the player is joining the game
     */
    PlayerLoginEvent = "login",
    /**
     * Called when a player has quit the game
     */
    PlayerQuitEvent = "quit",
    /**
     * Called when the game fully loads and is joinable.
     */
    GameReadyEvent = "ready",
    /**
     * Called when the rcon server is ready
     */
    RconReadyEvent = "rconReady",
    /**
     * Called when the game closes
     */
    GameCloseEvent = "close",
    
    /**
     * Called when the game saves
     */
    GameSaveEvent = "save",

    /**
     * Called when autosave is turned off
     */
    AutosaveOffEvent = "autosaveOff",
    /**
     * Called when autosave is turned on
     */
    AutosaveOnEvent = "autosaveOn",
    /**
     * Called when a player types in chat
     */
    PlayerChatEvent = "chat"
}

export default abstract class Event {
    /**
     * The type of the event
     */
    abstract readonly type: EventType;
    /**
     * The date when the event happened
     */
    abstract readonly date: Date;
}

export class UnknownEvent extends Event {
    readonly date: Date;
    readonly type = EventType.UnknownEvent;
    constructor(date: Date) {
        super();
        this.date = date;
    }
}


export class PlayerJoinEvent extends Event {
    readonly date: Date;
    readonly type = EventType.PlayerJoinEvent;
    readonly player: OnlinePlayer;
    constructor(date: Date, player: OnlinePlayer) {
        super();
        this.date = date;
        this.player = player;
    }
}
export class PlayerLoginEvent extends Event {
    readonly date: Date;
    readonly type = EventType.PlayerLoginEvent;
    readonly player: OnlinePlayer;
    constructor(date: Date, player: OnlinePlayer) {
        super();
        this.date = date;
        this.player = player;
    }
}

export class PlayerQuitEvent extends Event {
    readonly date: Date;
    readonly type = EventType.PlayerQuitEvent;
    readonly player: OnlinePlayer;
    readonly reason: string;
    constructor(date: Date, player: OnlinePlayer, reason: string) {
        super();
        this.date = date;
        this.player = player;
        this.reason = reason;
    }
}

export class GameReadyEvent extends Event {
    readonly date: Date;
    readonly type = EventType.GameReadyEvent;
    constructor(date: Date) {
        super();
        this.date = date;
    }
}
export class RconReadyEvent extends Event {
    readonly date: Date;
    readonly type = EventType.RconReadyEvent;
    constructor(date: Date) {
        super();
        this.date = date;
    }
}
export class GameSaveEvent extends Event {
    readonly date: Date;
    readonly type = EventType.GameSaveEvent;
    constructor(date: Date) {
        super();
        this.date = date;
    }
}

export class AutosaveOnEvent extends Event {
    readonly date: Date;
    readonly type = EventType.AutosaveOnEvent;
    constructor(date: Date) {
        super();
        this.date = date;
    }
}

export class AutosaveOffEvent extends Event {
    readonly date: Date;
    readonly type = EventType.AutosaveOffEvent;
    constructor(date: Date) {
        super();
        this.date = date;
    }
}

export class GameCloseEvent extends Event {
    readonly date: Date;
    readonly type = EventType.GameCloseEvent;
    constructor(date: Date) {
        super();
        this.date = date;
    }
}

export class PlayerChatEvent extends Event {
    readonly date: Date;
    readonly type = EventType.PlayerChatEvent;
    readonly player;
    readonly message;
    constructor(date: Date, player: OnlinePlayer, message: string) {
        super();
        this.date = date;
        this.player = player;
        this.message = message;
    }
}