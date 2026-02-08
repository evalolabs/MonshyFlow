#!/bin/bash
# Deployment Script für Server
# Verwendung: ../../deployment/scripts/deploy-server.sh
# Oder: cd ~/monshyflow && deployment/scripts/deploy-server.sh

set -e  # Exit on error

# Farben für Output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Script-Verzeichnis
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$SCRIPT_DIR/../.."

echo -e "${BLUE}🚀 MonshyFlow Server Deployment${NC}"
echo -e "${BLUE}================================${NC}\n"

# Wechsle ins Projekt-Verzeichnis
cd "$PROJECT_ROOT" || exit 1

# Prüfe ob wir im richtigen Verzeichnis sind
if [ ! -f "docker-compose.prod.yml" ]; then
    echo -e "${RED}❌ Fehler: docker-compose.prod.yml nicht gefunden!${NC}"
    echo "Projekt-Verzeichnis: $PROJECT_ROOT"
    exit 1
fi

# Prüfe ob .env existiert
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  .env Datei nicht gefunden!${NC}"
    echo "Bitte .env Datei erstellen und konfigurieren."
    exit 1
fi

echo -e "${GREEN}📥 Hole neuesten Code...${NC}"
git pull
echo -e "${GREEN}✅ Code aktualisiert${NC}\n"

# Prüfe ob Docker Hub Images verwendet werden sollen
HUB_COMPOSE="$SCRIPT_DIR/../docker/docker-compose.prod.hub.yml"
if [ -f "$HUB_COMPOSE" ] && [ -n "${DOCKER_USERNAME:-}" ]; then
    echo -e "${GREEN}📥 Lade Images von Docker Hub...${NC}"
    export DOCKER_USERNAME=${DOCKER_USERNAME}
    docker compose -f "$HUB_COMPOSE" pull
    echo -e "${GREEN}✅ Images geladen${NC}\n"
    COMPOSE_FILE="$HUB_COMPOSE"
else
    echo -e "${GREEN}🔨 Baue Images lokal...${NC}"
    docker compose -f docker-compose.prod.yml build
    echo -e "${GREEN}✅ Images gebaut${NC}\n"
    COMPOSE_FILE="docker-compose.prod.yml"
fi

echo -e "${GREEN}🔄 Starte Services...${NC}"
docker compose -f "$COMPOSE_FILE" up -d
echo -e "${GREEN}✅ Services gestartet${NC}\n"

echo -e "${GREEN}📊 Container Status:${NC}"
docker compose -f "$COMPOSE_FILE" ps

echo -e "\n${GREEN}🏥 Health Check:${NC}"
sleep 5
curl -f http://localhost/health || echo -e "${YELLOW}⚠️  Health Check fehlgeschlagen (Service startet noch)${NC}"

echo -e "\n${BLUE}🎉 Deployment abgeschlossen!${NC}"
echo -e "${BLUE}Frontend: http://$(hostname -I | awk '{print $1}')${NC}"
echo -e "${BLUE}Logs ansehen: docker compose -f $COMPOSE_FILE logs -f${NC}"

