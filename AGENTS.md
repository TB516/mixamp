# Mixamp

Mixamp is a GTKX desktop app that provides separate Game and Voice PipeWire sinks through WirePlumber. Both sinks feed the current default audio output, with a Game/Voice balance control planned as the main interaction.

## Flatpak development environment

Use `flatpak-dev` with the [application manifest](flatpak/io.github.TB516.mixamp.yml) and [project profile](flatpak/.profile).

Run development commands from this checkout inside the shared Flatpak SDK sandbox:

```sh
flatpak-dev run -- COMMAND [ARGS...]
```

This includes pnpm, Node, code generation, type checking, formatting, linting, tests, builds, and app commands. Tools that run or modify project code and dependencies belong in the sandbox.

See [development setup](docs/development.md) for SDK requirements and editor connections.
