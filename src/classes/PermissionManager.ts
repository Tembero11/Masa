import { REST } from "@discordjs/rest";
import assert from "assert";
import { Routes } from "discord-api-types/v9";
import { GuildApplicationCommandPermissionData } from "discord.js";
import { commands } from "../commands/general";

export enum PermissionScope {
  HarmlessCommands,
  StartServer,
  StopServer,
  ViewServer,
  ManageBackups,
  ViewBackups,
  ExecuteGameCommands
}

export interface PermissionSettings {
  [key: string]: {
    level: number
    scopes: PermissionScope[]
    all?: boolean
  }
}
export interface RawPermissionSettings {
  [key: string]: {
    level: number
    scopes: (keyof typeof PermissionScope)[]
    all?: boolean
  }
}

interface DiscordApiCommand {
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
}

interface CalculatedPermission {
  roleId: string
  scopes: PermissionScope[]
  defaultPermission: boolean
}

export class PermissionManager {
  private _scopes?: CalculatedPermission[];

  get scopes() {
    return this.forceCalcScopes();
  }

  readonly permissions;


  constructor(permissions: PermissionSettings | RawPermissionSettings) {
    // Replace strings with `PermissionScope` enum values
    this.permissions = Object.fromEntries(Object.entries(permissions).map((kv) => {
      const id = kv[0];
      const { level, scopes, all } = kv[1] as PermissionSettings[string] | RawPermissionSettings[string];

      assert(Number.isSafeInteger(level) && level >= 0, "Level should be a safe integer that is greater than or equal to zero");

      return [id, {
        level,
        all,
        scopes: scopes.map(e => {
          if (typeof e == "string") {
            return PermissionScope[e as keyof typeof PermissionScope];
          }
          return e;
        })
      }];
    })) as PermissionSettings;
  }


  forceCalcScopes = () => {
    // Contains all scopes given by lower permission levels than the currently computed one inside the map loop
    const lowerScopes = new Set<PermissionScope>();

    // First sort the entries by the level lowest first
    this._scopes = Object.entries(this.permissions).sort((a, b) => {
      if (a[1].level > b[1].level) {
        return 1;
      }
      return -1;
    }).map(([roleId, { level, scopes, all }]) => {
      // If all is true this sets the role on all scopes to be permission: true
      if (!all) {
        scopes.forEach(v => lowerScopes.add(v));
      }else {
        lowerScopes.clear();

        for (const scope in PermissionScope) {
          if (isNaN(Number(scope))) {
            // Add all scopes to the lower scopes set
            lowerScopes.add(PermissionScope[scope as keyof typeof PermissionScope]);
          }
        }
      }

      return {
        roleId,
        scopes: Array.from(lowerScopes.values()),
      }
    }) as CalculatedPermission[];
    return this._scopes;
  }

  /**
   * Generate Discord api ready slash command permissions
   * @returns  {GuildApplicationCommandPermissionData[]}
   */
  genDiscordCommandPerms = (cmds: { name: string, id: string }[]) => {
    let commandPerms = cmds.map((cmd, index) => {
      const requiredScopes = commands.get(cmd.name)?.permissionScopes;
      assert(requiredScopes);

      let permissions = {
        name: cmd.name,
        id: cmd.id,
        permissions: this.scopes.map(({roleId, scopes}) => {
          if (requiredScopes.every((e) => scopes.indexOf(e) > -1)) {
            return {
              id: roleId,
              // 1 = Role & 2 = User
              type: 1,
              permission: true
            }
          }
          return undefined;
        }).filter(e => e)
      }

      return permissions;
    });

    return commandPerms as GuildApplicationCommandPermissionData[];
  }

  getDiscordCommands = async(rest: REST, clientId: string, guildId: string) => {
    return await rest.get(Routes.applicationGuildCommands(clientId, guildId)) as DiscordApiCommand[];
  }

  hasPermission(roleId: string, requiredScopes: PermissionScope[]) {
    const rolePerms = this.scopes.find(perms => roleId == perms.roleId);

    if (rolePerms) {
      return requiredScopes.every((e) => rolePerms.scopes.indexOf(e) > -1)
    }

    return false;
  }
}