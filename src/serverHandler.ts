import { spawn, ChildProcessWithoutNullStreams } from "child_process";
import path from "path";
import { client, config } from "../index";
import { serverDir, setPresence } from "./helpers";
import axios from "axios";

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

export class Player {
  readonly username: string;

  private _uuid: string | undefined;

  get uuid(): Promise<string> {
    return new Promise<string>((res, rej) => {
      if (!this._uuid) {
        axios.get(`https://api.mojang.com/users/profiles/minecraft/${this.username}`).then((response) => {
          if (typeof response.data["id"] == "string") {
            res(response.data["id"]);
          } else {
            rej("UUID was invalid.");
          }
        }).catch(reason => rej(reason));
      } else {
        res(this._uuid);
      }
    });
  }

  constructor(username: string, uuid?: string) {
    this.username = username;
    this._uuid = uuid;
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

      serverStatus = Presence.SERVER_STARTING;
      setPresence(serverStatus);


      commandProcess.stdout.on("data", (d: any) => {
        let data: string = d.toString();

        // Check for the done message
        if (!isServerJoinable) {
          let result = isDoneMessage(data);
          if (result) {
            isServerJoinable = true;

            serverStatus = Presence.SERVER_ONLINE;
            setPresence(serverStatus);

            res(new ServerResult(ServerStatus.SERVER_STARTED));
          }
        } else if (players.size > 0) {
          // Check if the message was someone leaving
          let player = readFromLeftMessage(data);
          console.log(player);
          if (player) {
            // Remove a player from the players list if they left
            players.delete(player.username);

            // Update the presence
            setPresence(serverStatus);
          }
        } else {
          // check if the message was someone joining
          let player = readFromJoinMessage(data);
          console.log(player);
          if (player) {
            // Add a player to the players list if they joined
            players.set(player.username, player);

            // Update the presence
            setPresence(serverStatus);
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


const readFromLeftMessage = (msg: string): Player | undefined => {
  let matches = msg.match(/\[Server thread\/INFO\]: ([a-zA-Z0-9]|_){3,16} left/);
  if (matches && matches[0]) {
    let match = matches[0];
    let usernameMatches = match.match(/\]: ([a-zA-Z0-9]|_){3,16}/);

    if (usernameMatches && usernameMatches[0]) {
      let username = usernameMatches[0].substr(3, usernameMatches[0].length - 3);

      return new Player(username);
    }
  }

  return undefined;
}
const readFromJoinMessage = (msg: string): Player | undefined => {
  let matches = msg.match(/\[Server thread\/INFO\]: ([a-zA-Z0-9]|_){3,16}\[.{1,}\] logged/);
  if (matches && matches[0]) {
    let match = matches[0];
    let usernameMatches = match.match(/\]: ([a-zA-Z0-9]|_){3,16}\[/);

    if (usernameMatches && usernameMatches[0]) {
      let username = usernameMatches[0].substr(3, usernameMatches[0].length - 4);

      return new Player(username);
    }

  }

  return undefined;
}

const isDoneMessage = (msg: string) => msg.search(/Done \(.{1,}\)\!/) > -1;