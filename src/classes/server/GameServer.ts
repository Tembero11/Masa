import { ChildProcessWithoutNullStreams, spawn } from "child_process";
import assert from "assert";
import ServerCommunicator from "./ServerCommunicator";
import { NoStandardStreamsError } from "../Errors";
import { ServerMetadata } from "../../config";
import { nanoid } from "nanoid";
import PropertiesManager from "../PropertiesManager";
import path from "path";
import RCON from 'rcon-srcds';

export default class GameServer extends ServerCommunicator {
  private command;
  readonly dir;
  private serverProcess: ChildProcessWithoutNullStreams | null = null;


  get name() {
    return this.metadata?.name;
  }
  get tag() {
    return this.metadata?.tag || this._tag as string;
  }

  private readonly _tag?: string;
  public readonly metadata;

  get pid(): number | undefined {
    return this.serverProcess?.pid;
  }

  /**
   * 
   * @param command 
   * @param directory The directory in which the command is run
   */
  constructor(command: string, directory: string, metadata?: ServerMetadata) {
    super(null, null, null);

    if (metadata) {
      this.metadata = metadata;
    }else {
      this._tag = GameServer.generateId();
    }

    this.command = command;
    this.dir = directory;

    const properties = new PropertiesManager(path.join(this.dir, "server.properties"));

    if (this.metadata?.shouldTriggerRCONReset) {
      properties.set("enable-rcon", "true");
      properties.set("rcon.password", nanoid(25));
      properties.set("rcon.port", "25565");
      properties.set("broadcast-rcon-to-ops", "false");
      properties.writeSync();
    }
    if (properties.get("enable-rcon") == "true") {
      const password = properties.get("rcon.password") || "";

      const rcon = new RCON({ host: "127.0.0.1", port: parseInt(properties.get("rcon.port") || "") });
      this.on("rconReady", async e => {
        try {
          await rcon.authenticate(password);
        }catch(err) {
          console.error(err);
          console.log("RCON connection failed.");
        }
      });
    }
  }

  static generateId() {
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
}

// class GameServerChildProcess {
//   stdout: Writable;
//   constructor(stdin: stream.Writable, stdout: stream.Readable, stderr: stream.Readable) {
//     this.stdout = new Writable();
//     this.stdout._write = () => {
//       if (!serverProcess) return "";
//       return serverProcess.stdout.read(size);
//     }
//   }
// }