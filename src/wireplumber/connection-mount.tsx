import { useAtomMount } from "@effect/atom-react";

import { wirePlumberState } from "./atoms/state.ts";

/** Keeps the WirePlumber connection active for the surrounding application. */
export const WirePlumberConnectionMount = () => {
  useAtomMount(wirePlumberState);
  return null;
};
