## Setting up a server

Masa will now ask you to enter your bot/app details to the server console. After entering the bot details Masa will prompt you to install a server software E.g. Vanilla or Paper. 

You can cancel the automatic installation & use a custom installation or a previous server you have one. To install a server manually you need to have a basic understanding of JSON. Head on over to the Masa directory and search for the `config` folder this should have a `servers.json` file inside if there isn't, create one. Here is an easy example of a server:

```json
{
  "name": "example",
  "command": "java -Xmx1024M -Xms1024M -jar example_server.jar nogui",
  "description": "This is an example server.",
  "directory": "~/example/dir"
}
```
The above JSON is called a server metadata object.


The first field `name` should be the name you want to call the server.
The second field `command` is the command Masa runs when it wants to start the server.
The fourth field `directory` is the directory where the command is executed.

The servers are stored inside the file in brackets `[]` or in other words a JSON array. There is no limit to how many servers Masa can handle.

**Note**: Masa cannot run the server if the eula is not accepeted.

**Note**: Everytime you make a configuration change make sure to restart Masa to reload all configurations.