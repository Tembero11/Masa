import { GenericButton } from "./GenericButton";
import { RepeatCommandButton } from "./RepeatCommandButton";
import { RestartButton } from "./RestartButton";
import { StartButton } from "./StartButton";
import { StopButton } from "./StopButton";

export default Object.freeze([
  new StartButton(true),
  new RestartButton(true),
  new StopButton(true),
  new RepeatCommandButton(true)
].reduce((map, obj) => map.set(obj.customId, obj), new Map<string, GenericButton>()));