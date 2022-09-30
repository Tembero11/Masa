export interface RawServerMetadata {
    /**
     * The name of the minecraft server
     */
    name: string
    description: string
    /**
     * the command that starts the server. This runs inside the server folder
     */
    command: string


    // Whether to show logs to the masa console
    logs?: boolean,

    backups?: {
        backupLimit: number,
        backupInterval: string | number,
    },
    advanced?: {
        welcomeMsg?: string
        chat?: {
            channels?: string | string[]
            sendPlayerNetworkEvents?: boolean
            sendServerReadyEvent?: boolean
            allowDuplex?: boolean
        }
    }
}
export type ServerMetadata = { tag: string, directory: string } & RawServerMetadata;