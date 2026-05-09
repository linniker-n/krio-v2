param(
  [Parameter(Mandatory = $true)] [string] $Uid,
  [Parameter(Mandatory = $true)] [string] $AgencyName,
  [string] $OwnerName = "Owner",
  [string] $OwnerEmail = "",
  [string] $TenantId = "",
  [string] $ProjectId = "krio-app-fe0c3"
)

$ErrorActionPreference = "Stop"

function ConvertTo-Slug($text) {
  $normalized = $text.Normalize([Text.NormalizationForm]::FormD)
  $builder = New-Object Text.StringBuilder
  foreach ($char in $normalized.ToCharArray()) {
    $category = [Globalization.CharUnicodeInfo]::GetUnicodeCategory($char)
    if ($category -ne [Globalization.UnicodeCategory]::NonSpacingMark) {
      [void] $builder.Append($char)
    }
  }
  $slug = $builder.ToString().Normalize([Text.NormalizationForm]::FormC).ToLowerInvariant()
  $slug = [Regex]::Replace($slug, "[^a-z0-9]+", "-").Trim("-")
  if ([string]::IsNullOrWhiteSpace($slug)) { return "cliente" }
  return $slug.Substring(0, [Math]::Min(42, $slug.Length))
}

function Invoke-Firebase($arguments) {
  & npx.cmd firebase @arguments
  if ($LASTEXITCODE -ne 0) {
    throw "Firebase CLI falhou: firebase $($arguments -join ' ')"
  }
}

$root = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $root

if ([string]::IsNullOrWhiteSpace($TenantId)) {
  $suffix = [Guid]::NewGuid().ToString("N").Substring(0, 8)
  $TenantId = "tenant_$(ConvertTo-Slug $AgencyName)_$suffix"
}

$now = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
$ownerDisplayName = if ([string]::IsNullOrWhiteSpace($OwnerName)) { "Owner" } else { $OwnerName }

$profiles = @{}
$profiles[$Uid] = @{
  id = $Uid
  name = $ownerDisplayName
  role = "Owner"
  color = "#3B82F6"
  authUid = $Uid
  createdAt = $now
}

$tenant = @{
  meta = @{
    name = $AgencyName
    slug = ConvertTo-Slug $AgencyName
    plan = "manual_license"
    licenseStatus = "active"
    licenseType = "direct_sale"
    licenseActivatedAt = $now
    billingStatus = "manual_license"
    status = "active"
    createdAt = $now
    ownerUid = $Uid
  }
  billing = @{
    status = "manual_license"
    provider = "manual"
    activatedAt = $now
  }
  brand = @{
    name = "Krio"
    primary = "#3B82F6"
    accent = "#60A5FA"
  }
  settings = @{
    timezone = "America/Sao_Paulo"
    locale = "pt-BR"
  }
  profiles = $profiles
  tracker = @{
    weeks = @()
    trash = @()
  }
  approval = @{
    clients = @{}
  }
  planning = @{}
  clients = @{}
}

$membership = @{
  role = "owner"
  status = "active"
  createdAt = $now
  licenseType = "direct_sale"
}

$accessUpdate = @{
  status = "approved"
  tenantId = $TenantId
  approvedAt = $now
  updatedAt = $now
  agencyName = $AgencyName
  ownerEmail = $OwnerEmail
}

$tempDir = Join-Path ([IO.Path]::GetTempPath()) "krio-access-$([Guid]::NewGuid().ToString('N'))"
New-Item -ItemType Directory -LiteralPath $tempDir | Out-Null

try {
  $tenantFile = Join-Path $tempDir "tenant.json"
  $membershipFile = Join-Path $tempDir "membership.json"
  $requestFile = Join-Path $tempDir "request.json"

  $tenant | ConvertTo-Json -Depth 24 | Set-Content -LiteralPath $tenantFile -Encoding UTF8
  $membership | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $membershipFile -Encoding UTF8
  $accessUpdate | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $requestFile -Encoding UTF8

  Write-Host "Criando workspace $TenantId..." -ForegroundColor Cyan
  Invoke-Firebase -arguments @("database:set", "/tenants/$TenantId", $tenantFile, "--project", $ProjectId, "--force")

  Write-Host "Liberando acesso para $Uid..." -ForegroundColor Cyan
  Invoke-Firebase -arguments @("database:set", "/memberships/$Uid/$TenantId", $membershipFile, "--project", $ProjectId, "--force")

  Write-Host "Atualizando solicitacao de acesso..." -ForegroundColor Cyan
  Invoke-Firebase -arguments @("database:update", "/accessRequests/$Uid", $requestFile, "--project", $ProjectId, "--force")

  Write-Host "Acesso liberado." -ForegroundColor Green
  Write-Host "Tenant: $TenantId"
  Write-Host "UID:    $Uid"
} finally {
  Remove-Item -LiteralPath $tempDir -Recurse -Force -ErrorAction SilentlyContinue
}
