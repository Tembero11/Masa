import { spawn, ChildProcessWithoutNullStreams } from "child_process";
import { config } from "../index";
import { serverDir, setPresence, setServerStatus } from "./helpers";
import {ConsoleReader, Player, Event} from "./classes/MasaAPI";
import ServerCommunicator from "./classes/ServerCommunicator";
import GameServer from "./classes/GameServer";
import GameServerArgumentBuilder from "./classes/GameServerArgumentBuilder";
import { ServerMetadata } from "./config";
import assert from "assert";

// export let commandProcess: ChildProcessWithoutNullStreams | undefined;


// Remove this!
export let isServerJoinable = false;


// export enum ServerStatus {
//   SERVER_CRASHED = "Server crashed!",
//   SERVER_STARTED = "Server started succesfully!",
//   SERVER_STOPPED = "Server stopped!",
//   SERVER_ALREADY_OFFLINE = "Server is already offline!"
// }

export enum Presence {
  SERVER_ONLINE = "Server is joinable!",
  SERVER_STARTING = "Server is starting...",
  SERVER_STOPPING = "Server is stopping...",
  SERVER_OFFLINE = "Server is offline."
}

// export let servers: GameServer[] = [];

export let servers = new Map<string, GameServer>();

export const serverInitializer = (serverMeta: ServerMetadata[]) => {
  serverMeta.forEach((meta) => {
    let server = new GameServer(meta.command, meta.directory);

    setServerStatus(meta.name, server, Presence.SERVER_OFFLINE, true);

    server.on("join", (e) => {
      setServerStatus(meta.name, server, Presence.SERVER_ONLINE, true);
    });
    server.on("quit", (e) => {
      setServerStatus(meta.name, server, Presence.SERVER_ONLINE, true);
    });

    server.on("ready", () => {
      setServerStatus(meta.name, server, Presence.SERVER_ONLINE, true);
    });

    server.std.on("out", (reader) => {
      process.stdout.write(reader.data);
    });

    server.on("close", e => setServerStatus(meta.name, server, Presence.SERVER_OFFLINE, true));

    server.on("close", () => console.log("close was called!!"))


    servers.set(meta.name, server);
  });
}

export const start = async(serverName: string) => {
  let server = servers.get(serverName);
  assert(server);
  server.start();

  return await server.waitfor("ready");
}

export const stop = async(serverName: string) => {
  let server = servers.get(serverName);
  assert(server);
  return await server.stop();
}

export const restart = async(serverName: string) => {
  let server = servers.get(serverName);
  assert(server);

  if (server.hasStreams) {
    await server.stop();
  }
  await server.start();

  return await server.waitfor("ready");
}

// export const start = () => {
//   return new Promise<ServerStatus>((res, rej) => {
//     if (!commandProcess) {

//       commandProcess = spawn(config["command"], { shell: true, cwd: serverDir });

//       let command = new GameServerArgumentBuilder("server.jar", {
//         maxMem: "1024M",
//         minMem: "1024M",
//         noGUI: true
//       });
//       // GameServerArgumentBuilder.from("java -jar server.jar");
//       server = new GameServer(command, serverDir);
//       server.start();

//       serverStatus = Presence.SERVER_STARTING;
//       setPresence(serverStatus);

//       server.waitfor("done").then((e) => {
//         serverStatus = Presence.SERVER_ONLINE;

//         res(ServerStatus.SERVER_STARTED);
//       });

//       server.on("join", (e) => {
//         // Update the presence
//         setPresence(serverStatus);
//       });

//       server.on("leave", (e) => {
//         // Update the presence
//         setPresence(serverStatus);
//       });

//       server.std.on("out", (e) => {
//         let data = e.data;

//         // Add the line to the lastLine array
//         if (lastLines.length >= cachedConsoleLines) {
//           lastLines.shift();
//         }
        
//         lastLines.push(data);


//         // Forward the stdout to the console
//         process.stdout.write(`[${server?.pid || ""}]${data}`);
//       });

//       server.on("close", (code) => {
//         commandProcess = undefined;

//         serverStatus = Presence.SERVER_OFFLINE;
//         setPresence(serverStatus);

//         if (code != 0) {
//           rej(ServerStatus.SERVER_CRASHED);
//         }



//         console.log(`Server closed with code ${code}`);
//       });
//     }
//   })
// }

// export const stop = async (): Promise<ServerStatus> => {
//   if (server) {
//     await server.stop();
//     return ServerStatus.SERVER_STOPPED;
//   }else {
//     return ServerStatus.SERVER_ALREADY_OFFLINE;
//   }
//   return new Promise<ServerStatus>((res, rej) => {
//     if (commandProcess) {
//       serverStatus = Presence.SERVER_STOPPING;
//       setPresence(serverStatus);

//       commandProcess.on("close", () => {
//         res(ServerStatus.SERVER_STOPPED);
//       });

//       commandProcess.stdin.write("stop\n");
//     } else {
//       res(ServerStatus.SERVER_ALREADY_OFFLINE);
//     }
//   });
// }

// export const restart = async (): Promise<ServerStatus> => {
//   if (commandProcess) {
//     await stop();
//     return await start();
//   } else {
//     return await start();
//   }
// }

// export const getSeed = () => {
//   return new Promise<number[]>((res, rej) => {
//     if (commandProcess && server && server.isJoinable) {
//       const listener = (d: any) => {
//         let reader = new ConsoleReader(d.toString(), true);
  
//         if (reader.isInfo) {
//           let isSeed = reader.message.search(/Seed: \[[a-zA-Z0-9\-]{1,}\]/) > -1;
  
//           if (isSeed) {
//             let seeds = reader.message.substring("Seed:".length).replaceAll(/\[|\]/g, "").split(",").map((seed) => parseInt(seed));
  
//             commandProcess?.removeListener("data", listener);

//             res(seeds);
//           }
//         }
//       }
  
//       commandProcess.stdout.on("data", listener);
  
//       commandProcess.stdin.write("seed\n");
//     }else {
//       rej("Server is offline!");
//     }
//   });
// }