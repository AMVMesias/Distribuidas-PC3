#!/usr/bin/env bash
set -euo pipefail

pid_file="/tmp/cavalocal-ingress-forward.pid"

if [[ ! -f "$pid_file" ]]; then
  echo "No hay un puente de acceso registrado."
  exit 0
fi

forward_pid="$(cat "$pid_file")"
if kill -0 "$forward_pid" 2>/dev/null; then
  kill "$forward_pid"
fi
rm -f "$pid_file"
echo "Puente de acceso desde Windows detenido."
