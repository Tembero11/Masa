import { ChildProcessWithoutNullStreams } from "child_process";
import internal from "stream";
import {ConsoleReader} from "./ConsoleAPI";
import { NoListenersError } from "./Errors";
import Event, { AutosaveOffEvent, AutosaveOnEvent, DoneEvent, GameSaveEvent, PlayerJoinEvent, PlayerLeaveEvent, ServerEvent, UnknownEvent } from "./Event";
import Player from "./Player";

type ServerEventListener<T extends Event> = (event: T) => void;

/**
 * Player name alias for readability
 */
type PlayerName = string;


/**
 * Should be created before the server has started.
 */
export default class ServerCommunicator {

    private listeners: {[key: string]: ServerListener<any>[]} = {};

    serverProcess;

    events;

    private _players: Map<PlayerName, Player> = new Map();

    get players() {
        return Object.freeze(this._players);
    }
    get playersArray(): Player[] {
        return Array.from(this._players.values());
    }

    get playerCount() {
        return this._players.size;
    }

    private _isServerJoinable: boolean = false;
    get isJoinable() {
        return this._isServerJoinable;
    }

    constructor(serverProcess: ChildProcessWithoutNullStreams) {
        this.serverProcess = serverProcess;

        this.events = new ServerEventEmitter(serverProcess, this);

        serverProcess.stdout.on("data", this.onMessage.bind(this));

        this.on("join", this.onJoin.bind(this));
        this.on("leave", this.onLeave.bind(this));
        this.on("done", this.onDone.bind(this));
    }

    private onMessage(data: any) {
        this.notifyListeners(new ConsoleReader(data.toString(), this._isServerJoinable).generateEvent()); 
    }
    private onJoin(e: PlayerJoinEvent) {
        this._players.set(e.player.username, e.player);
    }
    private onLeave(e: PlayerLeaveEvent) {
        this._players.delete(e.player.username);
    }
    private onDone(e: DoneEvent) {
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
    on<T extends keyof ServerEvent>(event: T, listener: ServerEventListener<ServerEvent[T]>) {
        if (!(event in this.listeners)) this.listeners[event] = [];
        this.listeners[event].push(new ServerListener(event, listener));
    }

    // waitfor<T extends keyof ServerEvent>(event: T): Promise<ServerEvent[T]>;
    // waitfor<T extends keyof ServerEvent>(event: T, callback: ServerEventListener<ServerEvent[T]>): void;

    /**
     * Only listens for the first instance of the event provided
     * @param event The event to listen for
     */
    waitfor<T extends keyof ServerEvent>(event: T): Promise<ServerEvent[T]> {
        if (!(event in this.listeners)) this.listeners[event] = [];

        return new Promise<ServerEvent[T]>((res) => {
            const listener = (e: ServerEvent[T]) => {
                this.listeners[event].splice(index);
                res(e)
            }
            const listenerInstance = new ServerListener(event, listener.bind(this));
            let index = this.listeners[event].push(listenerInstance) - 1;
        });
    }

    /**
     * 
     * @param event The type of the event
     * @param listener The listener called everytime the event occurs
     * @throws {NoListenersError} if called when no listeners where created earlier 
     */
    removeListener<T extends keyof ServerEvent>(event: T, listener: ServerListener<T>) {
        if (!(event in this.listeners)) throw new NoListenersError();
        this.listeners[event] = this.listeners[event].filter(e => e !== listener);
    }

    /**
     * Deletes all resources created by this instance
     */
    dispose() {
        this.serverProcess.stdout.removeListener("data", this.onMessage)
    }
}

// This contains all event emit functions
class ServerEventEmitter {
    private serverProcess;
    private communicator;
    constructor(serverProcess: ChildProcessWithoutNullStreams, communicator: ServerCommunicator) {
        this.serverProcess = serverProcess;
        this.communicator = communicator;
    }

    /**
     * Manually save the game
     */
    async saveGame(): Promise<GameSaveEvent> {
        this.serverProcess.stdin.write("save-all\n");

        let event = await this.communicator.waitfor("save");

        return event;
    }
    async disableAutosave(): Promise<AutosaveOffEvent> {
        this.serverProcess.stdin.write("save-off\n");

        let event = await this.communicator.waitfor("autosaveOff");

        return event;
    }
    async enableAutosave(): Promise<AutosaveOnEvent> {
        this.serverProcess.stdin.write("save-on\n");

        let event = await this.communicator.waitfor("autosaveOn");

        return event;
    }
}

class ServerListener<T extends keyof ServerEvent> {
    listener;
    event: T;
    constructor(event: T, listener: ServerEventListener<ServerEvent[T]>) {
        this.listener = listener;
        this.event = event;
    }
}