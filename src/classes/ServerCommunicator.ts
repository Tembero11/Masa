import { ChildProcessWithoutNullStreams } from "child_process";
import assert from "assert";
import internal, { EventEmitter, Readable, Writable } from "stream";
import {ConsoleReader} from "./MasaAPI";
import { NoListenersError, NoStandardStreamsError } from "./Errors";
import Event, { AutosaveOffEvent, AutosaveOnEvent, GameReadyEvent, GameSaveEvent, PlayerJoinEvent, CommunicatorEvent, UnknownEvent, GameCloseEvent, PlayerQuitEvent } from "./Event";
import Player from "./Player";
import { StandardEmitter } from "./StandardEmitter";

type CommunicatorEventListener<T extends Event> = (event: T) => void;

/**
 * Player name alias for readability
 */
type PlayerName = string;


/**
 * Should be created before the server has started.
 */
export default class ServerCommunicator {

    private listeners: {[key: string]: ServerListener<any>[]} = {};


    protected _stdout: Readable | null;
    protected _stderr: Readable | null;
    protected _stdin: Writable | null;
    /**
     * @description contains all the standard streams
     */
    std: StandardEmitter;

    events;

    protected _players: Map<PlayerName, Player> = new Map();

    get players() {
        return Object.freeze(this._players);
    }
    get playersArray(): Player[] {
        return Array.from(this._players.values());
    }

    get playerCount() {
        return this._players.size;
    }

    protected _isServerJoinable: boolean = false;
    get isJoinable() {
        return this._isServerJoinable;
    }
    get hasStreams(): boolean {
        return this._stdin != null && this._stdout != null && this._stderr != null;
    }

    constructor(stdin: Writable | null, stdout: Readable | null, stderr: Readable | null) {
        this._stdin = stdin;
        this._stdout = stdout;
        this._stderr = stderr;

        this.std = new StandardEmitter();
        // Redirect std.emit("in") to _stdin.write
        this.std.on("in", e => this._stdin?.write(e));
        

        if (this._stdin && this._stdout && this._stderr) {
            this.reload();
        }

        this.events = new CommunicatorEventEmitter(this);

        this.on("join", this.onJoin.bind(this));
        this.on("quit", this.onLeave.bind(this));
        this.on("ready", this.onReady.bind(this));
    }

    /**
     * @description This should get called when the any of the server standard streams have been reassigned
     */
    protected reload() {
        assert(this._stdout && this._stderr, new NoStandardStreamsError(["stdout", "stderr"]));
        this._stdout.on("data", this.onMessage.bind(this));
        this._stderr.on("data", this.onError.bind(this));
        this._stdout.on("end", () => this.notifyListeners(new GameCloseEvent(new Date())));
    }
    /**
     * @description Resets all values to default
     */
    protected resetState() {
        this.dispose();
        this._isServerJoinable = false;
        this._players.clear();
        this._stdin = null;
        this._stdout = null;
        this._stdin = null;
    }

    private onError(data: any) {
        this.std.emit("err", data.toString());
    }

    private onMessage(data: any) {
        let reader = new ConsoleReader(data.toString(), this, this._isServerJoinable, this.players);
        // Notify the stdout EventEmitter
        this.std.emit("out", reader);
        this.notifyListeners(reader.generateEvent());
    }
    private onJoin(e: PlayerJoinEvent) {
        this._players.set(e.player.username, e.player);
    }
    private onLeave(e: PlayerQuitEvent) {
        this._players.delete(e.player.username);
    }
    private onReady(e: GameReadyEvent) {
        this._isServerJoinable = true;
    }
 

    private notifyListeners(event: Event) {
        if (!(event.type in this.listeners)) this.listeners[event.type] = [];

        this.listeners[event.type].forEach(e => e.listener(event));
    }


    /**
     * 
     * @param event The type of the event
     * @param listener The listener called everytime the event occurs
     */
    on<T extends keyof CommunicatorEvent>(event: T, listener: CommunicatorEventListener<CommunicatorEvent[T]>) {
        if (!(event in this.listeners)) this.listeners[event] = [];
        this.listeners[event].push(new ServerListener(event, listener));
    }

    // waitfor<T extends keyof CommunicatorEvent>(event: T): Promise<CommunicatorEvent[T]>;
    // waitfor<T extends keyof CommunicatorEvent>(event: T, callback: CommunicatorEventListener<CommunicatorEvent[T]>): void;

    /**
     * Only listens for the first instance of the event provided
     * @param event The event to listen for
     */
    waitfor<T extends keyof CommunicatorEvent>(event: T): Promise<CommunicatorEvent[T]> {
        if (!(event in this.listeners)) this.listeners[event] = [];

        return new Promise<CommunicatorEvent[T]>((res) => {
            const listener = (e: CommunicatorEvent[T]) => {
                this.listeners[event].splice(index);
                res(e)
            }
            const listenerInstance = new ServerListener(event, listener.bind(this));
            let index = this.listeners[event].push(listenerInstance) - 1;
        });
    }

    /**
     * The event listener gets removed after the first occurrence of this event
     * @param event The type of the event
     * @param listener The listener called once the event occurs
     */
    once<T extends keyof CommunicatorEvent>(event: T, listener: CommunicatorEventListener<CommunicatorEvent[T]>) {
        if (!(event in this.listeners)) this.listeners[event] = [];

        this.waitfor(event).then(listener);
    }

    /**
     * 
     * @param event The type of the event
     * @param listener The listener called everytime the event occurs
     * @throws {NoListenersError} if called when no listeners where created earlier 
     */
    removeListener<T extends keyof CommunicatorEvent>(event: T, listener: ServerListener<T>) {
        if (!(event in this.listeners)) throw new NoListenersError();
        this.listeners[event] = this.listeners[event].filter(e => e !== listener);
    }

    /**
     * Deletes all resources created by this instance
     */
    dispose() {
        if (this._stdout) {
            this._stdout.removeListener("data", this.onMessage);
        }
    }
}

// This contains all event emit functions
class CommunicatorEventEmitter {
    private communicator;
    constructor(communicator: ServerCommunicator) {
        this.communicator = communicator;
    }

    /**
     * Manually save the game
     */
    async saveGame(): Promise<GameSaveEvent> {
        assert(this.communicator.hasStreams, new NoStandardStreamsError());
        this.communicator.std.emit("in", "save-all\n");

        let event = await this.communicator.waitfor("save");

        return event;
    }
    async disableAutosave(): Promise<AutosaveOffEvent> {
        assert(this.communicator.hasStreams, new NoStandardStreamsError());
        this.communicator.std.emit("in", "save-off\n");

        let event = await this.communicator.waitfor("autosaveOff");

        return event;
    }
    async enableAutosave(): Promise<AutosaveOnEvent> {
        assert(this.communicator.hasStreams, new NoStandardStreamsError());
        this.communicator.std.emit("in", "save-on\n");

        let event = await this.communicator.waitfor("autosaveOn");

        return event;
    }

    async kickPlayer(player: Player, message?: string): Promise<PlayerQuitEvent> {
        assert(this.communicator.hasStreams, new NoStandardStreamsError());
        this.communicator.std.emit("in", `kick ${player.username} ${message || ""}\n`);

        let event;

        do {
            event = await this.communicator.waitfor("quit");
        } while (event.player.username == player.username);

        return event;
    }
}

class ServerListener<T extends keyof CommunicatorEvent> {
    listener;
    event: T;
    constructor(event: T, listener: CommunicatorEventListener<CommunicatorEvent[T]>) {
        this.listener = listener;
        this.event = event;
    }
}