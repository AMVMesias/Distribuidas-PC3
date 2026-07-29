[CmdletBinding()]
param()

. (Join-Path $PSScriptRoot 'common.ps1')

Assert-CavaLocalCommand -Name 'minikube'
Assert-CavaLocalCommand -Name 'kubectl'

Invoke-CavaLocalCommand -Command 'minikube' -Arguments @(
    'status', '-p', $script:CavaLocalProfile
)

$contexts = @(& kubectl config get-contexts -o name)
if ($LASTEXITCODE -ne 0 -or $contexts -notcontains $script:CavaLocalProfile) {
    throw "No existe el contexto '$script:CavaLocalProfile'."
}

Invoke-CavaLocalCommand -Command 'kubectl' -Arguments @(
    '--context', $script:CavaLocalProfile,
    'get', 'pods,services,ingress,pvc,jobs',
    '-n', $script:CavaLocalNamespace
)
