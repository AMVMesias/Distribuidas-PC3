[CmdletBinding()]
param()

. (Join-Path $PSScriptRoot 'common.ps1')

& (Join-Path $PSScriptRoot 'build.ps1')
Assert-CavaLocalContext

Invoke-CavaLocalCommand -Command 'kubectl' -Arguments @(
    'apply', '-f', (Join-Path $script:CavaLocalRoot 'k8s')
)

$rollouts = @(
    @{ Resource = 'statefulset/postgres'; Timeout = '240s' },
    @{ Resource = 'statefulset/rabbitmq'; Timeout = '240s' },
    @{ Resource = 'deployment/backend'; Timeout = '300s' },
    @{ Resource = 'deployment/audit-service'; Timeout = '300s' },
    @{ Resource = 'deployment/dashboard'; Timeout = '180s' },
    @{ Resource = 'deployment/frontend'; Timeout = '180s' }
)

foreach ($rollout in $rollouts) {
    Invoke-CavaLocalCommand -Command 'kubectl' -Arguments @(
        '--context', $script:CavaLocalProfile,
        'rollout', 'status', $rollout.Resource,
        '-n', $script:CavaLocalNamespace,
        "--timeout=$($rollout.Timeout)"
    )
}

Invoke-CavaLocalCommand -Command 'kubectl' -Arguments @(
    '--context', $script:CavaLocalProfile,
    'wait', '--for=condition=complete',
    'job/backend-seed',
    '-n', $script:CavaLocalNamespace,
    '--timeout=300s'
)

$clusterIp = [string](& minikube ip -p $script:CavaLocalProfile)
if ($LASTEXITCODE -ne 0) {
    throw "No se pudo obtener la IP de '$script:CavaLocalProfile'."
}

Write-Host ''
Write-Host 'CavaLocal está desplegado.'
Write-Host "IP del perfil: $($clusterIp.Trim())"
Write-Host 'Para acceder sin escribir un puerto, abre PowerShell como administrador y ejecuta:'
Write-Host '  .\scripts\windows\tunnel.ps1 -ConfigureHosts'
Write-Host 'Dashboard: http://conjunta3p.espe.edu.ec/dashboard/'
