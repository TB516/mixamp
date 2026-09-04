/** Permission state for keeping Mixamp alive after its window closes. */
export type BackgroundState = "pending" | "allowed" | "denied" | "unavailable";

/** Initial background permission state. */
export const initialBackgroundState: BackgroundState = "pending";
