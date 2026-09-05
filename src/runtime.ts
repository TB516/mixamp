import { Atom } from "effect/unstable/reactivity";

import { settingsLayer } from "./settings/service.ts";

/** Keeps application settings alive while individual audio connections are rebuilt. */
export const runtime = Atom.runtime(settingsLayer).pipe(Atom.keepAlive);
