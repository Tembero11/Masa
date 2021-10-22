import { ChildProcess, ChildProcessWithoutNullStreams, spawn } from "child_process";
import stream, { Readable, Writable } from "stream";
import assert from "assert";
import GameServerArgumentBuilder from "./GameServerArgumentBuilder";
import ServerCommunicator from "./ServerCommunicator";
import { NoStandardStreamsError } from "./Errors";

export default class GameServer extends ServerCommunicator {
  private command;
  private dir;
  private serverProcess: ChildProcessWithoutNullStreams | null = null;

  get pid(): number | undefined {
    return this.serverProcess?.pid;
  }

  /**
   * 
   * @param command 
   * @param directory The directory in which the command is run
   */
  constructor(command: GameServerArgumentBuilder, directory: string) {
    super(null, null, null);


    this.command = command;
    this.dir = directory;
  }

  reload() {
    assert(this.serverProcess);

    this._stdin = this.serverProcess.stdin;
    this._stdout = this.serverProcess.stdout;
    this._stderr = this.serverProcess.stderr;

    super.reload();

    // Add listeners for handling server closing
    this.serverProcess.on("close", (code) => {
      this._isServerJoinable = false;
    });
  }

  static spawn(command: GameServerArgumentBuilder, dir: string) {
    return spawn(command.toString(), { shell: true, cwd: dir })
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