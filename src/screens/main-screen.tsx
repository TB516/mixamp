import { useAtomValue } from "@effect/atom-react";

import { BalanceControl } from "../components/balance-control.tsx";
import { ConnectionStatus } from "../components/connection-status.tsx";
import { useWirePlumber } from "../providers/wireplumber-provider.tsx";

/** Main application screen shown after WirePlumber initializes. */
export const MainScreen = () => {
  const { model, reconnect } = useWirePlumber();
  const state = useAtomValue(model.state);

  if (!state.connected) {
    return (
      <ConnectionStatus
        iconName="audio-volume-muted-symbolic"
        title="PipeWire disconnected"
        description="Mixamp is waiting for the audio service. Reopen the app after PipeWire is running."
        onReconnect={reconnect}
      />
    );
  }

  return (
    <BalanceControl
      crossfade={state.crossfade}
      sinks={state.sinks}
      crossfadeAtom={model.setCrossfade}
    />
  );
};
