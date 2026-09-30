export const CHANNEL_CATEGORIES = ["national","international","entertainment","kids","religion"] as const;
export type ChannelCategory = (typeof CHANNEL_CATEGORIES)[number];
export type PlaybackStatus = "idle"|"connecting"|"playing"|"fallback"|"paused"|"error"|"unsupported";
export type StreamSource = { url: string; label?: string };
export type Channel = {
  id: string; number: number; name: string; shortName: string; category: ChannelCategory;
  region: string; language: string; logo?: string; sources: StreamSource[];
};