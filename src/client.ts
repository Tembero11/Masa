import Discord, { Intents, MessageEmbed } from "discord.js";
import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v9";
import { getDefaultCommandEmbed, setPresence } from "./helpers";
import { Presence, ServerHandler } from "./serverHandler";
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

// For commands
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;

  // TODO: permissions

  let command = commands.get(interaction.commandName);
  if (command) {
    try {
      await command.handler(interaction);
    }catch(err) {
      if (!interaction.replied) {
        let embed = getDefaultCommandEmbed(interaction.user.username, interaction.user.avatarURL());
        embed.setDescription("Something went wrong :slight_frown:");
        await interaction.reply({embeds: [embed]})
      }
    }
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
    let server = ServerHandler.getServerByName(serverName);
    if (server) {
      switch (action) {
        case "server_start":
          await interaction.deferReply({ephemeral: true});
          await ServerHandler.start(serverName);
          embed.setDescription(`**${serverName}** started succesfully!`);
          await interaction.editReply({embeds: [embed]});
          break;
        case "server_stop":
          await interaction.deferReply({ephemeral: true});
          await ServerHandler.stop(serverName);
          embed.setDescription(`**${serverName}** stopped succesfully!`);
          await interaction.editReply({embeds: [embed]});
          break;
        case "server_restart":
          await interaction.deferReply({ephemeral: true});
          await ServerHandler.restart(serverName);
          embed.setDescription(`**${serverName}** restarted succesfully!`);
          await interaction.editReply({embeds: [embed]});
          break;
        default:
          break;
      }
    }
  }
});