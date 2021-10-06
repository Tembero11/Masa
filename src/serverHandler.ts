import { spawn, ChildProcessWithoutNullStreams } from "child_process";
import path from "path";
import { client, config } from "../index";
import { serverDir, setPresence } from "./helpers";
import axios from "axios";
import {ConsoleReader, Player, Event} from "./classes/ConsoleAPI";
import { read } from "fs";
import ServerCommunicator from "./classes/ServerCommunicator";

export let commandProcess: ChildProcessWithoutNullStreams | undefined;


export enum ServerStatus {
  SERVER_CRASHED = "Server crashed!",
  SERVER_STARTED = "Server started succesfully!",
  SERVER_STOPPED = "Server stopped!",
  SERVER_ALREADY_OFFLINE = "Server is already offline!"
}

export enum Presence {
  SERVER_ONLINE = "Server is joinable!",
  SERVER_STARTING = "Server is starting...",
  SERVER_STOPPING = "Server is stopping...",
  SERVER_OFFLINE = "Server is offline."
}

class ServerResult {
  status: ServerStatus;
  constructor(status: ServerStatus) {
    this.status = status;
  }
}



// new Player("Tembero").uuid.then(uuid => console.log(uuid)).catch((err) => console.error("Error"));

/**
 * Is true if the server is joinable
 */
export let isServerJoinable = false;
// Contains all the currently online players
export let players = new Map<string, Player>();
export let serverStatus: Presence = Presence.SERVER_OFFLINE;

export const start = () => {
  return new Promise<ServerResult>((res, rej) => {
    if (!commandProcess) {

      commandProcess = spawn(config["command"], { shell: true, cwd: serverDir });

      let server = new ServerCommunicator(commandProcess);
      server.events.saveGame().then(when => console.log(when));

      serverStatus = Presence.SERVER_STARTING;
      setPresence(serverStatus);


      commandProcess.stdout.on("data", (d: any) => {
        let data: string = d.toString();

        let reader = new ConsoleReader(data);

        // Check for the done message
        if (!isServerJoinable) {
          let result = reader.isDoneMessage;
          if (result) {
            isServerJoinable = true;

            serverStatus = Presence.SERVER_ONLINE;
            setPresence(serverStatus);

            res(new ServerResult(ServerStatus.SERVER_STARTED));
          }
        } else {
          // check if the message was someone joining
          if (reader.isJoinEvent) {
            // Add a player to the players list if they joined
            let player = reader.player as Player;
            players.set(player.username, player);

            // Update the presence
            setPresence(serverStatus);
          }else if(reader.isLeaveEvent) {
            // Check if the message was someone leaving
            if (reader.isLeaveEvent) {
  
              // Remove a player from the players list if they left
              let player = reader.player as Player;
              players.delete(player.username);
  
              // Update the presence
              setPresence(serverStatus);
            }
          }
        }

        

        process.stdout.write(`[${commandProcess?.pid || ""}]${data}`);
      });

      commandProcess.on("error", (err) => {
        console.error(err);
        rej(new ServerResult(ServerStatus.SERVER_CRASHED));
      });

      commandProcess.on("close", (code) => {
        commandProcess = undefined;

        serverStatus = Presence.SERVER_OFFLINE;
        setPresence(serverStatus);

        if (code != 0) {
          rej(new ServerResult(ServerStatus.SERVER_CRASHED));
        }

        isServerJoinable = false;

        players.clear();



        console.log(`Server closed with code ${code}`);
      });
    }
  })
}

export const stop = async (): Promise<ServerResult> => {
  return new Promise<ServerResult>((res, rej) => {
    if (commandProcess) {
      serverStatus = Presence.SERVER_STOPPING;
      setPresence(serverStatus);

      commandProcess.on("close", () => {
        res(new ServerResult(ServerStatus.SERVER_STOPPED));
      });

      commandProcess.stdin.write("stop\n");
    } else {
      res(new ServerResult(ServerStatus.SERVER_ALREADY_OFFLINE));
    }
  });
}

export const restart = async (): Promise<ServerResult> => {
  if (commandProcess) {
    await stop();
    return await start();
  } else {
    return await start();
  }
}

export const getSeed = () => {
  return new Promise<number[]>((res, rej) => {
    if (commandProcess && isServerJoinable) {
      const listener = (d: any) => {
        let reader = new ConsoleReader(d.toString());
  
        if (reader.isInfo) {
          let isSeed = reader.message.search(/Seed: \[[a-zA-Z0-9\-]{1,}\]/) > -1;
  
          if (isSeed) {
            let seeds = reader.message.substring("Seed:".length).replaceAll(/\[|\]/g, "").split(",").map((seed) => parseInt(seed));
  
            commandProcess?.removeListener("data", listener);

            res(seeds);
          }
        }
      }
  
      commandProcess.stdout.on("data", listener);
  
      commandProcess.stdin.write("seed\n");
    }else {
      rej("Server is offline!");
    }
  });
}