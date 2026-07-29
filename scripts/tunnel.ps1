[CmdletBinding()]
param(
    [Parameter()]
    [switch]$ConfigureHosts
)

. (Join-Path $PSScriptRoot 'common.ps1')

Assert-CavaLocalCommand -Name 'minikube'
Assert-CavaLocalCommand -Name 'kubectl'

if (-not (Test-CavaLocalAdministrator)) {
    throw 'Abre PowerShell como administrador: el túnel necesita registrar rutas y usar los puertos 80/443.'
}

$hostState = [string](& minikube status -p $script:CavaLocalProfile --format '{{.Host}}' 2>$null)
if ($hostState.Trim() -ne 'Running') {
    throw "El perfil '$script:CavaLocalProfile' no está iniciado. Ejecuta primero .\scripts\deploy.ps1."
}

Set-CavaLocalContext

if ($ConfigureHosts) {
    & (Join-Path $PSScriptRoot 'configure-hosts.ps1') -Address '127.0.0.1'
}

Write-Host 'Iniciando el túnel de CavaLocal.'
Write-Host 'Esta ventana debe permanecer abierta. Para detenerlo usa Ctrl+C.'
Write-Host 'Acceso: http://conjunta3p.espe.edu.ec/'
Invoke-CavaLocalCommand -Command 'minikube' -Arguments @(
    'tunnel', '-p', $script:CavaLocalProfile
)
