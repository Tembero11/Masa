import { EventEmitter } from "events";
import ConsoleReader from "./ConsoleReader";

export declare interface StandardEmitter {
  /**
   * @description Add a listener for the stdout event
   */
  on(event: "out", listener: (event: ConsoleReader) => void): this;
  /**
   * @description Add a listener for the stderr event
   */
  on(event: "err", listener: (event: any) => void): this;
  /**
   * @description Add a listener for the stdin event 
   */
  on(event: "in", listener: (event: any) => void): this;
  // on(event: string, listener: Function): this;

  emit(eventName: "in", input: string): boolean
  emit(eventName: "out", input: ConsoleReader): boolean
  emit(eventName: "err", input: string): boolean
  // emit(eventName: string | symbol, ...args: any[]): boolean
}

export class StandardEmitter extends EventEmitter {}
new EventEmitter();