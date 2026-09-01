import type { WirePlumberSink } from "../../types.ts";

/** Definitions for Mixamp's Game and Voice sinks. */
export const sinkDefinitions = {
  game: {
    nodeName: "mixamp_game",
  },
  voice: {
    nodeName: "mixamp_voice",
  },
} satisfies Record<WirePlumberSink, { readonly nodeName: string }>;
