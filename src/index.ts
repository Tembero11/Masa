import { ServerHandler } from "./serverHandler";
import setup from "./setup";
export { config } from "./setup";
export { client } from "./client";

setup().then((success) => {
  if (success) {
    console.log("Successfully started!");
  }
}).catch(err => console.warn(err));

process.on("uncaughtException", (err) => {
  try {
    // Stop all game servers safely
    ServerHandler.servers.forEach(gameServer => {
      if (gameServer.hasStreams) {
          gameServer.stop();
      }
    });
  } catch (err) {
    console.log(err);
  }
  console.log(err);
  process.exit()
});