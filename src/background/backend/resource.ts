import * as Gio from "@gtkx/gi/gio";
import * as GLib from "@gtkx/gi/glib";
import { fromVariant, toVariant } from "@gtkx/runtime";
import { Deferred, Effect, Scope, SubscriptionRef } from "effect";

import { BackgroundPortalError } from "../errors.ts";
import type { BackgroundState } from "../types.ts";

/** D-Bus name owned by xdg-desktop-portal. */
const PORTAL_BUS_NAME = "org.freedesktop.portal.Desktop";
/** Object path shared by the desktop portal interfaces. */
const PORTAL_OBJECT_PATH = "/org/freedesktop/portal/desktop";
/** Interface used to request background permission and publish status. */
const BACKGROUND_INTERFACE = "org.freedesktop.portal.Background";
/** Interface used to receive the result of an asynchronous portal request. */
const REQUEST_INTERFACE = "org.freedesktop.portal.Request";
/** User-visible reason passed to the background permission request. */
const BACKGROUND_REASON =
  "Keep Mixamp's Game and Voice audio routing active after the window closes.";
/** Default status shown while Mixamp is running without a visible window. */
const DEFAULT_STATUS = "Managing Game and Voice audio";

/** Connects to the shared user session bus used by desktop portals. */
const makeSessionBusConnection: Effect.Effect<Gio.DBusConnection, BackgroundPortalError> =
  Effect.tryPromise({
    try: () => Gio.busGet(Gio.BusType.SESSION),
    catch: (cause) => new BackgroundPortalError({ operation: "connect", cause }),
  });

/** Creates the unique handle token used to correlate a portal request. */
const makeBackgroundHandleToken = () => `mixamp_${GLib.uuidStringRandom().replaceAll("-", "")}`;

/** Creates the RequestBackground parameters expected by the portal. */
const makeRequestParameters = (reason: string, handleToken: string): GLib.Variant =>
  toVariant("(sa{sv})", [
    "",
    {
      handle_token: toVariant("s", handleToken),
      reason: toVariant("s", reason),
      autostart: toVariant("b", false),
    },
  ]);

/** Creates the SetStatus parameters expected by the portal. */
const makeStatusParameters = (
  message: string,
): Effect.Effect<GLib.Variant, BackgroundPortalError> =>
  Effect.gen(function* () {
    if (message.length > 96) {
      return yield* new BackgroundPortalError({
        operation: "status",
        cause: new Error("Background status messages must not exceed 96 characters"),
      });
    }

    return toVariant("(a{sv})", [
      {
        message: toVariant("s", message),
      },
    ]);
  });

/** Calls a method on the desktop portal. */
const callPortal = (
  connection: Gio.DBusConnection,
  methodName: string,
  parameters: GLib.Variant,
  operation: "request" | "status",
): Effect.Effect<GLib.Variant, BackgroundPortalError> =>
  Effect.tryPromise({
    try: () =>
      connection.call(
        PORTAL_BUS_NAME,
        PORTAL_OBJECT_PATH,
        BACKGROUND_INTERFACE,
        methodName,
        parameters,
        null,
        Gio.DBusCallFlags.NONE,
        -1,
      ),
    catch: (cause) => new BackgroundPortalError({ operation, cause }),
  });

/** Reads a request object path from RequestBackground's reply. */
const readRequestPath = (reply: GLib.Variant): Effect.Effect<string, BackgroundPortalError> =>
  Effect.gen(function* () {
    const [path] = yield* Effect.try({
      try: () => fromVariant("(o)", reply),
      catch: (cause) => new BackgroundPortalError({ operation: "request", cause }),
    });

    if (path === undefined) {
      return yield* new BackgroundPortalError({
        operation: "request",
        cause: new Error("RequestBackground returned no request path"),
      });
    }

    return path;
  });

/** Reads the permission result from a Request.Response signal. */
const readBackgroundResponse = (
  parameters: GLib.Variant,
): Effect.Effect<boolean, BackgroundPortalError> =>
  Effect.gen(function* () {
    const [responseCode, results] = yield* Effect.try({
      try: () => fromVariant("(ua{sv})", parameters),
      catch: (cause) => new BackgroundPortalError({ operation: "response", cause }),
    });

    if (responseCode !== 0) {
      return false;
    }

    const background = results.background;

    if (background === undefined) {
      return yield* new BackgroundPortalError({
        operation: "response",
        cause: new Error("Background response contained no permission result"),
      });
    }

    return yield* Effect.try({
      try: () => fromVariant("b", background),
      catch: (cause) => new BackgroundPortalError({ operation: "response", cause }),
    });
  });

/** Effect and controls for one portal Request.Response subscription. */
type BackgroundResponseWaiter = {
  /** Resolves when the matching portal response arrives. */
  readonly response: Effect.Effect<GLib.Variant>;
  /** Supplies the request path returned by RequestBackground. */
  readonly setRequestPath: (requestPath: string) => Effect.Effect<void>;
};

