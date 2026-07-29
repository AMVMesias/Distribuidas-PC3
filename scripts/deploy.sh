#!/usr/bin/env bash
set -euo pipefail

profile="conjunta3p"
namespace="cavalocal"
project_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

"$project_dir/scripts/build.sh"

kubectl config use-context "$profile" >/dev/null
[[ "$(kubectl config current-context)" == "$profile" ]] || {
  echo "Contexto inseguro: se esperaba '$profile'." >&2
  exit 1
}

kubectl apply -f "$project_dir/k8s/"
kubectl rollout status statefulset/postgres -n "$namespace" --timeout=240s
kubectl rollout status statefulset/rabbitmq -n "$namespace" --timeout=240s
kubectl rollout status deployment/backend -n "$namespace" --timeout=300s
kubectl rollout status deployment/audit-service -n "$namespace" --timeout=300s
kubectl rollout status deployment/dashboard -n "$namespace" --timeout=180s
kubectl rollout status deployment/frontend -n "$namespace" --timeout=180s
kubectl wait --for=condition=complete job/backend-seed -n "$namespace" --timeout=300s

cluster_ip="$(minikube ip -p "$profile")"
echo
echo "CavaLocal está desplegado."
echo "IP del perfil: $cluster_ip"
echo "Para acceder sin escribir un puerto:"
echo "  1. Configura en Windows: 127.0.0.1 conjunta3p.espe.edu.ec"
echo "  2. Ejecuta en otra terminal: ./scripts/tunnel.sh"
echo "Dashboard: http://conjunta3p.espe.edu.ec/dashboard/"
