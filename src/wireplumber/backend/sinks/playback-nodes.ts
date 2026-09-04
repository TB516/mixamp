import * as GLib from "@gtkx/gi/glib";
import * as Wp from "@gtkx/gi/wp";
import { Deferred, Effect, Scope } from "effect";

import { WirePlumberPlaybackNodeTimeoutError } from "../../errors.ts";
import type { WirePlumberSink } from "../../types.ts";
import { sinkDefinitions } from "./definitions.ts";

/** Game and Voice playback nodes routed to the default output. */
export type PlaybackNodes = {
  /** Game playback node. */
  readonly game: Wp.Node;
  /** Voice playback node. */
  readonly voice: Wp.Node;
};

/** Creates a WirePlumber interest for a virtual sink's playback node. */
const makePlaybackNodeInterest = (sink: WirePlumberSink): Effect.Effect<Wp.ObjectInterest> =>
  Effect.sync(() => {
    const interest = Wp.ObjectInterest.newType(Wp.Node);
    interest.addConstraint(
      Wp.ConstraintType.PW_GLOBAL_PROPERTY,
      "node.name",
      Wp.ConstraintVerb.EQUALS,
      GLib.Variant.newString(`${sinkDefinitions[sink].nodeName}.output`),
    );
    return interest;
  });

/** Creates an object manager that tracks the Game and Voice playback nodes. */
export const makePlaybackNodeManager = (core: Wp.Core): Effect.Effect<Wp.ObjectManager> =>
  Effect.gen(function* () {
    const objectManager = Wp.ObjectManager.new();
    const gameInterest = yield* makePlaybackNodeInterest("game");
    const voiceInterest = yield* makePlaybackNodeInterest("voice");

    objectManager.addInterestFull(gameInterest);
    objectManager.addInterestFull(voiceInterest);
    objectManager.requestObjectFeatures(Wp.Node, Wp.ProxyFeatures.PIPEWIRE_OBJECT_FEATURES_MINIMAL);
    core.installObjectManager(objectManager);

    return objectManager;
  });

/** Looks up a virtual sink's playback node by name. */
const lookupPlaybackNode = (
  objectManager: Wp.ObjectManager,
  sink: WirePlumberSink,
): Effect.Effect<Wp.Node | null> =>
  Effect.gen(function* () {
    // lookupFull takes ownership of the interest, so each lookup needs a new one.
    const interest = yield* makePlaybackNodeInterest(sink);
    const object = objectManager.lookupFull(interest);

    if (object === null || object instanceof Wp.Node) {
      return object;
    }

    return yield* Effect.die(
      new Error(`Playback node lookup for ${sink} returned a non-node object`),
    );
  });

/** Waits for the Game and Voice playback nodes to become available. */
export const waitForPlaybackNodes = (
  objectManager: Wp.ObjectManager,
): Effect.Effect<PlaybackNodes, WirePlumberPlaybackNodeTimeoutError, Scope.Scope> => {
  let missing: WirePlumberSink = "game";

  return Effect.gen(function* () {
    const context = yield* Effect.context<never>();
    const ready = yield* Deferred.make<PlaybackNodes>();

    const checkForNodes = Effect.gen(function* () {
      const game = yield* lookupPlaybackNode(objectManager, "game");
      if (!game) {
        missing = "game";
        return;
      }

      const voice = yield* lookupPlaybackNode(objectManager, "voice");
      if (!voice) {
        missing = "voice";
        return;
      }

      yield* Deferred.succeed(ready, { game, voice });
    });

    const onObjectsChanged = () => {
      Effect.runSyncWith(context)(
        checkForNodes.pipe(Effect.catchCause((cause) => Deferred.failCause(ready, cause))),
      );
    };

    yield* Effect.acquireRelease(
      Effect.sync(() => objectManager.connect("objects-changed", onObjectsChanged)),
      (handlerId) => Effect.sync(() => objectManager.disconnect(handlerId)),
    );

    yield* checkForNodes;

    return yield* Deferred.await(ready);
  }).pipe(
    Effect.timeoutOrElse({
      duration: "5 seconds",
      orElse: () => Effect.fail(new WirePlumberPlaybackNodeTimeoutError({ missing })),
    }),
  );
};
