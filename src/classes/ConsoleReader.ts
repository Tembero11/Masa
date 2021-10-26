import assert from "assert";
import { NoPlayerError } from "./Errors";
import Event, { AutosaveOffEvent, AutosaveOnEvent, PlayerChatEvent, GameReadyEvent, EventType, GameSaveEvent, PlayerJoinEvent, PlayerQuitEvent, UnknownEvent } from "./Event";
import Player from "./Player";
import ServerCommunicator from "./server/ServerCommunicator";

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
    readonly players;
    readonly server: ServerCommunicator;

    
    protected usernameRegex = /[A-Za-z0-9_]{3,16}/;
    protected chatMessageRegex = /^<[A-Za-z0-9_]{3,16}> .*/;
    protected loggedInRegex = /[A-Za-z0-9_]{3,16}\[.*\] logged in/;
    protected quitRegex = /[A-Za-z0-9_]{3,16} lost connection/;
    

    generateEvent(): Event {
        if (this.isServerJoinable) {
            if (this.isChatMessage) {
                let player = this.getChatSender();
                let msg = this.getChatMessage();
                return new PlayerChatEvent(this.date, player, msg);
            }
            if (this.isQuitEvent) {
                return new PlayerQuitEvent(this.date, this.getQuitPlayer(), this.getQuitReason());
            }else if (this.isJoinEvent) {
                return new PlayerJoinEvent(this.date, this.getJoinedPlayer());
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

    get isQuitEvent(): boolean {
        if (this._eventType === EventType.PlayerQuitEvent) {
            return true;
        }
        if (!this.isChatMessage && this.message.search(this.quitRegex) > -1) {
            this._eventType = EventType.PlayerQuitEvent;
            return true; 
        }

        return false;
    }

    /**
     * @throws {NoPlayerError} if the event was not `EventType.PlayerQuitEvent` or the player was not found in the players map provided
     * @returns {Player} The player instance that previously joined
     */
    getQuitPlayer(): Player {
        if (this.isQuitEvent) {
            let start = 0;
            let end = this.message.indexOf(" ");
            let playerName = this.message.substring(start, end);
            let player = this.players.get(playerName);
            assert(player, new NoPlayerError());
            return player;
        }
        throw new NoPlayerError();
    }
    getQuitReason(): string {
        if (this.isQuitEvent) {
            let message = this.message.split(":")[1].substring(1);
            return message;
        }
        throw new NoPlayerError();
    }

    get isJoinEvent(): boolean {
        if (this._eventType === EventType.PlayerJoinEvent) {
            return true;
        }
        if (!this.isChatMessage && this.message.search(this.loggedInRegex) > -1) {
            this._eventType = EventType.PlayerJoinEvent;
            return true; 
        }

        return false;
    }
    /**
     * @throws {NoPlayerError} if the event was not `EventType.PlayerJoinEvent`
     * @returns {Player} A completely new instance of {Player}
     */
    getJoinedPlayer(): Player {
        if (this.isJoinEvent) {
            let start = 0;
            let end = this.message.indexOf("[");
            let playerName = this.message.substring(start, end);
            let player = new Player(playerName, this.server);
            return player;
        }
        throw new NoPlayerError();
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

    get isChatMessage(): boolean {
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
            const player = this.players.get(playerName);
            assert(player, new NoPlayerError());
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

    constructor(data: string, server: ServerCommunicator, isJoinable: boolean, players: Map<string, Player>) {
        this.isServerJoinable = isJoinable;
        this.data = data.replace(/\[[0-9]{1,2}:[0-9]{1,2}:[0-9]{1,2}\] /, "");
        this.date = new Date();
        this.players = players;
        this.server = server;
    }
}
