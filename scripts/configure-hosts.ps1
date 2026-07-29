[CmdletBinding()]
param(
    [Parameter()]
    [string]$Address = '127.0.0.1'
)

. (Join-Path $PSScriptRoot 'common.ps1')

if (-not (Test-CavaLocalAdministrator)) {
    throw 'Abre PowerShell como administrador para modificar el archivo hosts de Windows.'
}

$parsedAddress = $null
if (-not [Net.IPAddress]::TryParse($Address, [ref]$parsedAddress)) {
    throw "'$Address' no es una dirección IP válida."
}

$hostName = 'conjunta3p.espe.edu.ec'
$hostsPath = Join-Path $env:SystemRoot 'System32\drivers\etc\hosts'
$originalLines = [IO.File]::ReadAllLines($hostsPath)
$updatedLines = [Collections.Generic.List[string]]::new()

foreach ($line in $originalLines) {
    $trimmed = $line.Trim()
    if ($trimmed.Length -eq 0 -or $trimmed.StartsWith('#')) {
        $updatedLines.Add($line)
        continue
    }

    $contentAndComment = $line -split '#', 2
    $tokens = @($contentAndComment[0] -split '\s+' | Where-Object { $_ })
    if ($tokens.Count -lt 2 -or $tokens[1..($tokens.Count - 1)] -notcontains $hostName) {
        $updatedLines.Add($line)
        continue
    }

    $remainingAliases = @($tokens[1..($tokens.Count - 1)] | Where-Object { $_ -ne $hostName })
    if ($remainingAliases.Count -gt 0) {
        $preservedLine = "$($tokens[0])`t$($remainingAliases -join ' ')"
        if ($contentAndComment.Count -eq 2) {
            $preservedLine += " #$($contentAndComment[1])"
        }
        $updatedLines.Add($preservedLine)
    }
}

$updatedLines.Add("$Address`t$hostName # CavaLocal conjunta3p")
$utf8WithoutBom = [Text.UTF8Encoding]::new($false)
[IO.File]::WriteAllLines($hostsPath, $updatedLines, $utf8WithoutBom)

& ipconfig.exe /flushdns *> $null
Write-Host "Hosts actualizado: $Address $hostName"
