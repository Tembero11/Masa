import { spawn, ChildProcessWithoutNullStreams } from "child_process";
import { config } from "./index";

let commandProcess: ChildProcessWithoutNullStreams | undefined;


let stdoutLastLine: string | undefined;

let restartMode = false;


export const start = () => {
  if (!commandProcess) {
    commandProcess = spawn(config["command"], {shell: true});


    commandProcess.stdout.on("data", (data) => {
      stdoutLastLine = data.toString();
      console.log(`[${commandProcess?.pid || ""}]${stdoutLastLine}`);
    });

    commandProcess.on("close", () => {
      stdoutLastLine = undefined;
      commandProcess = undefined;

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

export const getSeed = (): string => {
  if (commandProcess) {
    commandProcess.stdin.write("seed\n");
    if (stdoutLastLine) {
      return stdoutLastLine;
    }
  }

  return "";
}