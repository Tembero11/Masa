import { spawn, ChildProcessWithoutNullStreams } from "child_process";
import { config } from "./index";

let commandProcess: ChildProcessWithoutNullStreams | undefined;


let stdoutLastLine: string | undefined;


export const start = () => {
  if (!commandProcess) {
    commandProcess = spawn(config["command"], {shell: true});


    commandProcess.stdout.on("data", (data) => {
      stdoutLastLine = data.toString();
      console.log(`[${commandProcess?.pid || ""}]${stdoutLastLine}`);
    });

    commandProcess.stdout.on("close", () => {
      stdoutLastLine = undefined;
      commandProcess = undefined;
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
  stop();
  start();
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