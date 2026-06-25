<#
.SYNOPSIS
    Genera lo ZIP dell'estensione pronto per l'upload su addons.opera.com.

.DESCRIPTION
    Usa un'allowlist: copia SOLO i file necessari al funzionamento
    dell'estensione, escludendo per costruzione tutto il resto
    (.git, .claude, CLAUDE.md, README, script di build, settings con API key...).

    Il nome dello ZIP include la versione letta da manifest.json.
    L'output finisce in dist/ (gia' in .gitignore).

.EXAMPLE
    .\package.ps1
#>

[CmdletBinding()]
param(
    [string]$OutDir = "dist"
)

$ErrorActionPreference = "Stop"
$root = $PSScriptRoot

# File e cartelle da includere nel pacchetto (allowlist).
$include = @(
    "manifest.json",
    "background.js",
    "content.js",
    "LICENSE",
    "icons",
    "options",
    "sidebar"
)

# Versione dal manifest, per il nome del file.
$manifest = Get-Content (Join-Path $root "manifest.json") -Raw | ConvertFrom-Json
$version  = $manifest.version
$name     = "claude-for-opera-gx-$version.zip"

# Staging pulito in una cartella temporanea, poi zip.
$outPath  = Join-Path $root $OutDir
$staging  = Join-Path $outPath "_staging"
$zipPath  = Join-Path $outPath $name

if (Test-Path $staging) { Remove-Item $staging -Recurse -Force }
if (Test-Path $zipPath) { Remove-Item $zipPath -Force }
New-Item -ItemType Directory -Force -Path $staging | Out-Null

foreach ($item in $include) {
    $src = Join-Path $root $item
    if (-not (Test-Path $src)) {
        Write-Warning "Manca '$item' — lo salto."
        continue
    }
    Copy-Item $src -Destination $staging -Recurse -Force
}

# Crea lo ZIP con i file alla radice dell'archivio (requisito Opera).
Compress-Archive -Path (Join-Path $staging "*") -DestinationPath $zipPath -Force
Remove-Item $staging -Recurse -Force

$sizeKB = [math]::Round((Get-Item $zipPath).Length / 1KB, 1)
Write-Host ""
Write-Host "OK  Pacchetto creato:" -ForegroundColor Green
Write-Host "    $zipPath  ($sizeKB KB)"
Write-Host ""
Write-Host "Carica questo file su https://addons.opera.com/developer/"
