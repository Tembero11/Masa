import { spawn, ChildProcessWithoutNullStreams } from "child_process";
import path from "path";
import { client, config } from "../index";
import { Presence, serverDir, setPresence } from "./helpers";

let commandProcess: ChildProcessWithoutNullStreams | undefined;

let restartMode = false;

export enum ServerStatus {
  SERVER_CRASHED = "Server crashed!",
  SERVER_STARTED = "Server started succesfully!",
  SERVER_STOPPED = "Server stopped!"
}

class ServerResult {
  status: ServerStatus;
  constructor(status: ServerStatus) {
    this.status = status;
  }
}

/**
 * Is true if the server is joinable
 */
let isServerJoinable = false;
export let serverStatus: Presence = Presence.SERVER_OFFLINE;

export const start = () => {
  return new Promise<ServerResult>((res, rej) => {
    if (!commandProcess) {

      commandProcess = spawn(config["command"], { shell: true, cwd: serverDir });

      serverStatus = Presence.SERVER_STARTING;
      setPresence(serverStatus);


      commandProcess.stdout.on("data", (d: any) => {
        let data: string = d.toString();

        // Check for the done message
        if (!isServerJoinable) {
          let result = data.search(/Done \(.{1,}\)\!/) > -1;
          if (result) {
            isServerJoinable = true;

            serverStatus = Presence.SERVER_ONLINE;
            setPresence(serverStatus);

            res(new ServerResult(ServerStatus.SERVER_STARTED));
          }
        }

        console.log(`[${commandProcess?.pid || ""}]${data}`);
      });

      commandProcess.on("error", (err) => {
        rej(new ServerResult(ServerStatus.SERVER_CRASHED));
      });

      commandProcess.on("close", (code) => {
        commandProcess = undefined;

        serverStatus = Presence.SERVER_OFFLINE;
        setPresence(serverStatus);

        if (restartMode) {
          start();
          restartMode = false;
        }

        if (isServerJoinable) {
          rej(new ServerResult(ServerStatus.SERVER_CRASHED));
        }

        isServerJoinable = false;



        console.log(`Server closed with code ${code}`);
      });
    }
  })
}

export const stop = () => {
  if (commandProcess) {
    serverStatus = Presence.SERVER_STOPPING;
    setPresence(serverStatus);

    commandProcess.stdin.write("stop\n");
  }
}

export const restart = () => {
  if (commandProcess) {
    restartMode = true;
    stop();
  } else {
    start()
  }
}

