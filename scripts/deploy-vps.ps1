$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $PSScriptRoot
$HostName = '163.61.72.159'
$Port = 22
$User = 'root'
$RemoteDir = '/opt/newgreen'
$IdentityFile = Join-Path $env:USERPROFILE '.ssh\newgreen_deploy_ed25519'
$Archive = Join-Path $env:TEMP ("newgreen-{0}.tar.gz" -f (Get-Date -Format 'yyyyMMddHHmmss'))

if (-not (Test-Path $IdentityFile)) {
  throw "Khong tim thay SSH deployment key: $IdentityFile"
}

try {
  Push-Location $Root
  Write-Host '[DEPLOY] Packaging source...'
  tar.exe -czf $Archive --exclude=.git --exclude=.next --exclude=node_modules --exclude=.env --exclude=uploads --exclude='*.log' .
  if ($LASTEXITCODE -ne 0) { throw 'Khong the dong goi source.' }

  Write-Host '[DEPLOY] Checking SSH key connection...'
  ssh -i $IdentityFile -o IdentitiesOnly=yes -o BatchMode=yes -o ConnectTimeout=10 -p $Port "$User@$HostName" "mkdir -p $RemoteDir && test -f $RemoteDir/.env"
  if ($LASTEXITCODE -ne 0) { throw "SSH key chua san sang hoac VPS chua co $RemoteDir/.env." }

  Write-Host '[DEPLOY] Uploading source...'
  scp -i $IdentityFile -o IdentitiesOnly=yes -o BatchMode=yes -P $Port $Archive "${User}@${HostName}:/tmp/newgreen-release.tar.gz"
  if ($LASTEXITCODE -ne 0) { throw 'Tai source len VPS that bai.' }

  Write-Host '[DEPLOY] Building and restarting Docker services...'
  ssh -i $IdentityFile -o IdentitiesOnly=yes -o BatchMode=yes -p $Port "$User@$HostName" "set -e; cd $RemoteDir; find . -mindepth 1 -maxdepth 1 ! -name .env ! -name uploads -exec rm -rf {} +; tar -xzf /tmp/newgreen-release.tar.gz; rm /tmp/newgreen-release.tar.gz; docker compose up -d --build --remove-orphans; docker compose ps; sleep 5; curl -fsS http://127.0.0.1:3000/ >/dev/null"
  if ($LASTEXITCODE -ne 0) { throw 'Khoi dong hoac health check tren VPS that bai.' }

  Write-Host "[OK] Deployed successfully: http://$HostName`:3000"
} finally {
  Pop-Location
  Remove-Item $Archive -Force -ErrorAction SilentlyContinue
}
