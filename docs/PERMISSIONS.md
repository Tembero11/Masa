## Permissions

Setting up permissions is very easy. Permissions are configured in the `bot.json` configuration file under the `permissions` key.

Here is an example of a permission configured for the role `910250949329702943` to start a server.
```json
  "permissions": {
    "roles": {
      "910250949329702943": {
        "level": 0,
        "scopes": ["StartServer"]
      }
    }
  }
```

`910250949329702943` is the role id which can be copied straight from Discord when having the developer option turned on.

`scopes` is an array that contains all scopes this role has. Currently supported scopes are:

- `HarmlessCommands`
- `StartServer`
- `StopServer`
- `ViewServer`
- `ManageBackups`
- `ViewBackups`
- `ExecuteGameCommands`

#### `HarmlessCommands`
> When a role is given this scope, it can execute commands that cannot do any harm such as `/help`
#### `StartServer`
> This scope allows the role to start a server either using a command or a button.
#### `StopServer`
> This scope allows the role to stop a server either using a command or a button.

> **Note**: To restart a server, it is required that the role has both of the scopes `StartServer` and `StopServer`

#### `ViewServer`
> Allows the role to view details regarding a server  e.g. server status.
#### `ManageBackups`
> Allows the creation of backups

#### `ViewBackups`
> Allows the viewing of backups

#### `ExecuteGameCommands`
> Allows the role to execute commands on the server from Discord

`level` is a required non negative integer which specifies the level/importance of the role. The highest level role gets the lower level roles' scopes automatically added when permissions are calculated. For example let's say we have a role admin with a `level` of 5 which has the scopes `StartServer` and `StopServer` but has no access to `HarmlessCommands` and we have a role user that only has the scope `HarmlessCommands` applied but has a `level` of 0. When Masa calculates permissions it sets admin to have `StartServer`, `StopServer` and `HarmlessCommands` but leaves the user role as is. This is beacuse the admin role has a higher `level` than the user role.

### Important notes
**Note**: Permissions cannot be set per server.

**Note**: Currently only role based permissions are supported.

**Note**: Masa needs to be restarted after every permission change to update Discord slash commands.