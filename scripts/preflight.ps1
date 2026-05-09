$ErrorActionPreference = "Stop"

function Write-Step($message) {
  Write-Host "==> $message" -ForegroundColor Cyan
}

function Test-CommandExists($name) {
  return [bool](Get-Command $name -ErrorAction SilentlyContinue)
}

$root = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $root

Write-Step "Checando comandos locais"
foreach ($cmd in @("node", "npm.cmd", "npx.cmd", "py")) {
  if (-not (Test-CommandExists $cmd)) {
    throw "Comando obrigatorio nao encontrado: $cmd"
  }
}

Write-Step "Instalando dependencias quando necessario"
if (-not (Test-Path "node_modules")) {
  npm.cmd install
}

Write-Step "Validando sintaxe e configuracoes"
npm.cmd run check

Write-Step "Rodando smoke test local"
npm.cmd run smoke

Write-Step "Checando Firebase CLI"
npx.cmd firebase --version | Out-Host
$firebaseLogin = & npx.cmd firebase login:list 2>$null
if ($LASTEXITCODE -ne 0 -or -not ($firebaseLogin -match "@")) {
  Write-Warning "Firebase CLI nao parece estar logado. Rode: npx.cmd firebase login"
} else {
  Write-Host $firebaseLogin
}

Write-Step "Preflight finalizado"
