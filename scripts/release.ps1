$ErrorActionPreference = "Stop"

function Write-Step($message) {
  Write-Host "==> $message" -ForegroundColor Cyan
}

function Invoke-Checked($command, $arguments) {
  & $command @arguments
  if ($LASTEXITCODE -ne 0) {
    throw "Comando falhou: $command $($arguments -join ' ')"
  }
}

$root = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $root

Write-Step "Rodando preflight"
Invoke-Checked "powershell" @("-ExecutionPolicy", "Bypass", "-File", "scripts/preflight.ps1")

Write-Step "Verificando login Firebase"
$firebaseLogin = & npx.cmd firebase login:list 2>$null
if ($LASTEXITCODE -ne 0 -or -not ($firebaseLogin -match "@")) {
  throw "Firebase CLI nao esta logado. Rode npx.cmd firebase login e execute npm.cmd run release novamente."
}

Write-Step "Publicando regras do Realtime Database e Storage"
Invoke-Checked "npx.cmd" @("firebase", "deploy", "--only", "database,storage")

Write-Step "Publicando Hosting"
Invoke-Checked "npx.cmd" @("firebase", "deploy", "--only", "hosting")

Write-Step "Release concluido"
