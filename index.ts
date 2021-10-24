import Discord, { CommandInteraction, Intents } from "discord.js";
import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v9";
import fs from "fs";
import path from "path";
import { isAllowedChannel, setPresence } from "./src/helpers";
import { Presence } from "./src/serverHandler";
import setup from "./src/setup";
import { CONFIG_TYPE, createConfig, DefaultConfig, loadConfig } from "./src/config";
import commands from "./src/commands/commands";

export let config: DefaultConfig;

export const client = new Discord.Client({ intents: [Intents.FLAGS.GUILDS] });

client.once("ready", () => {
  if (client.user) {
    console.log(`Logged in as ${client.user.tag}!`);

    const token: string = config["token"];
    const clientId: string = config["clientID"];
    const guildId: string = config["guildID"];



    const rest = new REST({ version: '9' }).setToken(token);

    (async () => {
      try {
        console.log('Started refreshing application (/) commands.');

        await rest.put(
          Routes.applicationGuildCommands(clientId, guildId),
          { body: Array.from(commands, ([key, value]) => value.builder.toJSON()) },
        );
        console.log('Successfully reloaded application (/) commands.');
      } catch (error) {
        console.error(error);
      }
    })();



    setPresence(Presence.SERVER_OFFLINE);

    setup().then((success) => {
      if (success) {
        console.log("Successfully started!");
      }
    }).catch(err => console.warn(err));
  }
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;

  // TODO: permissions

  let command = commands.get(interaction.commandName);
  if (command) {
    command.handler(interaction);
  }
});

try {
  createConfig().then((created) => {
    if (created) {
      console.log("Please edit the config/config.yml file in the bot directory.");
      process.exit();
    } else {
      config = loadConfig("General");


      console.log("Config was successfully loaded!");

      client.login(config["token"]);
    }
  });
} catch (err) {
  throw err;
}


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