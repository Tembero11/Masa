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

type StandardStreamType = "stdin" | "stdout" | "stderr";

export class NoStandardStreamsError extends Error {
  constructor(stream?: StandardStreamType | StandardStreamType[]) {
    let msg = "";
    if (Array.isArray(stream) && stream.length > 1) {
      msg = `${stream.splice(0, stream.length - 2).join(",")} & ${stream[stream.length - 1]} were missing`;
    }else {
      if (stream) {
        msg = `${stream} was missing`;
      }else {
        msg = `One or more streams were missing`;
      }
    }
    super(msg);
    this.name = "NoStandardStreamsError";
  }
}

export class NoPlayerError extends Error {
  constructor() {
    super("The event was not player related, yet was still expected to be");
    this.name = "NoPlayerError";
  }
}