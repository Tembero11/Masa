export class NoListenersError extends Error {
  constructor() {
    super("Cannot remove empty listeners");
    this.name = "NoListenersError";
  }
}