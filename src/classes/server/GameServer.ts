import { ChildProcessWithoutNullStreams, spawn } from "child_process";
import assert from "assert";
import { NoListenersError, NoStandardStreamsError } from "../Errors";
import { nanoid } from "nanoid";
import PropertiesManager from "../PropertiesManager";
import path from "path";
import { ServerMetadata } from "../../config";
import GameLiveConf, { FilePlayerEntry } from "./GameLiveConf";
import Event, { AutosaveOffEvent, AutosaveOnEvent, CommunicatorEvent, GameCloseEvent, GameSaveEvent, PlayerLoginEvent, PlayerQuitEvent } from "../Event";
import { StandardEmitter } from "./StandardEmitter";
import { OfflinePlayer, OnlinePlayer } from "../Player";
import { Readable, Writable } from "stream";
import ConsoleReader from "../ConsoleReader";
import GameServerRCON from "./GameServerRCON";

interface Options {
  disableRCON?: boolean,
  metadata?: ServerMetadata
}

/**
 * Player name alias for readability
 */
type PlayerName = string;

type CommunicatorEventListener<T extends Event> = (event: T) => void | Promise<void>;

export default class GameServer {
  private command;
  readonly dir;
  private serverProcess: ChildProcessWithoutNullStreams | null = null;

  metadata?: ServerMetadata;

  get name() {
    return this.options?.metadata?.name;
  }
  get tag() {
    return this.options?.metadata?.tag || this._tag as string;
  }

  private readonly _tag?: string;
  public readonly options;

  get pid(): number | undefined {
    return this.serverProcess?.pid;
  }

  rcon: GameServerRCON | undefined;

  liveConf: GameLiveConf;

  // Player related stuff
  protected _players: Map<PlayerName, OnlinePlayer> = new Map();
  getOnlinePlayers() {
    return Object.freeze(this._players);
  }
  getOnlinePlayersArray(): OnlinePlayer[] {
    return Array.from(this._players.values());
  }
  getOnlinePlayersCount() {
    return this.getOnlinePlayers().size;
  }

  getOfflinePlayers() {
    if (!this.liveConf.hasFile("usercache")) return new Map<PlayerName, OfflinePlayer>();
    const usercache = this.liveConf.getFile("usercache") as FilePlayerEntry[];

    const playerMap = new Map<PlayerName, OfflinePlayer>();

    usercache.forEach(player => {
      if (this.getOnlinePlayers().has(player.name)) return;
      playerMap.set(player.name, new OfflinePlayer(player.name, this.liveConf, this));
    });

    return playerMap;
  }
  getOfflinePlayersArray() {
    return Array.from(this.getOfflinePlayers().values());
  }

  getAllPlayersArray() {
    return [...this.getOfflinePlayersArray(), ...this.getOnlinePlayersArray()];
  }
  

  /**
   * 
   * @param command 
   * @param directory The directory in which the command is run
   */
  constructor(command: string, directory: string, options?: Options) {
    this._stdin = null;
    this._stdout = null;
    this._stderr = null;

    this.std = new StandardEmitter();
    // Redirect std.emit("in") to _stdin.write
    this.std.on("in", e => this._stdin?.write(e));


    if (this._stdin && this._stdout && this._stderr) {
      this.reload();
    }

    this.events = new CommunicatorEventEmitter(this);

    this.on("login", this.onLogin.bind(this));
    this.on("quit", this.onLeave.bind(this));
    this.on("ready", this.onReady.bind(this));

    // ===========

    if (options) {
      this.options = options;
      if (this.options.metadata) this.metadata = this.options.metadata;
    }else {
      this._tag = GameServer.generateTag();
    }

    this.command = command;
    this.dir = directory;

    if (!options?.disableRCON) {
      const properties = new PropertiesManager(path.join(this.dir, "server.properties"));

      properties.set("enable-rcon", "true");

      let rconPass = properties.get("rcon.password");
      if (!rconPass) {
        rconPass = nanoid(25);
        properties.set("rcon.password", rconPass);
      }

      let rconPort = properties.get("rcon.port");
      if (!rconPort) {
        rconPort = "27565";
        properties.set("rcon.port", rconPort);
      }

      properties.writeSync();

      this.rcon = new GameServerRCON(this, "127.0.0.1", parseInt(rconPort), rconPass);

      this.on("rconReady", async () => {
        if (this.rcon?.isConnected) return;
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        if (await this.rcon!.establishConnection()) {
          console.log(`RCON successfully connected on server ${this.tag}`);
        } else {
          console.log(`RCON connection failed on server ${this.tag}`);
        }
      });
      this.on("close", async () => {
        await this.rcon?.disconnect();
      });
    }

    this.liveConf = new GameLiveConf(this);
  }

