import Discord, { Intents, MessageEmbed } from "discord.js";
import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v9";
import { getDefaultCommandEmbed } from "./helpers";
import { config } from "./setup";
import commands from "./commands/commands";
import Lang from "./classes/Lang";
import buttons from "./buttons/buttons";
import { PermissionManager } from "./classes/PermissionManager";

let manager: PermissionManager | undefined;

export const client = new Discord.Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });

client.once("ready", () => {
  if (client.user) {
    console.log(`Logged in as ${client.user.tag}!`);

    const token: string = config["token"];
    const clientId: string = config["clientID"];
    const guildId: string = config["guildID"];


    const rest = new REST({ version: '9' }).setToken(token);


    (async () => {
      console.log('Started refreshing application (/) commands.');

      const permissionsDefined = config.permissions?.roles !== undefined;

      await rest.put(
        Routes.applicationGuildCommands(clientId, guildId),
        {
          body: Array.from(commands, ([k, cmd]) => {
            return cmd.builder.setDefaultPermission(!permissionsDefined).toJSON()
          })
        },
      );

      if (permissionsDefined) {
        manager = new PermissionManager(config.permissions!.roles);

        const commandIds = await manager.getDiscordCommands(rest, clientId, guildId);
        const perms = manager.genDiscordCommandPerms(commandIds);

        await client.guilds.cache.get(guildId)?.commands.permissions.set({ fullPermissions: perms });
      }

      console.log("Successfully reloaded application (/) commands.");
    })();
  }
});

// For commands
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;


  let command = commands.get(interaction.commandName);
  if (command) {
    try {
      await command.handler(interaction);
    }catch(err) {
      console.log(err);
      // Note: !interaction.replied seemed to crash even though it shouldn't
      try {
        let embed = getDefaultCommandEmbed(interaction.user.username, interaction.user.avatarURL());
        embed.setDescription(Lang.parse("common.unknownErr"));
        await interaction.reply({embeds: [embed]})
      }catch(err) {
        console.log(err);
      }
    }
  }
});
// For buttons
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isButton()) return;

  await interaction.deferReply({ ephemeral: true });

  let id = interaction.customId;

  try {
    const embed = new MessageEmbed();

    const firstColon = id.indexOf(":");
    let action = id.substring(0, firstColon);
    let params = JSON.parse(id.substring(firstColon + 1));
    
    if (interaction.member) {
      const globalButton = buttons.get(action);

      if (globalButton) {
        let roleIds: string[];

        if (Array.isArray(interaction.member.roles)) {
          roleIds = interaction.member.roles;
        }else {
          roleIds = interaction.member.roles.cache.map(role => role.id);
        }

        let hasPermission = false;
        if (manager) {
          for (const roleId of roleIds) {
            if (manager.hasPermission(roleId, globalButton.permissionScopes)) {
              hasPermission = true;
              break;
            }
          }
        }else {
          // If no permissions are set, let everyone use buttons
          hasPermission = true;
        }

        if (hasPermission) {
          return await globalButton.handler(params, interaction);
        }else {
          embed.setDescription(Lang.parse("common.noPermission"));
        }
      }else {
        embed.setDescription(Lang.parse("common.unknownAction"));
      }
    }
    await interaction.editReply({embeds: [embed]});
  } catch (err) {
    console.log(err);
    // Note: !interaction.replied seemed to crash even though it shouldn't
    try {
      let embed = new MessageEmbed();
      embed.setDescription(Lang.parse("common.unknownErr"));
      await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      console.log(err);
    }
  }

  
  

  // let embed = new MessageEmbed();

  // if (action && serverName) {
  //   let server = ServerHandler.getServerByName(serverName);
  //   if (server) {
  //     try {
  //       switch (action) {
  //         case "server_start":
  //           await interaction.deferReply({ephemeral: true});
  //           await ServerHandler.start(serverName);
  //           embed.setDescription(Lang.parse(Lang.langFile.commands.start.started, {SERVER_NAME: serverName}));
  //           await interaction.editReply({embeds: [embed]});
  //           break;
  //         case "server_stop":
  //           await interaction.deferReply({ephemeral: true});
  //           await ServerHandler.stop(serverName);
  //           embed.setDescription(Lang.parse(Lang.langFile.commands.stop.stopped, {SERVER_NAME: serverName}));
  //           await interaction.editReply({embeds: [embed]});
  //           break;
  //         case "server_restart":
  //           await interaction.deferReply({ephemeral: true});
  //           await ServerHandler.restart(serverName);
  //           embed.setDescription(Lang.parse(Lang.langFile.commands.restart.restarted, {SERVER_NAME: serverName}));
  //           await interaction.editReply({embeds: [embed]});
  //           break;
  //         default:
  //           break;
  //       }
  //     }catch(err) {
  //       if (!interaction.replied) {
  //         let embed = getDefaultCommandEmbed(interaction.user.username, interaction.user.avatarURL());
  //         embed.setDescription(Lang.parse(Lang.langFile.common.unknownErr));
  //         await interaction.reply({embeds: [embed]})
  //       }
  //     }
  //   }
  // }
});