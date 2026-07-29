[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [ValidateSet('conjunta3p')]
    [string]$Profile
)

. (Join-Path $PSScriptRoot 'common.ps1')

if ($Profile -cne $script:CavaLocalProfile) {
    throw "Operación cancelada: solo se permite eliminar '$script:CavaLocalProfile'."
}

Assert-CavaLocalCommand -Name 'minikube'

Write-Host "Eliminando exclusivamente el perfil '$script:CavaLocalProfile'..."
Invoke-CavaLocalCommand -Command 'minikube' -Arguments @(
    'delete', '-p', $script:CavaLocalProfile
)
Write-Host "Perfil '$script:CavaLocalProfile' eliminado. Ningún otro perfil fue modificado."