  /**
   * Sends a command to the game through RCON if available. Defaults to sending through stdin.
   * @param gameCommand A string containing a gameCommand with or without a slash
   */
  sendGameCommand(gameCommand: string) {
    if (!this.hasStreams) return false;

    if (gameCommand.startsWith("/")) gameCommand = gameCommand.substring(1);

    if (this.rcon?.isConnected) {
      this.rcon.sendGameCommand(gameCommand).catch(() => {
        this.std.emit("in", gameCommand + "\n");
      });
    }else {
      this.std.emit("in", gameCommand + "\n");
    }
    return true;
  }

  static generateTag() {
    return nanoid(9);
  }
  

      /**
     * @description This should get called when the any of the server standard streams have been reassigned
     */
  reload() {
    assert(this.serverProcess);

    this._stdin = this.serverProcess.stdin;
    this._stdout = this.serverProcess.stdout;
    this._stderr = this.serverProcess.stderr;

    assert(this._stdout && this._stderr, new NoStandardStreamsError(["stdout", "stderr"]));
    this._stdout.on("data", this.onMessage.bind(this));
    this._stderr.on("data", this.onError.bind(this));
    this._stdout.on("end", () => this.notifyListeners(new GameCloseEvent(new Date())));

    // Add listeners for handling server closing
    this.serverProcess.on("close", () => this.resetState());
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
    this.serverProcess = null;
  }

  static spawn(command: string, dir: string) {
    return spawn(command, { shell: true, cwd: dir })
  }

  /**
   * 
   * @returns The exit code of the server process if the code could be catched
   * @throws {NoStandardStreamsError} if the server is already stopped
   */
  stop(): Promise<number | null> {
    return new Promise((res) => {
      assert(this._stdin && this.serverProcess, new NoStandardStreamsError("stdin"));
      this.serverProcess.once("close", (code) => {
        this.serverProcess = null;
        res(code);
      });
      this._stdin.write("stop\n");
    });
  }

  /**
   * @param signal The signal to send to the process when killed. Ignored when on Windows
   * @returns The exit code of the server process if the code could be catched
   * @throws {NoStandardStreamsError} if the server is already stopped
   */
  forceStop(signal?: NodeJS.Signals): Promise<number | null> {
    return new Promise((res) => {
      assert(this.serverProcess, new NoStandardStreamsError());
      this.serverProcess.once("close", (code) => {
        this.serverProcess = null;
        res(code);
      });
      this.serverProcess.kill(signal || "SIGQUIT"); 
    });
  }

  safeStart() {
    if (this.hasStreams) return;
    this.serverProcess = GameServer.spawn(this.command, this.dir);
    this.reload();
  }
  safeStop() {
    if (this.hasStreams && this.serverProcess) {
      this.sendGameCommand("stop");
    }
  }

  /**
   * @description Starts the server if the server is not started
   * 
   * @returns true if the server was started
   */
  start(): boolean {
    if (!this.serverProcess) {
      this.serverProcess = GameServer.spawn(this.command, this.dir);
      
      this.reload();

      return true;
    }

    return false;
  }