/** Subscribes to portal responses before starting the corresponding method call. */
const subscribeToBackgroundResponse = (
  connection: Gio.DBusConnection,
  handler: Gio.DBusSignalCallback,
): Effect.Effect<number> =>
  Effect.sync(() =>
    connection.signalSubscribe(
      PORTAL_BUS_NAME,
      REQUEST_INTERFACE,
      "Response",
      null,
      null,
      Gio.DBusSignalFlags.NONE,
      handler,
    ),
  );

/** Unsubscribes from portal responses after the request scope closes. */
const unsubscribeFromBackgroundResponse = (
  connection: Gio.DBusConnection,
  subscriptionId: number,
): Effect.Effect<void> => Effect.sync(() => connection.signalUnsubscribe(subscriptionId));

/** Builds a response waiter and owns its signal subscription in the current scope. */
const makeBackgroundResponseWaiter = (
  connection: Gio.DBusConnection,
): Effect.Effect<BackgroundResponseWaiter, never, Scope.Scope> =>
  Effect.gen(function* () {
    const context = yield* Effect.context<never>();
    const response = yield* Deferred.make<GLib.Variant>();
    let requestPath: string | undefined;
    const earlyResponses = new Map<string, GLib.Variant>();

    const processResponse = (
      objectPath: string,
      responseParameters: GLib.Variant,
    ): Effect.Effect<void> =>
      Effect.gen(function* () {
        if (requestPath === undefined) {
          earlyResponses.set(objectPath, responseParameters);
          return;
        }

        if (objectPath !== requestPath) {
          return;
        }

        yield* Deferred.succeed(response, responseParameters);
      });

    const handleResponse: Gio.DBusSignalCallback = (
      _connection,
      _senderName,
      objectPath,
      _interfaceName,
      _signalName,
      responseParameters,
    ) => {
      Effect.runSyncWith(context)(
        processResponse(objectPath, responseParameters).pipe(
          Effect.catchCause((cause) => Deferred.failCause(response, cause)),
        ),
      );
    };

    yield* Effect.acquireRelease(
      subscribeToBackgroundResponse(connection, handleResponse),
      (subscriptionId) => unsubscribeFromBackgroundResponse(connection, subscriptionId),
    );

    return {
      response: Deferred.await(response),
      setRequestPath: (path) =>
        Effect.gen(function* () {
          requestPath = path;
          const earlyResponse = earlyResponses.get(path);

          if (earlyResponse === undefined) {
            return;
          }

          yield* Deferred.succeed(response, earlyResponse);
        }),
    };
  });

/** Requests permission and waits for the portal Request.Response signal. */
const requestBackground = (
  connection: Gio.DBusConnection,
  reason: string,
): Effect.Effect<boolean, BackgroundPortalError> =>
  Effect.gen(function* () {
    const handleToken = makeBackgroundHandleToken();
    const parameters = makeRequestParameters(reason, handleToken);

    return yield* Effect.scoped(
      Effect.gen(function* () {
        const waiter = yield* makeBackgroundResponseWaiter(connection);
        const reply = yield* callPortal(connection, "RequestBackground", parameters, "request");
        const requestPath = yield* readRequestPath(reply);

        yield* waiter.setRequestPath(requestPath);
        const response = yield* waiter.response;

        return yield* readBackgroundResponse(response);
      }),
    );
  });

/** Sends an optional status message to the desktop environment. */
const setPortalStatus = (
  connection: Gio.DBusConnection,
  message: string,
): Effect.Effect<void, BackgroundPortalError> =>
  Effect.gen(function* () {
    const parameters = yield* makeStatusParameters(message);
    yield* callPortal(connection, "SetStatus", parameters, "status");
    return;
  });

/** Creates the scoped background portal resource. */
export const makeBackgroundResource = (
  state: SubscriptionRef.SubscriptionRef<BackgroundState>,
): Effect.Effect<SubscriptionRef.SubscriptionRef<BackgroundState>, never, Scope.Scope> =>
  Effect.gen(function* () {
    const connection = yield* makeSessionBusConnection.pipe(
      Effect.catchTag("BackgroundPortalError", () => Effect.succeed(null)),
    );

    if (connection === null) {
      yield* SubscriptionRef.set(state, "unavailable");

      return state;
    }

    yield* Effect.gen(function* () {
      const allowed = yield* requestBackground(connection, BACKGROUND_REASON);
      yield* SubscriptionRef.set(state, allowed ? "allowed" : "denied");

      if (!allowed) {
        return;
      }

      yield* setPortalStatus(connection, DEFAULT_STATUS).pipe(Effect.ignore);
    }).pipe(
      Effect.catchTag("BackgroundPortalError", () => SubscriptionRef.set(state, "unavailable")),
    );

    return state;
  });
