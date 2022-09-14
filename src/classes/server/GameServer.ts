import { ChildProcessWithoutNullStreams, spawn } from "child_process";
import assert from "assert";
import ServerCommunicator from "./ServerCommunicator";
import { NoStandardStreamsError } from "../Errors";
import { nanoid } from "nanoid";
import PropertiesManager from "../PropertiesManager";
import path from "path";
import RCON from 'rcon-srcds';

interface Options {
  enableRCON?: boolean
  name?: string
  tag?: string
}

export default class GameServer extends ServerCommunicator {
  private command;
  readonly dir;
  private serverProcess: ChildProcessWithoutNullStreams | null = null;


  get name() {
    return this.options?.name;
  }
  get tag() {
    return this.options?.tag || this._tag as string;
  }

  private readonly _tag?: string;
  public readonly options;

  get pid(): number | undefined {
    return this.serverProcess?.pid;
  }

  rcon: GameServerRCON | undefined;

  /**
   * 
   * @param command 
   * @param directory The directory in which the command is run
   */
  constructor(command: string, directory: string, options?: Options) {
    super(null, null, null);

    if (options) {
      if (options.enableRCON === undefined) options.enableRCON = true;
      this.options = options;
    }else {
      this._tag = GameServer.generateTag();
    }

    this.command = command;
    this.dir = directory;

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

    this.on("rconReady", async e => {
      if (await this.rcon!.establishConnection()) {
        console.log(`RCON successfully connected on server ${this.tag}`);
      } else {
        console.log(`RCON connection failed on server ${this.tag}`);
      }
    });
  }

  /**
   * Sends a command to the game through RCON if available. Defaults to sending through stdin.
   * @param gameCommand {A string containing a gameCommand with or without a slash}
   */
  sendGameCommand(gameCommand: string) {
    if (!this.hasStreams) return;

    if (gameCommand.startsWith("/")) gameCommand = gameCommand.substring(1);

    if (this.rcon?.isConnected) {
      this.rcon.sendGameCommand(gameCommand);
    }else {
      this.std.emit("in", gameCommand + "\n");
    }
  }

  static generateTag() {
    return nanoid(9);
  }
  

  reload() {
    assert(this.serverProcess);

    this._stdin = this.serverProcess.stdin;
    this._stdout = this.serverProcess.stdout;
    this._stderr = this.serverProcess.stderr;

    super.reload();

    // Add listeners for handling server closing
    this.serverProcess.on("close", (code) => this.resetState());
  }
  protected resetState() {
    super.resetState();
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
    return new Promise((res, rej) => {
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
    return new Promise((res, rej) => {
      assert(this.serverProcess, new NoStandardStreamsError());
      this.serverProcess.once("close", (code) => {
        this.serverProcess = null;
        res(code);
      });
      this.serverProcess.kill(signal || "SIGQUIT"); 
    });
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

  /**
   * 
   * @param gameCommand {A string containing a gameCommand with or without a slash}
   */
  sendGameCommand(gameCommand: string) {
    if (gameCommand.startsWith("/")) gameCommand = gameCommand.substring(1);

    if (this.hasStreams) {
      this.std.emit("in", gameCommand + "\n");
    }
  }
}

class GameServerRCON {
  gameServer: GameServer;
  private host: string;
  private port: number;
  private password: string;

  
  get isConnected(): boolean {
    return this.rawRcon?.isAuthenticated() || false;
  }
  

  protected rawRcon: RCON | undefined;

  constructor(gameServer: GameServer, host: string, port: number, password: string) {
    this.gameServer = gameServer;
    this.host = host;
    this.port = port;
    this.password = password;
  }

  async establishConnection(): Promise<boolean> {
    assert(!this.isConnected, "establishConnection got called when RCON is already connected!");

    this.rawRcon = new RCON({ host: this.host, port: this.port });

    try {
      await this.rawRcon.authenticate(this.password);
      return true;
    } catch (err) {
      return false;
    }
  }

  async sendGameCommand(gameCommand: string) {
    assert(this.isConnected, "RCON is not connected!");

    return await this.rawRcon!.execute(gameCommand);
  }
}