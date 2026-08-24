# Mixamp

Mixamp is a small GTKX app for trying GTK 4, libadwaita, and WirePlumber while developing entirely inside a Flatpak SDK.

## Development

The host needs:

- VS Code with Remote - SSH
- Flatpak and flatpak-builder
- `ssh`, `ssh-keygen`, and `ss`

Start the development environment from a host terminal:

```sh
./scripts/flatpak-dev
```

On the first run, add the `Include` line printed by the launcher near the top of your host `~/.ssh/config`, before any broad `Host *` block. In VS Code, connect to `mixamp-flatpak` with Remote-SSH and open the repository path printed by the launcher.

Inside the remote VS Code window:

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Use `pnpm check` to run code generation, type checking, and tests.

Keep the launcher terminal open while developing. Press Ctrl+C or close the terminal to stop the SSH server and Flatpak sandbox. The launcher builds directly into `.flatpak-dev` and does not install Mixamp.

If port `22222` is occupied, choose another one when starting the launcher:

```sh
MIXAMP_DEV_SSH_PORT=22223 ./scripts/flatpak-dev
```
