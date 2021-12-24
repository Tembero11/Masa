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

export class EulaNotAcceptedError extends Error {
  constructor(serverName?: string) {
    super(`The eula was not accepted when attempting to install ${serverName || "server"}`);
    this.name = "EulaNotAcceptedError";
  }
}

export class InstallDirectoryNotEmptyError extends Error {
  constructor(serverName?: string) {
    super(`The install directory was not empty when attempting to install ${serverName || "server"}`);
    this.name = "InstallDirectoryNotEmptyError";
  }
}

export class NotInitializedError extends Error {
  constructor(propertyName: string, className: string) {
    super(`Tried to access ${propertyName} but ${className} was not initialized!`);
    this.name = "NotInitializedError";
  }
}
export class UnknownLanguageError extends Error {
  constructor(lang: string) {
    super(`${lang} is not a known language!`);
    this.name = "UnknownLanguageError";
  }
}

export class NullRequiredLanguageParameterError extends Error {
  constructor(params: string[]) {
    super(`${params.join(", ")} ${params.length > 1 ? "are" : "is"} null!`);
    this.name = "NullRequiredLanguageParameterError";
  }
}