import * as Wp from "@gtkx/gi/wp";
import { Effect } from "effect";

import {
  WirePlumberCrossfadeError,
  WirePlumberCrossfadeRollbackError,
  WirePlumberSinkGainError,
} from "../errors.ts";
import type { WirePlumberSink } from "../types.ts";
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
  sink: WirePlumberSink,
  gain: number,
): Effect.Effect<void, WirePlumberSinkGainError> =>
  Effect.gen(function* () {
    const updated = yield* Effect.try({
      try: () => node.setParam("Props", 0, makeVolumePod(gain)),
      catch: (cause) => new WirePlumberSinkGainError({ sink, gain, cause }),
    });

    if (updated) {
      return;
    }

    return yield* new WirePlumberSinkGainError({
      sink,
      gain,
      cause: "Wp.Node.setParam() returned false",
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
): Effect.Effect<
  number,
  WirePlumberCrossfadeError | WirePlumberSinkGainError | WirePlumberCrossfadeRollbackError
> =>
  Effect.gen(function* () {
    const value = yield* clampCrossfade(crossfade, "Crossfade");
    const previousValue = yield* clampCrossfade(previousCrossfade, "Previous crossfade");
    const gameGain = value > 0 ? 1 - value : 1;
    const voiceGain = value < 0 ? 1 + value : 1;
    const previousGameGain = previousValue > 0 ? 1 - previousValue : 1;

    yield* setSinkGain(playbackNodes.game, "game", gameGain);
    yield* setSinkGain(playbackNodes.voice, "voice", voiceGain).pipe(
      Effect.catch((updateError) =>
        Effect.gen(function* () {
          yield* setSinkGain(playbackNodes.game, "game", previousGameGain).pipe(
            Effect.mapError(
              (rollbackError) =>
                new WirePlumberCrossfadeRollbackError({
                  crossfade: value,
                  previousCrossfade: previousValue,
                  updateError,
                  rollbackError,
                }),
            ),
          );

          return yield* updateError;
        }),
      ),
    );

    return value;
  });
