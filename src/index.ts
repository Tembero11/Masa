import setup from "./setup";
export { config } from "./setup";
export { client } from "./client";

setup().then((success) => {
  if (success) {
    console.log("Successfully started!");
  }
}).catch(err => console.warn(err));

// process.on("uncaughtException", (err) => {
//   const logs = path.join(__dirname, "logs");

//   if (!fs.existsSync(logs)) {
//     fs.mkdirSync(logs);
//   }

//   let date = new Date();
//   let logName = `${date.getDate()}.${date.getMonth() + 1}-${date.getHours()}.${date.getMinutes()}.log`;

//   const errorMessage = `${err.name}:\n${err.message}\n${err.stack}`;

//   fs.writeFileSync(path.join(logs, logName), errorMessage);

//   throw err;
// });