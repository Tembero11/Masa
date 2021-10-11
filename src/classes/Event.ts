import ConsoleReader from "./ConsoleReader";
import Player from "./Player";

export interface ServerEvent {
    event: UnknownEvent,
    join: PlayerJoinEvent,
    leave: PlayerLeaveEvent,
    done: DoneEvent
    save: GameSaveEvent
    autosaveOff: AutosaveOffEvent,
    autosaveOn: AutosaveOnEvent,
}

export enum EventType {
    /**
     * The event was not detected
     */
    UnknownEvent = "event",
    /**
     * The event when a player joins the server
     */
    PlayerJoinEvent = "join",
    /**
     * The event when a player leaves the server
     */
    PlayerLeaveEvent = "leave",
    /**
     * When the server fully loads and is joinable.
     */
    DoneEvent = "done",
    /**
     * When the server fully loads and is joinable.
     */
    GameSaveEvent = "save",

    AutosaveOffEvent = "autosaveOff",
    AutosaveOnEvent = "autosaveOn",
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

export class PlayerLeaveEvent extends Event {
    readonly date: Date;
    readonly type = EventType.PlayerLeaveEvent;
    readonly player: Player;
    constructor(date: Date, player: Player) {
        super();
        this.date = date;
        this.player = player;
    }
}

export class DoneEvent extends Event {
    readonly date: Date;
    readonly type = EventType.DoneEvent;
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

// export class DataEvent extends Event {
//     readonly date: Date;
//     readonly type = EventType.DataEvent;
//     readonly reader;
//     constructor(reader: ConsoleReader, date: Date) {
//         super();
//         this.date = date;
//         this.reader = reader;
//     }
// }