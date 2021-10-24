import Event, { AutosaveOffEvent, AutosaveOnEvent, DoneEvent, EventType, GameSaveEvent, PlayerJoinEvent, PlayerLeaveEvent, UnknownEvent } from "./Event";
import Player from "./Player";

export default class ConsoleReader {
    // The original data without the time in the beginning
    readonly data: string;

    private _isInfo: boolean | undefined;

    public player: Player | undefined;

    private _eventType: EventType | undefined;

    // These are true if their getters have been called
    private _joinedPlayerCalled: boolean = false;
    private _leftPlayerCalled: boolean = false;

    /**
     * The Date when the instance was made
     */
    private date: Date;

    private isServerJoinable = false;

    generateEvent(): Event[] {
        let events: Event[] = [];

        if (this.isServerJoinable) {
            if (this.isLeaveEvent && this.player) {
                events.push(new PlayerLeaveEvent(this.date, this.player));
            }else if (this.isJoinEvent && this.player) {
                events.push(new PlayerJoinEvent(this.date, this.player));
            }
        }else if (this.isDoneMessage) {
            events.push(new DoneEvent(this.date));
        }
        
        
        if (this.isGameSaveEvent) {
            events.push(new GameSaveEvent(this.date));
        }
        if (this.isAutosaveOffEvent) {
            events.push(new AutosaveOffEvent(this.date));
        }
        if (this.isAutosaveOnEvent) {
            events.push(new AutosaveOnEvent(this.date));
        }

        return [...(events.length === 0 ? [new UnknownEvent(this.date)] : events)];
    }

    get eventType (): EventType {
        if (this._eventType) {
            return this._eventType;
        }else {
            throw new Error("EventType was not calculated!");
        }
    }

    get isLeaveEvent(): boolean {
        // Calculate the event type if it has not been calculated yet
        if (!this._eventType && !this._leftPlayerCalled) {
            this._eventType = this.leftPlayer != undefined ? EventType.PlayerLeaveEvent : undefined;
        }

        return this._eventType === EventType.PlayerLeaveEvent;
    }

    get isJoinEvent(): boolean {
        // Calculate the event type if it has not been calculated yet
        if (!this._eventType && !this._joinedPlayerCalled) {
            this._eventType = this.joinedPlayer != undefined ? EventType.PlayerJoinEvent : undefined;
        }

        return this._eventType === EventType.PlayerJoinEvent;
    }

    /**
     * Checks if the event is related to a player
     * 
     * WARNING: this may be performance intensive depending on the situation
     */
    get isPlayerRelated(): boolean {
        // Calculate all player related events
        return this.player != undefined || this.joinedPlayer != undefined || this.leftPlayer != undefined;
    }

    /**
     * Is true if the event is a Server thread/INFO
     */
    get isInfo(): boolean {
        if (this._isInfo != undefined) {
            return this._isInfo;
        }
        this._isInfo = this.data.startsWith("[Server thread/INFO]: ");

        return this._isInfo;
    }

    private _message: string | undefined;
    

    /**
     * Returns data with only the message
     */
    get message(): string {
        if (!this._message) {
            this._message = this.data.replace(/\[([A-Za-z0-9]|-|\/| ){1,}\]: /, "")
        }
        return this._message;
    }

    get isDoneMessage() { 
        return this.data.search(/Done \(.{1,}\)\!/) > -1;
    }

    /**
     * Only for manual saves
     */
    get isGameSaveEvent() {
        return this.message.startsWith("Saved the game");
    }
    
    get isAutosaveOffEvent() {
        return this.message.startsWith("Automatic saving is now disabled") || this.message.startsWith("Saving is already turned off");
    }

    get isAutosaveOnEvent() {
        return this.message.startsWith("Automatic saving is now enabled") || this.message.startsWith("Saving is already turned on");
    }

    constructor(data: string, isJoinable: boolean) {
        this.isServerJoinable = isJoinable;
        this.data = data.replace(/\[[0-9]{1,2}:[0-9]{1,2}:[0-9]{1,2}\] /, "");
        this.date = new Date();
    }


    /**
     * Returns the player that left if there is one
     */
    get leftPlayer(): Player | undefined {
        // Set the mode to called
        this._leftPlayerCalled = true;

        // Don't even check if the event has been checked already
        if (this._eventType === EventType.PlayerLeaveEvent && this.player) {
            return this.player;
        }

        if (this.isInfo) {
            let matches = this.message.match(/([a-zA-Z0-9]|_){3,16} left/);
            if (matches && matches[0]) {
                let match = matches[0];
                let username = match.substring(0, match.length - " left".length)

                if (username) {
                    // Create a new player instance
                    let player = new Player(username);

                    this.player = player;
                    this._eventType = EventType.PlayerLeaveEvent;

                    return player;
                }
            }
        }
        return undefined;
    }

    /**
     * Returns the player that joined if there is one
     */
    get joinedPlayer(): Player | undefined {
        // Set the mode to called
        this._joinedPlayerCalled = true;

        // Don't even check if the event has been checked already
        if (this._eventType === EventType.PlayerJoinEvent && this.player) {
            return this.player;
        }

        if (this.isInfo) {
            let matches = this.message.match(/([a-zA-Z0-9]|_){3,16}\[.{1,}\] logged/);

            if (matches && matches[0]) {
                let match = matches[0];
                let usernameMatches = match.match(/([a-zA-Z0-9]|_){3,16}\[/);

                if (usernameMatches && usernameMatches[0]) {
                    let username = usernameMatches[0].substr(0, usernameMatches[0].length - 1);

                    // Create a new player instance
                    let player = new Player(username);

                    this.player = player;
                    this._eventType = EventType.PlayerJoinEvent;

                    return player;
                }

            }
        }
        return undefined;
    }
}
