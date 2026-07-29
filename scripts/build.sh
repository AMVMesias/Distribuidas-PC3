#!/usr/bin/env bash
set -euo pipefail

profile="conjunta3p"
project_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if ! minikube status -p "$profile" >/dev/null 2>&1; then
  echo "Iniciando el perfil aislado '$profile'..."
  minikube start -p "$profile" --driver=docker --cpus=4 --memory=6144
fi

kubectl config use-context "$profile" >/dev/null
[[ "$(kubectl config current-context)" == "$profile" ]] || {
  echo "Contexto inseguro: se esperaba '$profile'." >&2
  exit 1
}

minikube addons enable ingress -p "$profile"

echo "Construyendo imágenes dentro de '$profile'..."
minikube image build -p "$profile" -t cavalocal-backend:local "$project_dir/backend"
minikube image build -p "$profile" -t cavalocal-audit:local "$project_dir/audit-service"
minikube image build -p "$profile" -t cavalocal-dashboard:local "$project_dir/dashboard"
minikube image build -p "$profile" -t cavalocal-web:local "$project_dir/web"

for image in cavalocal-backend:local cavalocal-audit:local cavalocal-dashboard:local cavalocal-web:local; do
  minikube image ls -p "$profile" | grep -Fqx "docker.io/library/$image" || {
    echo "La imagen requerida '$image' no quedó disponible." >&2
    exit 1
  }
done

echo "Imágenes listas en el perfil '$profile'."
