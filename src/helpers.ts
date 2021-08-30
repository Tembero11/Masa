import { config } from "../index";



export const withoutPrefix = (content: string) => content.substr(config["prefix"].length);

export const usesPrefix = (content: string) => content.startsWith(config["prefix"]);

export const isAllowedChannel = (channelID: string) => {
  for (const allowedChannel of config["allowedChannels"]) {
    if (allowedChannel === channelID) {
      return true;
    }
  }

  return false;
}