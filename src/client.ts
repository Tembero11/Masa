import Discord, { GuildApplicationCommandPermissionData, GuildMember, GuildMemberRoleManager, Intents, MessageEmbed } from "discord.js";
import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v9";
import { getDefaultCommandEmbed, setPresence } from "./helpers";
import { Presence, ServerHandler } from "./serverHandler";
import setup, { config } from "./setup";
import commands from "./commands/commands";
import assert from "assert";
import util from "util";
import { ApplicationCommandPermissionTypes } from "discord.js/typings/enums";

let permissions: GuildApplicationCommandPermissionData[];

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

        const hasUserDefinedPermissions = config.permissions ? true : false;

        await rest.put(
          Routes.applicationGuildCommands(clientId, guildId),
          { 
            body: Array.from(commands, ([k, cmd]) => {
              let defaultPermission = false;
              if (hasUserDefinedPermissions) {
                const cmdPerm = config.permissions!.commands[cmd.name];
                if (cmdPerm) {
                  defaultPermission = (Array.isArray(cmdPerm) ? cmdPerm : [cmdPerm])[0] == "@everyone";
                }
              }
              return cmd.builder.setDefaultPermission(defaultPermission).toJSON()
            })
          },
        );
        if (hasUserDefinedPermissions) {
          permissions = await calculatePermissions(rest, clientId, guildId);
          await client.guilds.cache.get(guildId)?.commands.permissions.set({ fullPermissions: permissions as any });
        }

        

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

  // TODO: add permissions for buttons

  

  let embed = new MessageEmbed();

  if (action && serverName) {
    let server = ServerHandler.getServerByName(serverName);
    if (server) {
      try {
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
      }catch(err) {
        console.log(err);
      }
    }
  }
});

const EVERYONE_PERMISSION_NAME = "@everyone";
const NOBODY_PERMISSION_NAME = "@nobody";

const calculatePermissions = async(rest: REST, clientId: string, guildId: string): Promise<Discord.GuildApplicationCommandPermissionData[]> => {
  const commandList = await rest.get(Routes.applicationGuildCommands(clientId, guildId)) as {
    id: string,
    application_id: string,
    version: string,
    default_permission?: boolean,
    default_member_permissions?: boolean,
    type?: number,
    name: string,
    description: string,
    guild_id?: string,
    options: any[]
  }[];

  const roles = new Map(Object.entries(config.permissions!.roles));
  const commandPermissions = new Map(Object.entries(config.permissions!.commands));

  const rolesByLevels = [...roles.values()].sort((a, b) => {
    if (a.level > b.level) {
      return 1;
    }
    return -1;
  });

  const fullPermissions: GuildApplicationCommandPermissionData[] = [];

  for (const cmd of commandList) {
    let perms = commandPermissions.get(cmd.name) || [NOBODY_PERMISSION_NAME];
    if (!Array.isArray(perms)) perms = [perms];

    if (perms.includes(NOBODY_PERMISSION_NAME) || perms.includes(EVERYONE_PERMISSION_NAME)) {
      continue;
    }

    const permObjects = [];
    for (const roleName of perms) {
      const role = roles.get(roleName);
      assert(role, `${roleName} is not defined in "roles"!`);
      assert(Number.isInteger(role.level), "Role level is not an integer!");

      const levelIndex = rolesByLevels.findIndex(e => e.level == role.level);

      permObjects.push(...rolesByLevels.slice(levelIndex).map(e => {
        return {
          id: e.id,
          type: ApplicationCommandPermissionTypes.ROLE,
          permission: true,
        }
      }));
    }

    fullPermissions.push({
      id: cmd.id,
      permissions: permObjects
    });
  }

  return fullPermissions;
}