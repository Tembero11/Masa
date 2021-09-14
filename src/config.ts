export const defaultConfig = `
# the token for the bot
token: ''
# the command that starts the server. This runs inside the server folder
command: 'java -Xmx1024M -Xms1024M -jar server.jar nogui'
# The bot prefix, eg. /server start
prefix: '/server '

# A list of allowed channels that the bot can respond to
allowedChannels:
- '868036579384524811'
# The name of the minecraft server
serverName: server
# A hex color value for the Discord embeds
embedColor: "#5800fc"

# whether to show world seed
showWorldSeeds: true

backup:
  # true if backups are enabled
  useBackups: true
  # true if users can create backups
  userBackups: true
  # The maximum amount of backups at once
  backupLimit: 5
  # Create automatic backups every x minutes. If less than 1 automatic backups will get disabled.
  automaticBackups: 1

# Whether to show online data about the players
showPlayers: true

# a list of messages sent when running the easteregg command.
easteregg:
  - ":egg:"
`;
export default class Config {

}
