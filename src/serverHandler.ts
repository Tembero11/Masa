import { setServerStatus } from "./helpers";
import {GameServer} from "./classes/MasaAPI";
import { ServerMetadata } from "./config";
import assert from "assert";
import { BackupType, createBackup } from "./backup";
import chalk from "chalk";
import ms from "ms";

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
    assert(!servers.get(meta.name), "One or more servers have the same name!");

    let server = new GameServer(meta.command, meta.directory);

    setServerStatus(meta.name, server, Presence.SERVER_OFFLINE, true);

    server.on("join", (e) => {
      if (meta.advanced?.welcomeMsg) {
        let msg = meta.advanced.welcomeMsg;
        msg = msg.replaceAll("{PLAYER}", e.player.username);
        msg = msg.replaceAll("{ONLINE}", e.player.server.playerCount.toString());
        e.player.sendMessage(msg);
      }
      setServerStatus(meta.name, server, Presence.SERVER_ONLINE, true);
    });
    server.on("quit", (e) => {
      setServerStatus(meta.name, server, Presence.SERVER_ONLINE, true);
    });

    server.on("ready", () => {
      server.events.disableAutosave();
      setServerStatus(meta.name, server, Presence.SERVER_ONLINE, true);
    });

    if (meta.logs) {
      console.log(`Logs are enabled on "${chalk.underline(meta.name)}"`)
      server.std.on("out", (reader) => {
        process.stdout.write(reader.data);
      });
    }

    server.on("close", e => setServerStatus(meta.name, server, Presence.SERVER_OFFLINE, true));


    // Setup backups
    if (meta.backups) {
      const { backupInterval } = meta.backups;
      const { backupLimit } = meta.backups;

      let backupIntervalMs = typeof backupInterval == "string" ? ms(backupInterval) : backupInterval;

      assert(backupInterval && backupLimit);

      console.log(`Automatic backups are made every ${ms(backupIntervalMs, {long: true})} for server "${chalk.underline(meta.name)}".`);

      setInterval(() => {
        createBackup(server, meta.name, BackupType.Automatic, { backupLimit }).then((backup) => {
          console.log(`An automatic backup was succesfully created! ${backup.filename || ""}`);
        }).catch((err) => {
          console.warn(chalk.yellow(err));
        });
      }, backupIntervalMs);
    }else {
      console.warn(chalk.yellow(`Automatic backups are ${chalk.bold("disabled")} for server "${chalk.underline(meta.name)}".`))
    }


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