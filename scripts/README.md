# Scripts de despliegue

Elige una sola carpeta según el sistema donde se ejecutará Minikube:

```text
scripts/
├── windows/     PowerShell nativo + Docker Desktop
└── wsl-linux/   WSL Ubuntu o Linux
```

No mezcles comandos entre las dos carpetas. Ambos flujos trabajan exclusivamente con el perfil Minikube `conjunta3p`.

## Qué ejecuta realmente cada comando

`deploy.ps1` y `deploy.sh` son los comandos de instalación completa. Internamente realizan:

```text
deploy
├── llama a build
│   └── crea las cuatro imágenes propias dentro de conjunta3p
├── ejecuta kubectl apply -f k8s/
└── espera que los pods y el Job estén listos
```

En cambio:

```bash
kubectl --context conjunta3p apply -f k8s/
```

solo crea o actualiza los recursos descritos en los YAML. No ejecuta `build.ps1`, `build.sh` ni ningún otro archivo de esta carpeta.

Por eso, en una computadora nueva siempre comienza con el script `deploy` correspondiente al sistema operativo.

## Windows con Docker Desktop, sin WSL

Abre PowerShell en la raíz del proyecto:

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\scripts\windows\deploy.ps1
```

Después abre otra PowerShell como administrador:

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\scripts\windows\tunnel.ps1 -ConfigureHosts
```

Mantén la segunda ventana abierta. El dashboard estará en:

```text
http://conjunta3p.espe.edu.ec/dashboard/
```

Scripts disponibles:

| Script | Función |
|---|---|
| `build.ps1` | Inicia únicamente `conjunta3p`, habilita Ingress y construye imágenes. |
| `deploy.ps1` | Ejecuta el build, aplica `k8s/` y espera los rollouts. |
| `status.ps1` | Muestra solamente los recursos de `conjunta3p/cavalocal`. |
| `tunnel.ps1` | Expone HTTP/HTTPS; con `-ConfigureHosts` configura el dominio local. |
| `configure-hosts.ps1` | Actualiza únicamente la entrada `conjunta3p.espe.edu.ec`. |
| `destroy.ps1` | Elimina solamente `conjunta3p` y exige el nombre exacto. |

## WSL Ubuntu o Linux

Abre una terminal en la raíz del proyecto:

```bash
chmod +x scripts/wsl-linux/*.sh
./scripts/wsl-linux/deploy.sh
```

En otra terminal:

```bash
./scripts/wsl-linux/tunnel.sh
```

En el archivo `hosts` de Windows debe existir:

```text
127.0.0.1   conjunta3p.espe.edu.ec
```

Scripts disponibles:

| Script | Función |
|---|---|
| `build.sh` | Inicia únicamente `conjunta3p`, habilita Ingress y construye imágenes. |
| `deploy.sh` | Ejecuta el build, aplica `k8s/` y espera los rollouts. |
| `status.sh` | Muestra solamente los recursos de `conjunta3p/cavalocal`. |
| `tunnel.sh` | Inicia `minikube tunnel` para el perfil aislado. |
| `smoke-test.sh` | Verifica frontend, backend, dashboard y auditoría. |
| `resilience-test.sh` | Comprueba la tolerancia temporal a la caída de RabbitMQ. |
| `access-windows.sh` | Puente alternativo por el puerto 8080 si el túnel no es visible desde Windows. |
| `stop-windows-access.sh` | Detiene el puente alternativo. |
| `destroy.sh` | Elimina solamente `conjunta3p` y exige el nombre exacto. |

## Aplicar únicamente los manifiestos

Este comando se puede usar después de construir las imágenes al menos una vez, siempre que el perfil `conjunta3p` siga existiendo:

```bash
kubectl --context conjunta3p apply -f k8s/
```

Las imágenes propias requeridas son:

```text
cavalocal-backend:local
cavalocal-audit:local
cavalocal-dashboard:local
cavalocal-web:local
```

En una computadora nueva usa primero `deploy.ps1` o `deploy.sh`; `kubectl apply` no construye esas imágenes locales.
