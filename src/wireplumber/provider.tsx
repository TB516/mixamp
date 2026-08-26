import { Cause, Effect, Exit, ManagedRuntime, Option, Stream, SubscriptionRef } from "effect";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { PropsWithChildren } from "react";
import { WirePlumberContextError, WirePlumberError } from "./errors.js";
import { WirePlumber, WirePlumberLive } from "./service.js";
import {
  initialWirePlumberConnectionState,
  type WirePlumberConnectionState,
  type WirePlumberService,
} from "./types.js";

type WirePlumberRunner = <A, E>(
  effect: Effect.Effect<A, E, WirePlumberService>,
) => Promise<Exit.Exit<A, E | WirePlumberError>>;

type WirePlumberContextValue = {
  readonly state: WirePlumberConnectionState;
  readonly error: WirePlumberError | null;
  readonly run: WirePlumberRunner;
};

const WirePlumberContext = createContext<WirePlumberContextValue | null>(null);

/**
 * Provides the connection and its state to descendant components.
 *
 * Mounting acquires the service. Unmounting releases its native resources.
 */
export const WirePlumberProvider = ({ children }: PropsWithChildren) => {
  const runtimeRef = useRef<ManagedRuntime.ManagedRuntime<
    WirePlumberService,
    WirePlumberError
  > | null>(null);
  const [state, setState] = useState(initialWirePlumberConnectionState);
  const [error, setError] = useState<WirePlumberError | null>(null);

  useEffect(() => {
    const runtime = ManagedRuntime.make(WirePlumberLive);
    runtimeRef.current = runtime;
    let active = true;

    const initialize = Effect.gen(function* () {
      const service = yield* WirePlumber;
      const state = yield* SubscriptionRef.get(service.state);

      return { service, state };
    });

    void runtime.runPromiseExit(initialize).then(
      Exit.match({
        onSuccess: (initialized) => {
          if (!active) {
            return;
          }

          setState(initialized.state);

          runtime.runFork(
            Stream.runForEach(SubscriptionRef.changes(initialized.service.state), (nextState) =>
              Effect.sync(() => {
                if (active) {
                  setState(nextState);
                }
              }),
            ),
          );
        },
        onFailure: (cause) => {
          if (!active) {
            return;
          }

          const failure = Cause.findErrorOption(cause);

          if (Option.isSome(failure)) {
            setError(failure.value);
            return;
          }

          setError(
            new WirePlumberError({
              message: "Mixamp's WirePlumber client failed unexpectedly",
              cause,
            }),
          );
        },
      }),
    );

    return () => {
      active = false;
      runtimeRef.current = null;
      void runtime.dispose();
    };
  }, []);

  const run = useCallback<WirePlumberRunner>((effect) => {
    const runtime = runtimeRef.current;

    if (!runtime) {
      return Promise.resolve(
        Exit.fail(
          new WirePlumberError({
            message: "Mixamp's WirePlumber client is not available",
          }),
        ),
      );
    }

    return runtime.runPromiseExit(effect);
  }, []);

  const value = useMemo<WirePlumberContextValue>(
    () => ({
      state,
      error,
      run,
    }),
    [error, run, state],
  );

  return <WirePlumberContext.Provider value={value}>{children}</WirePlumberContext.Provider>;
};

/**
 * Reads connection state and runs Effects that require the WirePlumber service.
 *
 * This hook must be used below a WirePlumberProvider.
 */
export const useWirePlumber = () => {
  const context = useContext(WirePlumberContext);

  if (!context) {
    throw new WirePlumberContextError({
      message: "useWirePlumber must be used inside WirePlumberProvider",
    });
  }

  return context;
};
