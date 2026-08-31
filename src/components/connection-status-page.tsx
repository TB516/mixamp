import { AdwStatusPage } from "@gtkx/jsx/adw";
import { GtkButton } from "@gtkx/jsx/gtk";

/** Properties for a status page shown when the audio connection is unavailable. */
type ConnectionStatusPageProps = {
  /** Status icon. */
  readonly iconName: string;
  /** Status title. */
  readonly title: string;
  /** Status description. */
  readonly description: string;
  /** Retries the WirePlumber connection when provided. */
  readonly onReconnect?: (() => void) | undefined;
};

/** Shows audio connection status and an optional reconnect action. */
export const ConnectionStatusPage = ({
  iconName,
  title,
  description,
  onReconnect,
}: ConnectionStatusPageProps) => (
  <AdwStatusPage iconName={iconName} title={title} description={description} hexpand vexpand>
    {onReconnect && <GtkButton label="Reconnect" onClicked={onReconnect} />}
  </AdwStatusPage>
);
