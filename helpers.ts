import { config } from "./index";

const prefix = config["prefix"];
const allowedChannels = config["allowedChannels"]

export const withoutPrefix = (content: string) => content.substr(prefix.length);

export const usesPrefix = (content: string) => content.startsWith(prefix);

export const isAllowedChannel = (channelID: string) => {
  for (const allowedChannel of allowedChannels) {
    if (allowedChannel === channelID) {
      return true;
    }
  }

  return false;
}