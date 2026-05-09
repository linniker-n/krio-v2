param(
  [string] $ProjectId = "krio-app-fe0c3"
)

$ErrorActionPreference = "Stop"
$root = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $root

Write-Host "Solicitacoes de acesso registradas:" -ForegroundColor Cyan
npx.cmd firebase database:get "/accessRequests" --project $ProjectId
