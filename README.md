# Mixamp

Mixamp is a small GTKX app for trying GTK 4, libadwaita, and WirePlumber while developing entirely inside a Flatpak SDK.

## Development

The host needs:

- VS Code with Remote - SSH
- Flatpak and flatpak-builder
- A systemd user session
- `flock`, `ssh`, `ssh-keygen`, and `ss`

Install the runtime, SDK, and SDK extensions declared by the development manifest before the first build. The launcher does not install or update Flatpak dependencies.

Start the development environment from a host terminal:

```sh
./scripts/flatpak-dev
```

On the first run, add the `Include` line printed by the launcher near the top of your host `~/.ssh/config`, before any broad `Host *` block. Run the launcher before connecting whenever the service is not already running.

Connect the current VS Code window to `mixamp-flatpak` with Remote-SSH and open the repository path printed by the launcher.

### Optional automatic startup

Remote-SSH can run the launcher automatically before it connects. Add this optional host user setting with the repository's actual path:

```json
"remote.SSH.preconnect": {
  "mixamp-flatpak": "/absolute/path/to/mixamp/scripts/flatpak-dev"
}
```

With this setting, connecting to `mixamp-flatpak` starts the service without a separate terminal or VS Code window. Remote-SSH currently marks the preconnect setting as experimental. Without it, start the launcher manually before connecting.

Inside the remote VS Code window:

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Use `pnpm check` to run code generation, type checking, and tests.

To run a one-off command in the development Flatpak from the host, use:

```sh
./scripts/flatpak-dev run pnpm check
```

When the SSH service is inactive, `run` rebuilds the development image using Flatpak Builder's module cache. When the service is active, it leaves the image and SSH session alone. Both paths run the command with `flatpak build` and the persistent development home. To update the image without running a command or starting SSH, use:

```sh
./scripts/flatpak-dev build
```

Flatpak Builder reuses its module cache. Changes to development manifest modules, OpenSSH, SDK extensions, or files installed into `/app` rebuild the affected modules. Project source, package manifests, and the lockfile do not rebuild the development image because the development manifest does not declare them as sources. Install dependencies with pnpm inside the development Flatpak. The manifest installs the shared shell configuration from `flatpak/.profile`. Login shells, interactive Bash shells, one-off commands, and VS Code all use that profile.

The launcher uses a transient systemd user service, so it does not need an open terminal. The service stops 30 seconds after the remote window disconnects, or after 120 seconds if no connection arrives. The launcher builds directly into `.flatpak-dev` and does not install Mixamp.

Use the launcher to control or inspect the service manually:

```sh
./scripts/flatpak-dev start
./scripts/flatpak-dev build
./scripts/flatpak-dev stop
./scripts/flatpak-dev status
./scripts/flatpak-dev logs
```

`start` holds the lock while rebuilding and launching the service, then releases it before waiting for SSH. `build` holds the lock while rebuilding. An inactive-service `run` holds the lock only while rebuilding, while an active-service `run` skips the rebuild. `build` still refuses to update `.flatpak-dev/build` while the service is active.

If port `22222` is occupied, choose another one when starting the launcher:

```sh
MIXAMP_DEV_SSH_PORT=22223 ./scripts/flatpak-dev
```
