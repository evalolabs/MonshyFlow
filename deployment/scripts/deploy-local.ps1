# Deployment Script für lokalen Build und Push zu Docker Hub (PowerShell)
# Verwendung: .\deploy-local.ps1 [version-tag]
# Führe aus: cd deployment\scripts && .\deploy-local.ps1

param(
    [string]$Version = "latest",
    [string]$DockerUsername = $env:DOCKER_USERNAME
)

$ErrorActionPreference = "Stop"

# Script-Verzeichnis
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Join-Path $ScriptDir "..\.."

# Farben für Output
function Write-ColorOutput($ForegroundColor) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    if ($args) {
        Write-Output $args
    }
    $host.UI.RawUI.ForegroundColor = $fc
}

Write-ColorOutput Cyan "🚀 MonshyFlow Deployment Script"
Write-ColorOutput Cyan "==============================="
Write-Output ""

# Prüfe ob Docker Hub Username gesetzt ist
if (-not $DockerUsername -or $DockerUsername -eq "your-dockerhub-username") {
    Write-ColorOutput Yellow "⚠️  WARNUNG: DOCKER_USERNAME nicht gesetzt!"
    Write-Output "Setze DOCKER_USERNAME Environment-Variable:"
    Write-Output "  `$env:DOCKER_USERNAME = 'dein-username'"
    Write-Output "Oder übergebe als Parameter: -DockerUsername 'dein-username'"
    exit 1
}

Write-ColorOutput Green "📦 Baue Frontend Image..."
Set-Location "$ProjectRoot\frontend"
docker build -t "${DockerUsername}/monshyflow-frontend:${Version}" --build-arg VITE_API_URL=/api .
docker tag "${DockerUsername}/monshyflow-frontend:${Version}" "${DockerUsername}/monshyflow-frontend:latest"
Write-ColorOutput Green "✅ Frontend Image gebaut"
Write-Output ""

Write-ColorOutput Green "📦 Baue API Service Image..."
Set-Location $ProjectRoot
docker build -t "${DockerUsername}/monshyflow-api-service:${Version}" -f packages\api-service\Dockerfile .
docker tag "${DockerUsername}/monshyflow-api-service:${Version}" "${DockerUsername}/monshyflow-api-service:latest"
Write-ColorOutput Green "✅ API Service Image gebaut"
Write-Output ""

Write-ColorOutput Green "📦 Baue Auth Service Image..."
docker build -t "${DockerUsername}/monshyflow-auth-service:${Version}" -f packages\auth-service\Dockerfile .
docker tag "${DockerUsername}/monshyflow-auth-service:${Version}" "${DockerUsername}/monshyflow-auth-service:latest"
Write-ColorOutput Green "✅ Auth Service Image gebaut"
Write-Output ""

Write-ColorOutput Green "📦 Baue Secrets Service Image..."
docker build -t "${DockerUsername}/monshyflow-secrets-service:${Version}" -f packages\secrets-service\Dockerfile .
docker tag "${DockerUsername}/monshyflow-secrets-service:${Version}" "${DockerUsername}/monshyflow-secrets-service:latest"
Write-ColorOutput Green "✅ Secrets Service Image gebaut"
Write-Output ""

Write-ColorOutput Green "📦 Baue Execution Service Image..."
docker build -t "${DockerUsername}/monshyflow-execution-service:${Version}" -f packages\execution-service\Dockerfile .
docker tag "${DockerUsername}/monshyflow-execution-service:${Version}" "${DockerUsername}/monshyflow-execution-service:latest"
Write-ColorOutput Green "✅ Execution Service Image gebaut"
Write-Output ""

Write-ColorOutput Green "📦 Baue Scheduler Service Image..."
docker build -t "${DockerUsername}/monshyflow-scheduler-service:${Version}" -f packages\scheduler-service\Dockerfile .
docker tag "${DockerUsername}/monshyflow-scheduler-service:${Version}" "${DockerUsername}/monshyflow-scheduler-service:latest"
Write-ColorOutput Green "✅ Scheduler Service Image gebaut"
Write-Output ""

Write-ColorOutput Green "📤 Pushe Images zu Docker Hub..."
docker push "${DockerUsername}/monshyflow-frontend:${Version}"
docker push "${DockerUsername}/monshyflow-frontend:latest"
docker push "${DockerUsername}/monshyflow-api-service:${Version}"
docker push "${DockerUsername}/monshyflow-api-service:latest"
docker push "${DockerUsername}/monshyflow-auth-service:${Version}"
docker push "${DockerUsername}/monshyflow-auth-service:latest"
docker push "${DockerUsername}/monshyflow-secrets-service:${Version}"
docker push "${DockerUsername}/monshyflow-secrets-service:latest"
docker push "${DockerUsername}/monshyflow-execution-service:${Version}"
docker push "${DockerUsername}/monshyflow-execution-service:latest"
docker push "${DockerUsername}/monshyflow-scheduler-service:${Version}"
docker push "${DockerUsername}/monshyflow-scheduler-service:latest"
Write-ColorOutput Green "✅ Images zu Docker Hub gepusht"
Write-Output ""

Write-ColorOutput Cyan "🎉 Deployment erfolgreich!"
Write-ColorOutput Cyan "Version: $Version"
Write-Output "Images:"
Write-Output "  - ${DockerUsername}/monshyflow-frontend:${Version}"
Write-Output "  - ${DockerUsername}/monshyflow-api-service:${Version}"
Write-Output "  - ${DockerUsername}/monshyflow-auth-service:${Version}"
Write-Output "  - ${DockerUsername}/monshyflow-secrets-service:${Version}"
Write-Output "  - ${DockerUsername}/monshyflow-execution-service:${Version}"
Write-Output "  - ${DockerUsername}/monshyflow-scheduler-service:${Version}"
Write-Output ""
Write-ColorOutput Yellow "Nächster Schritt: Auf Server deployen mit:"
Write-Output "  ssh deploy@SERVER_IP 'cd ~/monshyflow && deployment/scripts/deploy-server.sh'"

