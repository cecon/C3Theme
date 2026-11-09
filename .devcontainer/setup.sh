#!/usr/bin/env bash
# Roda uma vez, quando o codespace é criado: dependências e build do backend de exemplo.
set -euo pipefail
pnpm install --frozen-lockfile
cargo build -p c3-example
