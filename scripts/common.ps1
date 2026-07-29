$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$script:CavaLocalProfile = 'conjunta3p'
$script:CavaLocalNamespace = 'cavalocal'
$script:CavaLocalRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path

function Assert-CavaLocalCommand {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Name
    )

    if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
        throw "No se encontró '$Name' en PATH."
    }
}

function Invoke-CavaLocalCommand {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Command,

        [Parameter()]
        [string[]]$Arguments = @()
    )

    & $Command @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "Falló el comando: $Command $($Arguments -join ' ')"
    }
}

function Assert-CavaLocalTools {
    Assert-CavaLocalCommand -Name 'docker'
    Assert-CavaLocalCommand -Name 'minikube'
    Assert-CavaLocalCommand -Name 'kubectl'
}

function Set-CavaLocalContext {
    Invoke-CavaLocalCommand -Command 'kubectl' -Arguments @(
        'config', 'use-context', $script:CavaLocalProfile
    )

    $currentContext = [string](& kubectl config current-context)
    if ($LASTEXITCODE -ne 0 -or $currentContext.Trim() -ne $script:CavaLocalProfile) {
        throw "Contexto inseguro: se esperaba '$script:CavaLocalProfile'."
    }
}

function Assert-CavaLocalContext {
    $currentContext = [string](& kubectl config current-context 2>$null)
    if ($LASTEXITCODE -ne 0 -or $currentContext.Trim() -ne $script:CavaLocalProfile) {
        throw "Contexto inseguro: se esperaba '$script:CavaLocalProfile'. Ejecuta kubectl config use-context $script:CavaLocalProfile."
    }
}

function Test-CavaLocalAdministrator {
    $identity = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = [Security.Principal.WindowsPrincipal]::new($identity)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}
