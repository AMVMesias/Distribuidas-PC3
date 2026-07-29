#!/usr/bin/env bash
set -euo pipefail

profile="conjunta3p"
namespace="cavalocal"

minikube status -p "$profile"
[[ "$(kubectl config get-contexts -o name | grep -x "$profile" || true)" == "$profile" ]] || {
  echo "No existe el contexto '$profile'." >&2
  exit 1
}
kubectl --context "$profile" get pods,services,ingress,pvc,jobs -n "$namespace"
