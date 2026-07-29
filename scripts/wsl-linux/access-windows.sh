#!/usr/bin/env bash
set -euo pipefail

profile="conjunta3p"
local_port="${CAVALOCAL_WINDOWS_PORT:-8080}"
pid_file="/tmp/cavalocal-ingress-forward.pid"
log_file="/tmp/cavalocal-ingress-forward.log"

kubectl --context "$profile" get namespace ingress-nginx >/dev/null

if [[ -f "$pid_file" ]]; then
  existing_pid="$(cat "$pid_file")"
  if kill -0 "$existing_pid" 2>/dev/null; then
    echo "El acceso desde Windows ya está activo (PID $existing_pid)."
    echo "Hosts: 127.0.0.1 conjunta3p.espe.edu.ec"
    echo "Dashboard: http://conjunta3p.espe.edu.ec:$local_port/dashboard/"
    exit 0
  fi
fi

nohup kubectl --context "$profile" \
  port-forward \
  --namespace ingress-nginx \
  --address 0.0.0.0 \
  service/ingress-nginx-controller \
  "$local_port:80" >"$log_file" 2>&1 &
forward_pid=$!
echo "$forward_pid" >"$pid_file"
sleep 2

if ! kill -0 "$forward_pid" 2>/dev/null; then
  cat "$log_file" >&2
  exit 1
fi

echo "Puente WSL → Ingress activo (PID $forward_pid)."
echo "Configura en Windows: 127.0.0.1 conjunta3p.espe.edu.ec"
echo "Dashboard: http://conjunta3p.espe.edu.ec:$local_port/dashboard/"
