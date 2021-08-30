import { spawn, ChildProcessWithoutNullStreams } from "child_process";
import path from "path";
import { client, config } from "../index";
import { Presence, setPresence } from "./helpers";

let commandProcess: ChildProcessWithoutNullStreams | undefined;

let restartMode = false;

/**
 * Is true if the server is joinable
 */
let isServerJoinable = false;
export let serverStatus: Presence = Presence.SERVER_OFFLINE;

export const start = () => {
  if (!commandProcess) {

    commandProcess = spawn(config["command"], {shell: true, cwd: path.join(process.cwd(), "server")});

    serverStatus = Presence.SERVER_STARTING;
    setPresence(serverStatus);

    
    commandProcess.stdout.on("data", (d) => {
      let data: string = d.toString();

      // Check for the done message
      if (!isServerJoinable) {
        let result = data.search(/Done \(.{1,}\)\!/) > -1;
        if (result) {
          isServerJoinable = true;

          serverStatus = Presence.SERVER_ONLINE;
          setPresence(serverStatus);
        }
      }

      console.log(`[${commandProcess?.pid || ""}]${data}`);
    });

    commandProcess.on("close", () => {
      commandProcess = undefined;

      isServerJoinable = false;

      serverStatus = Presence.SERVER_OFFLINE;
      setPresence(serverStatus);

      if (restartMode) {
        start();
        restartMode = false;
      }

      

      console.log("Process stopped!");
    });
  }
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
  }else {
    start()
  }
}

