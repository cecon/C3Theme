#!/usr/bin/env bash
# Sobe backend e shell em segundo plano (idempotente: não duplica se já estiverem no ar).
set -euo pipefail
cd "$(dirname "$0")/.."

if ! curl -sf http://127.0.0.1:3001/api/_meta/app >/dev/null; then
  DATABASE_URL=sqlite://demo.db PORT=3001 setsid nohup cargo run -q -p c3-example >/tmp/c3-api.log 2>&1 </dev/null &
  for _ in $(seq 1 120); do curl -sf http://127.0.0.1:3001/api/_meta/app >/dev/null && break; sleep 1; done
  node scripts/seed-demo.mjs http://127.0.0.1:3001/api
fi

if ! curl -sf http://127.0.0.1:5173/ >/dev/null; then
  C3_API=http://127.0.0.1:3001 setsid nohup pnpm dev:engine >/tmp/c3-web.log 2>&1 </dev/null &
fi

echo "Demo do motor: aba Ports, porta 5173 (logs em /tmp/c3-api.log e /tmp/c3-web.log)"
