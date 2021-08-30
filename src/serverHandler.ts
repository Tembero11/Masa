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

export const start = () => {
  if (!commandProcess) {

    commandProcess = spawn(config["command"], {shell: true, cwd: path.join(process.cwd(), "server")});

    
    setPresence(Presence.SERVER_STARTING);

    
    commandProcess.stdout.on("data", (d) => {
      let data: string = d.toString();

      // Check for the done message
      if (!isServerJoinable) {
        let result = data.search(/Done \(.{1,}\)\!/) > -1;
        if (result) {
          isServerJoinable = true;

          setPresence(Presence.SERVER_ONLINE);
        }
      }

      console.log(`[${commandProcess?.pid || ""}]${data}`);
    });

    commandProcess.on("close", () => {
      commandProcess = undefined;

      isServerJoinable = false;

      setPresence(Presence.SERVER_OFFLINE);

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
    setPresence(Presence.SERVER_STOPPING);

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

