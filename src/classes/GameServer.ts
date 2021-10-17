import { ChildProcess, ChildProcessWithoutNullStreams, spawn } from "child_process";
import stream, { Readable, Writable } from "stream";
import assert from "assert";
import GameServerArgumentBuilder from "./GameServerArgumentBuilder";
import ServerCommunicator from "./ServerCommunicator";

export default class GameServer extends ServerCommunicator {
  private command;
  private dir;
  private serverProcess: ChildProcessWithoutNullStreams | null;

  /**
   * 
   * @param command 
   * @param directory The directory in which the command is run
   */
  constructor(command: GameServerArgumentBuilder, directory: string) {
    let stdin = new Writable({
      write: (chunk) => {
        if (!this.serverProcess) return;
        this.serverProcess.stdin.write(chunk);
      }
    });
    let stdout = new Readable({
      read: (size) => {

      }
    });
    let stderr = new Readable({
      read: (size) => {

      }
    });
     
    super(stdin, stdout, stderr);

    

    this.command = command;
    this.dir = directory;

    this.serverProcess = GameServer.spawn(command, directory);
    this.reloadServer();
  }

  /**
   * Should be called every time a new server is started in this instance
   */
  private reloadServer() {
    assert(this.serverProcess != null);

    this.serverProcess.stdout.on("data", chunk => this.stdout.push(chunk));
    this.serverProcess.stderr.on("data", chunk => this.stderr.push(chunk));
  }

  static spawn(command: GameServerArgumentBuilder, dir: string) {
    return spawn(command.toString(), { shell: true, cwd: dir })
  }

  stop(): Promise<number | null> {
    return new Promise((res, rej) => {
      if (this.serverProcess) {
        this.serverProcess.once("close", (code) => {
          res(code);
        });
        this.stdin.write("stop\n");
      }else {
        res(null);
      }
    });
  }

  forceStop(signal?: NodeJS.Signals): Promise<number | null> {
    return new Promise((res, rej) => {
      if (this.serverProcess) {
        this.serverProcess.once("close", (code) => {
          res(code);
        });
        this.serverProcess.kill(signal || "SIGQUIT"); 
      }else {
        rej("No server to stop!");
      }
    });
  }

  start() {
    if (!this.serverProcess) {
      this.serverProcess = GameServer.spawn(this.command, this.dir);
      this.reloadServer();
    }
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