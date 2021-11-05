import Discord, { Intents, MessageEmbed } from "discord.js";
import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v9";
import { setPresence } from "./helpers";
import { Presence, start, stop, restart, servers } from "./serverHandler";
import setup, { config } from "./setup";
import commands from "./commands/commands";


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
  }
});

// For messages
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;

  // TODO: permissions

  let command = commands.get(interaction.commandName);
  if (command) {
    command.handler(interaction);
  }
});
// For buttons
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isButton()) return;

  let id = interaction.customId;

  let action = id.split(":")[0];
  let serverName = id.split(":")[1];

  let embed = new MessageEmbed();

  if (action && serverName) {
    let server = servers.get(serverName);
    if (server) {
      switch (action) {
        case "server_start":
          await interaction.deferReply({ephemeral: true});
          await start(serverName);
          embed.setDescription(`**${serverName}** started succesfully!`);
          await interaction.editReply({embeds: [embed]});
          break;
        case "server_stop":
          await interaction.deferReply({ephemeral: true});
          await stop(serverName);
          embed.setDescription(`**${serverName}** stopped succesfully!`);
          await interaction.editReply({embeds: [embed]});
          break;
        case "server_restart":
          await interaction.deferReply({ephemeral: true});
          await restart(serverName);
          embed.setDescription(`**${serverName}** restarted succesfully!`);
          await interaction.editReply({embeds: [embed]});
          break;
        default:
          break;
      }
    }
  }
});