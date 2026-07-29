[CmdletBinding()]
param()

. (Join-Path $PSScriptRoot 'common.ps1')

Assert-CavaLocalTools

& docker info *> $null
if ($LASTEXITCODE -ne 0) {
    throw 'Docker Desktop no está iniciado o el motor Docker no responde.'
}

$hostState = [string](& minikube status -p $script:CavaLocalProfile --format '{{.Host}}' 2>$null)
if ($hostState.Trim() -ne 'Running') {
    Write-Host "Iniciando el perfil aislado '$script:CavaLocalProfile' con Docker Desktop..."
    Invoke-CavaLocalCommand -Command 'minikube' -Arguments @(
        'start',
        '-p', $script:CavaLocalProfile,
        '--driver=docker',
        '--cpus=4',
        '--memory=6144'
    )
}

Set-CavaLocalContext
Invoke-CavaLocalCommand -Command 'minikube' -Arguments @(
    'addons', 'enable', 'ingress', '-p', $script:CavaLocalProfile
)

$images = @(
    @{ Name = 'cavalocal-backend:local'; Path = 'backend' },
    @{ Name = 'cavalocal-audit:local'; Path = 'audit-service' },
    @{ Name = 'cavalocal-dashboard:local'; Path = 'dashboard' },
    @{ Name = 'cavalocal-web:local'; Path = 'web' }
)

Write-Host "Construyendo imágenes dentro de '$script:CavaLocalProfile'..."
foreach ($image in $images) {
    $sourcePath = Join-Path $script:CavaLocalRoot $image.Path
    Invoke-CavaLocalCommand -Command 'minikube' -Arguments @(
        'image', 'build',
        '-p', $script:CavaLocalProfile,
        '-t', $image.Name,
        $sourcePath
    )
}

$availableImages = @(& minikube image ls -p $script:CavaLocalProfile)
if ($LASTEXITCODE -ne 0) {
    throw "No se pudieron consultar las imágenes de '$script:CavaLocalProfile'."
}

foreach ($image in $images) {
    $expected = "docker.io/library/$($image.Name)"
    if ($availableImages -notcontains $expected) {
        throw "La imagen requerida '$($image.Name)' no quedó disponible."
    }
}

Write-Host "Imágenes listas en el perfil '$script:CavaLocalProfile'."
