import { useAtomRefresh, useAtomValue } from "@effect/atom-react";
import { AsyncResult } from "effect/unstable/reactivity";

import { BalanceControl } from "../components/balance-control.tsx";
import { ConnectionLoadingPage } from "../components/connection-loading-page.tsx";
import { ConnectionStatusPage } from "../components/connection-status-page.tsx";
import { wirePlumberState } from "../wireplumber/index.ts";

/** Main screen backed by the current WirePlumber atom. */
export const MainScreen = () => {
  const reconnectWirePlumber = useAtomRefresh(wirePlumberState);
  const wirePlumber = useAtomValue(wirePlumberState);

  return AsyncResult.matchWithError(wirePlumber, {
    onInitial: () => <ConnectionLoadingPage />,
    onSuccess: ({ value }) => {
      if (!value.connected) {
        return (
          <ConnectionStatusPage
            iconName="audio-volume-muted-symbolic"
            title="PipeWire disconnected"
            description="Mixamp is waiting for the audio service. Reopen the app after PipeWire is running."
          />
        );
      }

      return <BalanceControl crossfade={value.crossfade} />;
    },
    onError: (error) => {
      let canReconnect = false;
      let title = "The audio connection failed";
      let description = "Close and reopen Mixamp, then try again.";

      switch (error._tag) {
        case "WirePlumberInitializationError":
          title = "WirePlumber could not start";
          description = "Mixamp could not initialize the WirePlumber library.";
          break;
        case "WirePlumberCoreCreationError":
          title = "Could not create the audio connection";
          description = "Mixamp could not create its WirePlumber core.";
          break;
        case "WirePlumberSignalSetupError":
          title = "Could not monitor the audio connection";
          description = "Mixamp could not listen for WirePlumber connection changes.";
          break;
        case "WirePlumberConnectionError":
          canReconnect = true;
          title = "Could not connect to PipeWire";
          description = "Check that PipeWire is running, then reconnect.";
          break;
        case "WirePlumberVirtualSinkError":
          canReconnect = true;
          title = "Could not create the Mixamp outputs";
          description = "The Game and Voice outputs could not be added to PipeWire.";
          break;
        case "NoSuchElementError":
          title = "The audio connection ended";
          description =
            "WirePlumber stopped publishing connection state unexpectedly. Close and reopen Mixamp.";
          break;
        default:
          error satisfies never;
      }

      return (
        <ConnectionStatusPage
          iconName="dialog-error-symbolic"
          title={title}
          description={description}
          onReconnect={canReconnect ? reconnectWirePlumber : undefined}
        />
      );
    },
    onDefect: () => (
      <ConnectionStatusPage
        iconName="dialog-error-symbolic"
        title="Mixamp failed unexpectedly"
        description="Close and reopen the app. If this keeps happening, check the application logs."
      />
    ),
  });
};
