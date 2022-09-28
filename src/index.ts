import Masa from "./classes/Masa";
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
    Masa.getServers().forEach(gameServer => {
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