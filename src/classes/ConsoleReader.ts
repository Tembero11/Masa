import { EventType } from "./Event";
import Player from "./Player";

export default class ConsoleReader {
    // The original data without the time in the beginning
    private readonly data: string;

    private _isInfo: boolean | undefined;

    public player: Player | undefined;

    private _eventType: EventType | undefined;

    // These are true if their getters have been called
    private _joinedPlayerCalled: boolean = false;
    private _leftPlayerCalled: boolean = false;

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

        console.log("Is info ", this._isInfo);

        return this._isInfo;
    }

    private _message: string | undefined;
    
    get message(): string {
        if (!this._message) {
            this._message = this.data.replace(/\[([A-Za-z0-9]|-|\/| ){1,}\]: /, "")
        }
        return this._message;
    }

    get isDoneMessage() { return this.data.search(/Done \(.{1,}\)\!/) > -1; }

    constructor(data: string) {
        this.data = data.replace(/\[[0-9]{1,2}:[0-9]{1,2}:[0-9]{1,2}\] /, "");
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
                let usernameMatches = match.match(/\]: ([a-zA-Z0-9]|_){3,16}/);

                if (usernameMatches && usernameMatches[0]) {
                    let username = usernameMatches[0].substr(3, usernameMatches[0].length - 3);

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
                let usernameMatches = match.match(/\]: ([a-zA-Z0-9]|_){3,16}\[/);

                if (usernameMatches && usernameMatches[0]) {
                    let username = usernameMatches[0].substr(3, usernameMatches[0].length - 4);

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
