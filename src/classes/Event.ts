import Player from "./Player";

export interface CommunicatorEvent {
    event: UnknownEvent,
    join: PlayerJoinEvent,
    quit: PlayerQuitEvent,
    ready: GameReadyEvent
    save: GameSaveEvent
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
     * Called when a player has quit the game
     */
    PlayerQuitEvent = "quit",
    /**
     * Called when the game fully loads and is joinable.
     */
    GameReadyEvent = "ready",
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
    readonly player: Player;
    constructor(date: Date, player: Player) {
        super();
        this.date = date;
        this.player = player;
    }
}

export class PlayerQuitEvent extends Event {
    readonly date: Date;
    readonly type = EventType.PlayerQuitEvent;
    readonly player: Player;
    constructor(date: Date, player: Player) {
        super();
        this.date = date;
        this.player = player;
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
// TODO ADD PLAYER & CHAT MESSAGE
export class PlayerChatEvent extends Event {
    readonly date: Date;
    readonly type = EventType.PlayerChatEvent;
    readonly player;
    readonly message;
    constructor(date: Date, player: Player, message: string) {
        super();
        this.date = date;
        this.player = player;
        this.message = message;
    }
}