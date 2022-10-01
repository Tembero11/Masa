export enum NetworkError {
    Ok,
    UnknownError,
    // from and to query params are invalid
    InvalidRange,
    GameServerNotFound,
    // Server is in the wrong state for the required action
    GameServerBadState,
    GameCommandMissing,
    InvalidLoginCredentials
}