  private listeners: {[key: string]: ServerListener<any>[]} = {};


    protected _stdout: Readable | null;
    protected _stderr: Readable | null;
    protected _stdin: Writable | null;
    /**
     * @description contains all the standard streams
     */
    std: StandardEmitter;

    events;

    get playerCount() {
        return this._players.size;
    }

    protected _isServerJoinable = false;
    get isJoinable() {
        return this._isServerJoinable;
    }
    get hasStreams(): boolean {
        return this._stdin != null && this._stdout != null && this._stderr != null;
    }

    /**
     * @type {boolean} is true if the server is either starting or stopping
     */
    get isUnstable() {
        return this.hasStreams && !this.isJoinable;
    }


    // =================================

    private onError(data: any) {
        this.std.emit("err", data.toString());
    }

    private onMessage(data: any) {
        const reader = new ConsoleReader(data.toString(), this, this.liveConf, this._isServerJoinable, this.getOnlinePlayers(), this.getOfflinePlayers());
        // Notify the stdout EventEmitter
        this.std.emit("out", reader);
        this.notifyListeners(reader.generateEvent());
    }
    private onLogin(e: PlayerLoginEvent) {
        this._players.set(e.player.getUsername(), e.player);
    }
    private onLeave(e: PlayerQuitEvent) {
        this._players.delete(e.player.getUsername());
    }
    private onReady() {
        this._isServerJoinable = true;
    }
 

    private notifyListeners(event: Event) {
        if (!(event.type in this.listeners)) this.listeners[event.type] = [];
      
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        this.listeners[event.type].forEach(e => e.listener(event));
    }


    /**
     * 
     * @param event The type of the event
     * @param listener The listener called everytime the event occurs
     */
    on<T extends keyof CommunicatorEvent>(event: T, listener:  CommunicatorEventListener<CommunicatorEvent[T]>) {
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
            const index = this.listeners[event].push(listenerInstance) - 1;
        });
    }

    /**
     * The event listener gets removed after the first occurrence of this event
     * @param event The type of the event
     * @param listener The listener called once the event occurs
     */
    once<T extends keyof CommunicatorEvent>(event: T, listener: CommunicatorEventListener<CommunicatorEvent[T]>) {
        if (!(event in this.listeners)) this.listeners[event] = [];

        void this.waitfor(event).then(listener);
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
            // eslint-disable-next-line @typescript-eslint/unbound-method
            this._stdout.removeListener("data", this.onMessage);
        }
    }
}

// This contains all event emit functions
class CommunicatorEventEmitter {
  private communicator;
  constructor(communicator: GameServer) {
      this.communicator = communicator;
  }

  /**
   * Manually save the game
   */
  async saveGame(): Promise<GameSaveEvent> {
      assert(this.communicator.hasStreams, new NoStandardStreamsError());
      this.communicator.std.emit("in", "save-all\n");

      const event = await this.communicator.waitfor("save");

      return event;
  }
  async disableAutosave(): Promise<AutosaveOffEvent> {
      assert(this.communicator.hasStreams, new NoStandardStreamsError());
      this.communicator.std.emit("in", "save-off\n");

      const event = await this.communicator.waitfor("autosaveOff");

      return event;
  }
  async enableAutosave(): Promise<AutosaveOnEvent> {
      assert(this.communicator.hasStreams, new NoStandardStreamsError());
      this.communicator.std.emit("in", "save-on\n");

      const event = await this.communicator.waitfor("autosaveOn");

      return event;
  }

  async kickPlayer(player: OnlinePlayer, message?: string): Promise<PlayerQuitEvent> {
      assert(this.communicator.hasStreams, new NoStandardStreamsError());
      this.communicator.std.emit("in", `kick ${player.getUsername()} ${message || ""}\n`);

      let event;

      do {
          event = await this.communicator.waitfor("quit");
      } while (event.player.getUsername() == player.getUsername());

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