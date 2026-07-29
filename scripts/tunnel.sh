#!/usr/bin/env bash
set -euo pipefail

profile="conjunta3p"

minikube status -p "$profile" >/dev/null
kubectl config use-context "$profile" >/dev/null
[[ "$(kubectl config current-context)" == "$profile" ]] || {
  echo "Contexto inseguro: se esperaba '$profile'." >&2
  exit 1
}

echo "Iniciando el túnel de CavaLocal."
echo "Esta terminal debe permanecer abierta. Para detenerlo usa Ctrl+C."
echo "Acceso: http://conjunta3p.espe.edu.ec/"
exec minikube tunnel -p "$profile"
