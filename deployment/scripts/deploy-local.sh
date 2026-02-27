#!/bin/bash
# Deployment Script für lokalen Build und Push zu Docker Hub
# Verwendung: ./deploy-local.sh [version-tag]
# Führe aus: cd deployment/scripts && ./deploy-local.sh

set -e  # Exit on error

# Farben für Output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Script-Verzeichnis
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$SCRIPT_DIR/../.."

# Docker Hub Username (aus Environment oder hier setzen)
DOCKER_USERNAME=${DOCKER_USERNAME:-"your-dockerhub-username"}
VERSION=${1:-"latest"}

echo -e "${BLUE}🚀 MonshyFlow Deployment Script${NC}"
echo -e "${BLUE}===============================${NC}\n"

# Prüfe ob Docker Hub Username gesetzt ist
if [ "$DOCKER_USERNAME" = "your-dockerhub-username" ]; then
    echo -e "${YELLOW}⚠️  WARNUNG: DOCKER_USERNAME nicht gesetzt!${NC}"
    echo "Setze DOCKER_USERNAME Environment-Variable oder ändere das Script."
    echo "Beispiel: export DOCKER_USERNAME=dein-username"
    exit 1
fi

echo -e "${GREEN}📦 Baue Frontend Image...${NC}"
cd "$PROJECT_ROOT/frontend"
docker build -t ${DOCKER_USERNAME}/monshyflow-frontend:${VERSION} --build-arg VITE_API_URL=/api .
docker tag ${DOCKER_USERNAME}/monshyflow-frontend:${VERSION} ${DOCKER_USERNAME}/monshyflow-frontend:latest
echo -e "${GREEN}✅ Frontend Image gebaut${NC}\n"

echo -e "${GREEN}📦 Baue API Service Image...${NC}"
cd "$PROJECT_ROOT"
docker build -t ${DOCKER_USERNAME}/monshyflow-api-service:${VERSION} -f packages/api-service/Dockerfile .
docker tag ${DOCKER_USERNAME}/monshyflow-api-service:${VERSION} ${DOCKER_USERNAME}/monshyflow-api-service:latest
echo -e "${GREEN}✅ API Service Image gebaut${NC}\n"

echo -e "${GREEN}📦 Baue Auth Service Image...${NC}"
docker build -t ${DOCKER_USERNAME}/monshyflow-auth-service:${VERSION} -f packages/auth-service/Dockerfile .
docker tag ${DOCKER_USERNAME}/monshyflow-auth-service:${VERSION} ${DOCKER_USERNAME}/monshyflow-auth-service:latest
echo -e "${GREEN}✅ Auth Service Image gebaut${NC}\n"

echo -e "${GREEN}📦 Baue Secrets Service Image...${NC}"
docker build -t ${DOCKER_USERNAME}/monshyflow-secrets-service:${VERSION} -f packages/secrets-service/Dockerfile .
docker tag ${DOCKER_USERNAME}/monshyflow-secrets-service:${VERSION} ${DOCKER_USERNAME}/monshyflow-secrets-service:latest
echo -e "${GREEN}✅ Secrets Service Image gebaut${NC}\n"

echo -e "${GREEN}📦 Baue Execution Service Image...${NC}"
docker build -t ${DOCKER_USERNAME}/monshyflow-execution-service:${VERSION} -f packages/execution-service/Dockerfile .
docker tag ${DOCKER_USERNAME}/monshyflow-execution-service:${VERSION} ${DOCKER_USERNAME}/monshyflow-execution-service:latest
echo -e "${GREEN}✅ Execution Service Image gebaut${NC}\n"

echo -e "${GREEN}📦 Baue Scheduler Service Image...${NC}"
docker build -t ${DOCKER_USERNAME}/monshyflow-scheduler-service:${VERSION} -f packages/scheduler-service/Dockerfile .
docker tag ${DOCKER_USERNAME}/monshyflow-scheduler-service:${VERSION} ${DOCKER_USERNAME}/monshyflow-scheduler-service:latest
echo -e "${GREEN}✅ Scheduler Service Image gebaut${NC}\n"

echo -e "${GREEN}📤 Pushe Images zu Docker Hub...${NC}"
docker push ${DOCKER_USERNAME}/monshyflow-frontend:${VERSION}
docker push ${DOCKER_USERNAME}/monshyflow-frontend:latest
docker push ${DOCKER_USERNAME}/monshyflow-api-service:${VERSION}
docker push ${DOCKER_USERNAME}/monshyflow-api-service:latest
docker push ${DOCKER_USERNAME}/monshyflow-auth-service:${VERSION}
docker push ${DOCKER_USERNAME}/monshyflow-auth-service:latest
docker push ${DOCKER_USERNAME}/monshyflow-secrets-service:${VERSION}
docker push ${DOCKER_USERNAME}/monshyflow-secrets-service:latest
docker push ${DOCKER_USERNAME}/monshyflow-execution-service:${VERSION}
docker push ${DOCKER_USERNAME}/monshyflow-execution-service:latest
docker push ${DOCKER_USERNAME}/monshyflow-scheduler-service:${VERSION}
docker push ${DOCKER_USERNAME}/monshyflow-scheduler-service:latest
echo -e "${GREEN}✅ Images zu Docker Hub gepusht${NC}\n"

echo -e "${BLUE}🎉 Deployment erfolgreich!${NC}"
echo -e "${BLUE}Version: ${VERSION}${NC}"
echo -e "${BLUE}Images:${NC}"
echo -e "  - ${DOCKER_USERNAME}/monshyflow-frontend:${VERSION}"
echo -e "  - ${DOCKER_USERNAME}/monshyflow-api-service:${VERSION}"
echo -e "  - ${DOCKER_USERNAME}/monshyflow-auth-service:${VERSION}"
echo -e "  - ${DOCKER_USERNAME}/monshyflow-secrets-service:${VERSION}"
echo -e "  - ${DOCKER_USERNAME}/monshyflow-execution-service:${VERSION}"
echo -e "  - ${DOCKER_USERNAME}/monshyflow-scheduler-service:${VERSION}"
echo -e "\n${YELLOW}Nächster Schritt: Auf Server deployen mit:${NC}"
echo -e "  ssh deploy@SERVER_IP 'cd ~/monshyflow && deployment/scripts/deploy-server.sh'"

