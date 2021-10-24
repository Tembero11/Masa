import { NoPlayerError } from "./Errors";
import Event, { AutosaveOffEvent, AutosaveOnEvent, PlayerChatEvent, GameReadyEvent, EventType, GameSaveEvent, PlayerJoinEvent, PlayerQuitEvent, UnknownEvent } from "./Event";
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

    
    protected usernameRegex = /[A-Za-z0-9_]{3,16}/;
    protected chatMessageRegex = /^<[A-Za-z0-9_]{3,16}> .*/;

    generateEvent(): Event {
        if (this.isServerJoinable) {
            if (this.isChatMessage) {
                let player = this.getChatSender();
                let msg = this.getChatMessage();
                return new PlayerChatEvent(this.date, player, msg);
            }
            if (this.isLeaveEvent && this.player) {
                return new PlayerQuitEvent(this.date, this.player);
            }else if (this.isJoinEvent && this.player) {
                return new PlayerJoinEvent(this.date, this.player);
            }
        }else if (this.isDoneMessage) {
            return new GameReadyEvent(this.date);
        }
        
        
        if (this.isGameSaveEvent) {
            return new GameSaveEvent(this.date)
        }
        if (this.isAutosaveOffEvent) {
            return new AutosaveOffEvent(this.date);
        }
        if (this.isAutosaveOnEvent) {
            return new AutosaveOnEvent(this.date);
        }
        

        return new UnknownEvent(this.date);
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
            this._eventType = this.getLeftPlayer() != undefined ? EventType.PlayerQuitEvent : undefined;
        }

        return this._eventType === EventType.PlayerQuitEvent;
    }

    get isJoinEvent(): boolean {
        // Calculate the event type if it has not been calculated yet
        if (!this._eventType && !this._joinedPlayerCalled) {
            this._eventType = this.getJoinedPlayer() != undefined ? EventType.PlayerJoinEvent : undefined;
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
        return this.player != undefined || this.getJoinedPlayer() != undefined || this.getLeftPlayer() != undefined || this.isChatMessage;
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

    get isChatMessage() {
        if (this._eventType == EventType.PlayerChatEvent) return true;

        let is = this.message.search(this.chatMessageRegex) > -1;

        if (is) {
            this._eventType = EventType.PlayerChatEvent;
        }

        return is;
    }
    /**
     * @description Get the player that sent the chat
     * @throws {NoPlayerError} if the event was not EventType.ChatEvent
     * @returns {Player} The player that sent the chat
     */
    getChatSender(): Player {
        if (this.isChatMessage) {
            const end = this.message.indexOf(">");
            const start = 1;
            const playerName = this.message.substring(start, end);
            const player = new Player(playerName);
            return player;
        }
        throw new NoPlayerError();
    }
    /**
     * @description Get the player that sent the chat
     * @throws {NoPlayerError} if the event was not EventType.ChatEvent
     * @returns {string} The player that sent the chat
     */
    getChatMessage(): string {
        if (this.isChatMessage) {
            const start = this.message.indexOf(">") + 2;
            const msg = this.message.substring(start);
            return msg;
        }
        throw new NoPlayerError();
    }

    get isDoneMessage() { 
        return !this.isChatMessage && this.data.search(/Done \(.{1,}\)\!/) > -1;
    }

    /**
     * Only for manual saves
     */
    get isGameSaveEvent() {
        return !this.isChatMessage && this.message.startsWith("Saved the game");
    }
    
    get isAutosaveOffEvent() {
        return !this.isChatMessage && (this.message.startsWith("Automatic saving is now disabled") || this.message.startsWith("Saving is already turned off"));
    }

    get isAutosaveOnEvent() {
        return !this.isChatMessage && (this.message.startsWith("Automatic saving is now enabled") || this.message.startsWith("Saving is already turned on"));
    }

    constructor(data: string, isJoinable: boolean) {
        this.isServerJoinable = isJoinable;
        this.data = data.replace(/\[[0-9]{1,2}:[0-9]{1,2}:[0-9]{1,2}\] /, "");
        this.date = new Date();
    }


    /**
     * Returns the player that left if there is one
     */
    getLeftPlayer(): Player | undefined {
        if (this.isChatMessage) return undefined;
        // Set the mode to called
        this._leftPlayerCalled = true;

        // Don't even check if the event has been checked already
        if (this._eventType === EventType.PlayerQuitEvent && this.player) {
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
                    this._eventType = EventType.PlayerQuitEvent;

                    return player;
                }
            }
        }
        return undefined;
    }

    /**
     * Returns the player that joined if there is one
     */
    getJoinedPlayer(): Player | undefined {
        if (this.isChatMessage) return undefined;
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
