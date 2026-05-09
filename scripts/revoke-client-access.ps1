param(
  [Parameter(Mandatory = $true)] [string] $Uid,
  [Parameter(Mandatory = $true)] [string] $TenantId,
  [string] $ProjectId = "krio-app-fe0c3"
)

$ErrorActionPreference = "Stop"

function Invoke-Firebase($arguments) {
  & npx.cmd firebase @arguments
  if ($LASTEXITCODE -ne 0) {
    throw "Firebase CLI falhou: firebase $($arguments -join ' ')"
  }
}

$root = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $root

$now = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
$membershipUpdate = @{
  status = "revoked"
  revokedAt = $now
}
$tenantMetaUpdate = @{
  status = "revoked"
  licenseStatus = "revoked"
  revokedAt = $now
}

$tempDir = Join-Path ([IO.Path]::GetTempPath()) "krio-revoke-$([Guid]::NewGuid().ToString('N'))"
New-Item -ItemType Directory -LiteralPath $tempDir | Out-Null

try {
  $membershipFile = Join-Path $tempDir "membership.json"
  $tenantMetaFile = Join-Path $tempDir "tenant-meta.json"
  $membershipUpdate | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $membershipFile -Encoding UTF8
  $tenantMetaUpdate | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $tenantMetaFile -Encoding UTF8

  Write-Host "Revogando acesso do UID $Uid no tenant $TenantId..." -ForegroundColor Cyan
  Invoke-Firebase -arguments @("database:update", "/memberships/$Uid/$TenantId", $membershipFile, "--project", $ProjectId, "--force")
  Invoke-Firebase -arguments @("database:update", "/tenants/$TenantId/meta", $tenantMetaFile, "--project", $ProjectId, "--force")
  Write-Host "Acesso revogado." -ForegroundColor Green
} finally {
  Remove-Item -LiteralPath $tempDir -Recurse -Force -ErrorAction SilentlyContinue
}
