import { Language } from "../classes/Lang"
import { PermissionSettings } from "../classes/PermissionManager"

export default interface BotConfig {
    token: string
    clientID: string
    guildID: string
    language?: Language,
    developer?: {
        skipLanguageParsing?: boolean
    }
    permissions?: {
        roles: PermissionSettings
    }
    allowedChannels?: string[]
}