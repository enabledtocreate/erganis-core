# Local development setup. Run from core repo root (erganis-core).

$ErrorActionPreference = "Stop"

Write-Host "Setting up Erganis Core local development..." -ForegroundColor Cyan

$composeFile = "infrastructure/docker/docker-compose.yml"
if ((Get-Command docker -ErrorAction SilentlyContinue) -and (Test-Path $composeFile)) {
    Write-Host "Starting PostgreSQL via Docker (optional)..."
    docker compose -f $composeFile up -d postgres
    Start-Sleep -Seconds 3
} else {
    Write-Host "Ensure PostgreSQL is running (native or Docker)."
}

@("contracts", "packages/typescript", "services") | ForEach-Object {
    if (Test-Path "$_/package.json") {
        Write-Host "Installing dependencies in $_..."
        Push-Location $_
        npm install
        Pop-Location
    }
}

Write-Host "Setup complete." -ForegroundColor Green
Write-Host "  - Postgres: localhost:5432 (db erganis)"
Write-Host "  - Core API: cd services && npm run start:dev (port 5000)"
Write-Host "  - Jobs: pg-boss (PostgreSQL)."
