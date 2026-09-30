# Development

## Requirements

The host needs `flatpak-dev`, Flatpak, Flatpak Builder, the OpenSSH client tools, and a systemd user session. Install the GNOME 50 platform and SDK, plus the Node 24 extension for the SDK's Freedesktop 25.08 base:

```sh
flatpak install --user flathub org.gnome.Platform//50 org.gnome.Sdk//50 org.freedesktop.Sdk.Extension.node24//25.08
```

## Run commands

From this checkout:

```sh
flatpak-dev run -- pnpm install --frozen-lockfile
flatpak-dev run -- pnpm dev
```

Run the project's checks and build with:

```sh
flatpak-dev run -- pnpm check
flatpak-dev run -- pnpm build
```

The CLI uses the normal application manifest, builds the dependencies, and skips the final Mixamp module. The live checkout and persistent sandbox home are shared by commands and editor connections.

`flatpak/.profile` configures pnpm's persistent directories and disables GTK accessibility for development. The CLI gets tool paths, library paths, and other build settings from the SDK and manifest. Profile edits apply to the next session.

## Connect an editor

Generate an SSH host entry:

```sh
flatpak-dev ssh config --host mixamp-flatpak
```

Add the printed `Include` line near the top of `~/.ssh/config`, before any broad `Host *` block. Connect to `mixamp-flatpak` from Zed, VS Code, or another SSH editor, then open the checkout path printed by the command. Connecting starts the sandbox automatically.

After upgrading `flatpak-dev` in `mise.toml`, install it and run `ssh config` again to update the editor entry's binary path.

To open a terminal from the host:

```sh
flatpak-dev ssh connect
```

There is no fixed SSH port or separate startup command. Commands and SSH sessions join the same sandbox. It stops 30 seconds after the last connection ends. Keep a connection open while you need background jobs.

## Package the app

Build the installable Flatpak bundle from the host:

```sh
mise run build
```

The task runs Flatpak Builder, which builds the app inside the SDK sandbox. It writes the bundle to `build-flatpak/io.github.TB516.mixamp.flatpak` and prints its installation command.
