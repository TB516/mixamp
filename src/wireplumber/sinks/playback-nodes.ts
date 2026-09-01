import * as GLib from "@gtkx/gi/glib";
import * as Wp from "@gtkx/gi/wp";
import { Effect } from "effect";

import {
  WirePlumberPlaybackNodeDiscoveryError,
  WirePlumberPlaybackNodeManagerError,
  WirePlumberPlaybackNodeTimeoutError,
} from "../errors.ts";
import type { WirePlumberSink } from "../types.ts";
import { sinkDefinitions } from "./definitions.ts";

/** Game and Voice playback nodes routed to the default output. */
export type PlaybackNodes = {
  /** Game playback node. */
  readonly game: Wp.Node;
  /** Voice playback node. */
  readonly voice: Wp.Node;
};

/** Creates a WirePlumber interest for a virtual sink's playback node. */
const makePlaybackNodeInterest = (sink: WirePlumberSink) => {
  const interest = Wp.ObjectInterest.newType(Wp.Node);
  interest.addConstraint(
    Wp.ConstraintType.PW_GLOBAL_PROPERTY,
    "node.name",
    Wp.ConstraintVerb.EQUALS,
    GLib.Variant.newString(`${sinkDefinitions[sink].nodeName}.output`),
  );
  return interest;
};

/** Creates an object manager that tracks the Game and Voice playback nodes. */
export const makePlaybackNodeManager = (
  core: Wp.Core,
): Effect.Effect<Wp.ObjectManager, WirePlumberPlaybackNodeManagerError> =>
  Effect.try({
    try: () => {
      const objectManager = Wp.ObjectManager.new();
      objectManager.addInterestFull(makePlaybackNodeInterest("game"));
      objectManager.addInterestFull(makePlaybackNodeInterest("voice"));
      objectManager.requestObjectFeatures(
        Wp.Node,
        Wp.ProxyFeatures.PIPEWIRE_OBJECT_FEATURES_MINIMAL,
      );
      core.installObjectManager(objectManager);
      return objectManager;
    },
    catch: (cause) => new WirePlumberPlaybackNodeManagerError({ cause }),
  });

/** Looks up a virtual sink's playback node by name. */
const lookupPlaybackNode = (objectManager: Wp.ObjectManager, sink: WirePlumberSink) => {
  // lookupFull takes ownership of the interest, so each lookup needs a new one.
  const object = objectManager.lookupFull(makePlaybackNodeInterest(sink));
  return object instanceof Wp.Node ? object : null;
};

/** Waits for the Game and Voice playback nodes to become available. */
export const waitForPlaybackNodes = (
  objectManager: Wp.ObjectManager,
): Effect.Effect<
  PlaybackNodes,
  WirePlumberPlaybackNodeDiscoveryError | WirePlumberPlaybackNodeTimeoutError
> => {
  let missing: WirePlumberSink = "game";

  return Effect.callback<PlaybackNodes, WirePlumberPlaybackNodeDiscoveryError>((resume) => {
    let handlerId: number | undefined;

    const disconnectHandler = () => {
      if (handlerId === undefined) {
        return;
      }

      objectManager.disconnect(handlerId);
      handlerId = undefined;
    };

    const checkForNodes = () => {
      try {
        const game = lookupPlaybackNode(objectManager, "game");
        if (!game) {
          missing = "game";
          return;
        }

        const voice = lookupPlaybackNode(objectManager, "voice");
        if (!voice) {
          missing = "voice";
          return;
        }

        disconnectHandler();
        resume(Effect.succeed({ game, voice }));
      } catch (cause) {
        disconnectHandler();
        resume(Effect.fail(new WirePlumberPlaybackNodeDiscoveryError({ cause })));
      }
    };

    try {
      handlerId = objectManager.connect("objects-changed", checkForNodes);
      checkForNodes();
    } catch (cause) {
      disconnectHandler();
      resume(Effect.fail(new WirePlumberPlaybackNodeDiscoveryError({ cause })));
    }

    return Effect.sync(disconnectHandler);
  }).pipe(
    Effect.timeoutOrElse({
      duration: "5 seconds",
      orElse: () => Effect.fail(new WirePlumberPlaybackNodeTimeoutError({ missing })),
    }),
  );
};
