#!/usr/bin/env bash
set -euo pipefail

profile="conjunta3p"
host_name="conjunta3p.espe.edu.ec"
cluster_ip="$(minikube ip -p "$profile")"
base_url="http://$cluster_ip"
host_header="Host: $host_name"
sse_file="$(mktemp)"
trap 'rm -f "$sse_file"' EXIT

echo "--- Backend health ---"
curl -fsS -H "$host_header" "$base_url/api/health/ready"
echo

echo "--- Dashboard y frontend ---"
curl -fsSI -H "$host_header" "$base_url/dashboard/" | head -n 1
curl -fsSI -H "$host_header" "$base_url/" | head -n 1

timeout 10s curl -sN -H "$host_header" "$base_url/api/audit/stream" >"$sse_file" &
sse_pid=$!
sleep 1

email="smoke-$(date +%s)@example.com"
echo "--- Registro de prueba: $email ---"
curl -fsS \
  -X POST \
  -H "$host_header" \
  -H "Content-Type: application/json" \
  "$base_url/api/auth/register" \
  --data "{\"name\":\"Prueba SSE\",\"email\":\"$email\",\"password\":\"Segura123\"}"
echo

wait "$sse_pid" || true
echo "--- Evento recibido por SSE ---"
grep -E "event: (connected|audit)|$email" "$sse_file" | head -n 12

echo "--- Evento persistido y consultado por REST ---"
curl -fsS -H "$host_header" \
  "$base_url/api/audit?entity=user&action=create&user=$email"
echo
