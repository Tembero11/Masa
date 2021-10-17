export class NoListenersError extends Error {
  constructor() {
    super("Cannot remove empty listeners");
    this.name = "NoListenersError";
  }
}
export class InvalidGameServerCommandError extends Error {
  constructor() {
    super("The command provided was invalid");
    this.name = "InvalidGameServerCommandError";
  }
}