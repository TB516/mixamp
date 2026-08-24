# Mixamp

Mixamp is a small GTKX app for trying GTK 4, libadwaita, and WirePlumber while developing entirely inside a Flatpak SDK.

## Development

The host needs:

- VS Code with Remote - SSH
- Flatpak and flatpak-builder
- A systemd user session
- `ssh`, `ssh-keygen`, and `ss`

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

The launcher uses a transient systemd user service, so it does not need an open terminal. The service stops 30 seconds after the remote window disconnects, or after 120 seconds if no connection arrives. The launcher builds directly into `.flatpak-dev` and does not install Mixamp.

Use the launcher to control or inspect the service manually:

```sh
./scripts/flatpak-dev start
./scripts/flatpak-dev stop
./scripts/flatpak-dev status
./scripts/flatpak-dev logs
```

If port `22222` is occupied, choose another one when starting the launcher:

```sh
MIXAMP_DEV_SSH_PORT=22223 ./scripts/flatpak-dev
```
