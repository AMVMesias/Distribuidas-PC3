#!/usr/bin/env bash
set -euo pipefail

profile="conjunta3p"

if [[ "${1:-}" != "$profile" ]]; then
  echo "Operación cancelada. Para eliminar el clúster aislado ejecuta:" >&2
  echo "  ./scripts/destroy.sh $profile" >&2
  exit 1
fi

echo "Eliminando exclusivamente el perfil '$profile'..."
minikube delete -p "$profile"
echo "Perfil '$profile' eliminado. Ningún otro perfil fue modificado."
