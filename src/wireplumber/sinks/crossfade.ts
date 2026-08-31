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

/** Applies a gain to a virtual sink. */
const setSinkGain = (
  node: Wp.Node,
  sinkName: "Game" | "Voice",
  gain: number,
): Effect.Effect<void, WirePlumberCrossfadeError> =>
  Effect.gen(function* () {
    const updated = yield* Effect.try({
      try: () => node.setParam("Props", 0, makeVolumePod(gain)),
      catch: (cause) => new WirePlumberCrossfadeError({ cause }),
    });

    if (updated) {
      return;
    }

    return yield* new WirePlumberCrossfadeError({
      cause: `Could not set the ${sinkName} sink gain`,
    });
  });

/** Clamps a crossfade or fails when it is not finite. */
const clampCrossfade = (
  crossfade: number,
  name: "Crossfade" | "Previous crossfade",
): Effect.Effect<number, WirePlumberCrossfadeError> =>
  Effect.gen(function* () {
    if (!Number.isFinite(crossfade)) {
      return yield* new WirePlumberCrossfadeError({
        cause: `${name} must be a finite number`,
      });
    }

    return Math.max(-1, Math.min(1, crossfade));
  });

/** Applies the Game/Voice balance and returns the clamped value. */
export const setVirtualSinkCrossfade = (
  playbackNodes: PlaybackNodes,
  crossfade: number,
  previousCrossfade = 0,
): Effect.Effect<number, WirePlumberCrossfadeError> =>
  Effect.gen(function* () {
    const value = yield* clampCrossfade(crossfade, "Crossfade");
    const previousValue = yield* clampCrossfade(previousCrossfade, "Previous crossfade");
    const gameGain = value > 0 ? 1 - value : 1;
    const voiceGain = value < 0 ? 1 + value : 1;
    const previousGameGain = previousValue > 0 ? 1 - previousValue : 1;

    yield* setSinkGain(playbackNodes.game, "Game", gameGain);
    yield* setSinkGain(playbackNodes.voice, "Voice", voiceGain).pipe(
      Effect.catch((voiceCause) =>
        Effect.gen(function* () {
          yield* setSinkGain(playbackNodes.game, "Game", previousGameGain).pipe(
            Effect.mapError(
              (rollbackCause) =>
                new WirePlumberCrossfadeError({
                  cause: { voice: voiceCause, rollback: rollbackCause },
                }),
            ),
          );

          return yield* voiceCause;
        }),
      ),
    );

    return value;
  });
