import { useAtomMount } from "@effect/atom-react";

import { wirePlumberConnection } from "./atoms/connection.js";

/** Keeps the WirePlumber connection active for the surrounding application. */
export const WirePlumberConnectionMount = () => {
  useAtomMount(wirePlumberConnection);
  return null;
};
