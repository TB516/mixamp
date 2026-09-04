import { useAtomRefresh, useAtomValue } from "@effect/atom-react";
import { AsyncResult } from "effect/unstable/reactivity";
import { createContext, type PropsWithChildren, useContext } from "react";

import { ConnectionLoading } from "../components/connection-loading.tsx";
import { ConnectionStatus } from "../components/connection-status.tsx";
import { wirePlumber, type WirePlumberModel } from "../wireplumber/atom.ts";

/** WirePlumber values exposed to initialized application UI. */
type WirePlumberContextValue = {
  /** Initialized WirePlumber model available to the application UI. */
  readonly model: WirePlumberModel;
  /** Reinitializes the WirePlumber service. */
  readonly reconnect: () => void;
};

/** React context for the initialized WirePlumber model. */
const WirePlumberContext = createContext<WirePlumberContextValue | null>(null);

/** Reads the initialized WirePlumber model provided to the application UI. */
export const useWirePlumber = (): WirePlumberContextValue => {
  const value = useContext(WirePlumberContext);

  if (value === null) {
    throw new Error("useWirePlumber must be used inside WirePlumberProvider");
  }

  return value;
};

/** Initializes WirePlumber and provides it to the application UI. */
export const WirePlumberProvider = ({ children }: PropsWithChildren) => {
  const reconnect = useAtomRefresh(wirePlumber);
  const result = useAtomValue(wirePlumber);

  return AsyncResult.matchWithError(result, {
    onInitial: () => <ConnectionLoading />,
    onSuccess: ({ value }) => (
      <WirePlumberContext.Provider value={{ model: value, reconnect }}>
        {children}
      </WirePlumberContext.Provider>
    ),
    onError: (error) => {
      let title = "The audio connection failed";
      let description = "Close and reopen Mixamp, then try again.";

      switch (error._tag) {
        case "WirePlumberConnectionError":
          title = "Could not connect to PipeWire";
          description = "Check that PipeWire is running, then reconnect.";
          break;
        case "WirePlumberVirtualSinkLoadError":
          title = "Could not create the Mixamp outputs";
          description = "The Game and Voice outputs could not be added to PipeWire.";
          break;
        case "WirePlumberPlaybackNodeTimeoutError":
          title = "Mixamp outputs did not become ready";
          description = "The Game and Voice outputs did not become available in PipeWire.";
          break;
        default:
          return error satisfies never;
      }

      return (
        <ConnectionStatus
          iconName="dialog-error-symbolic"
          title={title}
          description={description}
          onReconnect={reconnect}
        />
      );
    },
    onDefect: () => (
      <ConnectionStatus
        iconName="dialog-error-symbolic"
        title="Mixamp failed unexpectedly"
        description="Close and reopen the app. If this keeps happening, check the application logs."
      />
    ),
  });
};
