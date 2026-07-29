#!/usr/bin/env bash
set -euo pipefail

profile="conjunta3p"
namespace="cavalocal"
host_name="conjunta3p.espe.edu.ec"
cluster_ip="$(minikube ip -p "$profile")"
base_url="http://$cluster_ip"
host_header="Host: $host_name"
restored=false

restore_rabbitmq() {
  if [[ "$restored" != true ]]; then
    kubectl --context "$profile" scale statefulset/rabbitmq -n "$namespace" --replicas=1 >/dev/null
  fi
}
trap restore_rabbitmq EXIT

echo "Deteniendo RabbitMQ temporalmente..."
kubectl --context "$profile" scale statefulset/rabbitmq -n "$namespace" --replicas=0 >/dev/null
kubectl --context "$profile" wait --for=delete pod/rabbitmq-0 -n "$namespace" --timeout=120s
sleep 3

email="buffer-$(date +%s)@example.com"
echo "Registrando $email con RabbitMQ detenido..."
curl -fsS \
  -X POST \
  -H "$host_header" \
  -H "Content-Type: application/json" \
  "$base_url/api/auth/register" \
  --data "{\"name\":\"Prueba Buffer\",\"email\":\"$email\",\"password\":\"Segura123\"}" >/dev/null
echo "El backend aceptó la escritura."

echo "Restaurando RabbitMQ..."
kubectl --context "$profile" scale statefulset/rabbitmq -n "$namespace" --replicas=1 >/dev/null
kubectl --context "$profile" rollout status statefulset/rabbitmq -n "$namespace" --timeout=240s
restored=true

for _ in $(seq 1 30); do
  response="$(curl -fsS -H "$host_header" \
    "$base_url/api/audit?entity=user&action=create&user=$email" 2>/dev/null || true)"
  if grep -q '"total":1' <<<"$response"; then
    echo "Evento recuperado desde el búfer y persistido exactamente una vez."
    exit 0
  fi
  sleep 2
done

echo "El evento no apareció después de restaurar RabbitMQ." >&2
exit 1
