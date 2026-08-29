import * as Wp from "@gtkx/gi/wp";
import { Effect } from "effect";

import { WirePlumberCrossfadeError } from "../errors.ts";
import type { PlaybackNodes } from "./playback-nodes.ts";

/** Creates a WirePlumber volume parameter for the given gain. */
const makeVolumePod = (gain: number) => {
  const builder = Wp.SpaPodBuilder.newObject("Spa:Pod:Object:Param:Props", "Props");
  builder.addProperty("volume");
  builder.addFloat(gain);
  return builder.end();
};

/** Applies the Game/Voice balance and returns the clamped value. */
export const setVirtualSinkCrossfade = (
  playbackNodes: PlaybackNodes,
  crossfade: number,
): Effect.Effect<number, WirePlumberCrossfadeError> =>
  Effect.try({
    try: () => {
      if (!Number.isFinite(crossfade)) {
        throw new Error("Crossfade must be a finite number");
      }

      const value = Math.max(-1, Math.min(1, crossfade));
      const gameGain = value > 0 ? 1 - value : 1;
      const voiceGain = value < 0 ? 1 + value : 1;

      if (!playbackNodes.game.setParam("Props", 0, makeVolumePod(gameGain))) {
        throw new Error("Could not set the Game sink gain");
      }

      if (!playbackNodes.voice.setParam("Props", 0, makeVolumePod(voiceGain))) {
        throw new Error("Could not set the Voice sink gain");
      }

      return value;
    },
    catch: (cause) => new WirePlumberCrossfadeError({ cause }),
  });
