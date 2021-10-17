import assert from "assert";
import { InvalidGameServerCommandError } from "./Errors";

type MemoryUnit = "G" | "K" | "M";
type MemoryString = `${number}${MemoryUnit}`;

interface Arguments {
  maxMem?: MemoryString,
  minMem?: MemoryString,
  noGUI?: boolean,
}

export default class GameServerArgumentBuilder {
  private _Xmx: MemoryString = "1024M";
  private _Xms: MemoryString = "1024M";
  private _jar: string;
  private _noGui: boolean = false;


  constructor(jar: string, options?: Arguments) {
    if (options) {
      if (options.maxMem) this._Xmx = options.maxMem;
      if (options.minMem) this._Xms = options.minMem;

      this.noGUI(options.noGUI);
    }
    this._jar = jar;
  }

  static from(command: string) {
    assert(command.startsWith("java"), new InvalidGameServerCommandError());

    let args = command.substring(4).split(" ");

    let options: Arguments = {
      noGUI: false,
    };
    let jarFile: string | undefined;

    let i = 0;
    do {
      let arg = args[i];
      switch (arg) {
        case "nogui":
          options.noGUI = true;
          break;
        case "-Xmx":
          let xmx = arg.match(/([0-9]){1,}(G|K|M)/i);
          assert(xmx && xmx[0]);
          options.maxMem = xmx[0] as MemoryString;
          break;
        case "-Xmx":
          let xms = arg.match(/([0-9]){1,}(G|K|M)/i);
          assert(xms && xms[0]);
          options.minMem = xms[0] as MemoryString;
          break;
        case "-jar":
          jarFile = args.at(i + 1);
          // Skip the next index
          i++;
        default:
          break;
      }
    } while(i < args.length);

    assert(jarFile, new InvalidGameServerCommandError());

    return new GameServerArgumentBuilder(jarFile, options);
  }

  noGUI(enable?: boolean) {
    if (enable === undefined) {
      enable = true;
    }
    this._noGui = enable;

    return this;
  }

  setMaxMem(amount: number, unit: MemoryUnit) {
    this._Xmx = `${amount}${unit}`;
    return this;
  }

  setMinMem(amount: number, unit: MemoryUnit) {
    this._Xms = `${amount}${unit}`;
    return this;
  }

  toString() {
    return `java -Xmx${this._Xmx} -Xms${this._Xms} -jar ${this._jar} ${this._noGui ? "nogui" : ""}`;
  }
}
// java -Xmx1024M -Xms1024M -jar server.jar nogui