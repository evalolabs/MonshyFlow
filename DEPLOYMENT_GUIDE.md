# 🚀 Vollständige Deployment-Anleitung für MonshyFlow

Diese Anleitung dokumentiert **alle Schritte**, die für das Production-Deployment von MonshyFlow auf einem Hetzner-Server durchgeführt wurden.

## 📋 Übersicht

**Was wurde gemacht:**
1. Production Docker Compose Setup
2. Frontend-Integration (React + Nginx)
3. Deployment-Scripts (lokal + Server)
4. GitHub Actions CI/CD
5. Management-Tools (Portainer, Mongo Express, Redis Commander)
6. Vollständige Dokumentation

**Wichtig:** MonshyFlow ist der **SSO-Provider** für MonshyBot. Beide Systeme müssen korrekt konfiguriert sein, damit MonshyBot die Authentifizierung über MonshyFlow nutzen kann.

---

## 🏗️ Schritt 1: Projekt-Struktur vorbereiten

### 1.1 Production Docker Compose erstellen

**Datei:** `docker-compose.prod.yml`

**Wichtig:**
- Keine Volume-Mounts für Code (Code im Docker Image)
- ENVIRONMENT=production, NODE_ENV=production
- Healthchecks für alle Services
- Separate Networks
- Persistente Volumes für Datenbanken

**Services:**
- Frontend (Nginx + React Build)
- Kong Gateway (API Gateway)
- API Service (Workflow Management)
- Auth Service (SSO Provider für MonshyBot)
- Secrets Service
- Execution Service (Workflow Execution Engine)
- Scheduler Service
- MongoDB
- Redis
- RabbitMQ (optional)
- Optional: Mongo Express, Redis Commander, Portainer

### 1.2 Frontend Dockerfile erstellen

**Datei:** `frontend/Dockerfile`

**Multi-stage Build:**
1. Builder: Node.js → Build React App
2. Production: Nginx → Serviert statische Dateien

**Wichtig:**
- Build-Args für Environment-Variablen (VITE_API_URL)
- Nginx-Config für Frontend + API-Proxy zu Kong Gateway

### 1.3 Nginx Configuration

**Datei:** `frontend/nginx.conf`

**Features:**
- Frontend servieren (statische Dateien)
- Backend-Proxy (`/api` → Kong Gateway)
- Health-Check-Proxy
- Gzip-Kompression
- Security Headers

---

## 🔧 Schritt 2: Konfiguration

### 2.1 Environment-Variablen erweitern

**Datei:** `.env` (erstellen von `.env.example`)

**Alle benötigten Variablen dokumentieren:**
- Application Settings (NODE_ENV, PORT)
- Database Credentials (MONGO_ROOT_PASSWORD, REDIS_PASSWORD, RABBITMQ_PASSWORD)
- API Keys (OpenAI, etc.)
- JWT Configuration (JWT_SECRET_KEY, JWT_ISSUER, JWT_AUDIENCE)
- Service URLs (interne Kommunikation)
- Frontend Build-Variablen (VITE_API_URL)
- Secrets Encryption (SECRETS_ENCRYPTION_KEY)
- Internal Service Key (INTERNAL_SERVICE_KEY)

### 2.2 CORS konfigurierbar machen

**Dateien:** Kong Gateway Konfiguration (`kong/kong.yml`)

**Änderungen:**
- CORS-Plugin in Kong konfigurieren
- Production: `origins: ["https://your-domain.com"]`
- Development: `origins: ["*"]`

---

## 📦 Schritt 3: Deployment-Scripts

### 3.1 Lokaler Build + Push Script

**Dateien:** 
- `deployment/scripts/deploy-local.sh` (Linux/Mac)
- `deployment/scripts/deploy-local.ps1` (Windows)

**Funktionalität:**
- Baut alle Service Images (Frontend + 5 Backend Services)
- Taggt mit Version
- Pusht zu Docker Hub
- Nutzt `DOCKER_USERNAME` Environment-Variable

**Verwendung:**
```bash
cd deployment/scripts
export DOCKER_USERNAME=dein-username
./deploy-local.sh
```

### 3.2 Server Deployment Script

**Datei:** `deployment/scripts/deploy-server.sh`

**Funktionalität:**
- Git Pull (neuesten Code)
- Prüft ob Docker Hub Images verfügbar
- Falls ja: Pull von Docker Hub
- Falls nein: Build lokal
- Startet Services
- Health Check

**Verwendung:**
```bash
cd ~/monshyflow
export DOCKER_USERNAME=dein-username  # Optional
deployment/scripts/deploy-server.sh
```

### 3.3 Docker Hub Variante

**Datei:** `deployment/docker/docker-compose.prod.hub.yml`

**Unterschied zu prod.yml:**
- Nutzt `image:` statt `build:`
- Images von Docker Hub
- Schnelleres Deployment (kein Build nötig)

---

## 🔄 Schritt 4: CI/CD (GitHub Actions)

### 4.1 Workflow erstellen

**Datei:** `.github/workflows/deploy.yml`

**Features:**
- Automatischer Build bei Push zu master/main
- Multi-stage Build (Frontend + 5 Backend Services)
- Push zu Docker Hub
- Versionierung (latest + commit SHA)
- Build-Caching für Performance

**GitHub Secrets benötigt:**
- `DOCKER_USERNAME`
- `DOCKER_PASSWORD` (Access Token)

**Aktivierung:**
```bash
# Workflow ist bereits erstellt in .github/workflows/deploy.yml
# GitHub Secrets müssen in Repository Settings konfiguriert werden
```

---

## 🖥️ Schritt 5: Server-Setup (einmalig)

### 5.1 Server vorbereiten

**Voraussetzungen:**
- Ubuntu 22.04 LTS
- Root-Zugriff

**Befehle:**
```bash
# Updates
apt update && apt upgrade -y

# Firewall
apt install -y ufw
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable

# Docker
apt install -y ca-certificates curl gnupg lsb-release
curl -fsSL https://get.docker.com | sh
systemctl enable docker
systemctl start docker

# Deploy User
adduser deploy
usermod -aG docker deploy
usermod -aG sudo deploy

# SSH-Key für deploy
mkdir -p /home/deploy/.ssh
cp /root/.ssh/authorized_keys /home/deploy/.ssh/authorized_keys
chown -R deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys

# Git
apt install -y git
```

### 5.2 Repository klonen

```bash
ssh deploy@SERVER_IP
cd ~
git clone https://github.com/your-org/monshyflow.git
cd monshyflow
```

### 5.3 Environment konfigurieren

```bash
cp .env.example .env
nano .env
```

**Wichtige Variablen:**
- `MONGO_ROOT_PASSWORD` - Generiere mit: `openssl rand -base64 32`
- `REDIS_PASSWORD` - Generiere mit: `openssl rand -base64 32`
- `RABBITMQ_PASSWORD` - Generiere mit: `openssl rand -base64 32`
- `JWT_SECRET_KEY` - Generiere mit: `openssl rand -base64 32` (min. 32 Zeichen)
- `SECRETS_ENCRYPTION_KEY` - Generiere mit: `openssl rand -base64 32` (min. 32 Zeichen)
- `INTERNAL_SERVICE_KEY` - Generiere mit: `openssl rand -base64 32`
- `NODE_ENV=production`
- `VITE_API_URL=/api`
- Alle API Keys (OpenAI, etc.)

---

## 🚀 Schritt 6: Erstes Deployment

### 6.1 Build und Start

```bash
cd ~/monshyflow
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d
```

### 6.2 Prüfen

```bash
# Status
docker compose -f docker-compose.prod.yml ps

# Health Check
curl http://localhost/health

# Logs
docker compose -f docker-compose.prod.yml logs -f
```

---

## 🛠️ Schritt 7: Management-Tools

### 7.1 Portainer (Docker Desktop für Server)

**Hinzufügen zu docker-compose.prod.yml:**
Bereits vorhanden mit `--profile tools`

**Start:**
```bash
docker compose -f docker-compose.prod.yml --profile tools up -d portainer
```

**Zugriff (SSH-Tunnel):**
```bash
# Auf deinem PC
ssh -L 9000:localhost:9000 deploy@SERVER_IP

# Im Browser
http://localhost:9000
```

### 7.2 Mongo Express & Redis Commander

Bereits in docker-compose.prod.yml mit `--profile tools`

**Start:**
```bash
docker compose -f docker-compose.prod.yml --profile tools up -d
```

**Zugriff:**
- Mongo Express: `http://localhost:8083` (SSH-Tunnel: `ssh -L 8083:localhost:8083`)
- Redis Commander: `http://localhost:8084` (SSH-Tunnel: `ssh -L 8084:localhost:8084`)

---

## 📝 Schritt 8: Dokumentation

### 8.1 Erstellte Dokumentation

1. **`deployment/README.md`** - Zentrale Deployment-Übersicht (zu erstellen)
2. **`DEPLOYMENT_GUIDE.md`** - Vollständige Deployment-Anleitung (diese Datei)
3. **`README.md`** - Projekt-Übersicht

### 8.2 Struktur

```
deployment/
├── README.md              # ⭐ Start hier (zu erstellen)
├── scripts/
│   ├── deploy-local.sh   # Lokaler Build
│   ├── deploy-local.ps1  # Lokaler Build (Windows)
│   └── deploy-server.sh  # Server Deployment
└── docker/
    └── docker-compose.prod.hub.yml  # Docker Hub Variante
```

---

## 🔄 Schritt 9: Workflow für Updates

### 9.1 Schnelle Iterationen

```bash
# Auf Server
cd ~/monshyflow
git pull
docker compose -f docker-compose.prod.yml restart monshyflow-api-service  # ~30 Sekunden
```

### 9.2 Stabile Releases

**Mit Docker Hub:**
```bash
# Lokal: Build + Push
cd deployment/scripts
./deploy-local.sh

# Server: Pull + Deploy
ssh deploy@SERVER_IP 'cd ~/monshyflow && deployment/scripts/deploy-server.sh'
```

**Mit GitHub Actions:**
```bash
# Lokal: Push
git push origin master

# Server: Pull + Deploy (nach GitHub Actions Build)
ssh deploy@SERVER_IP 'cd ~/monshyflow && deployment/scripts/deploy-server.sh'
```

---

## ✅ Checkliste

### Vorbereitung
- [x] `docker-compose.prod.yml` erstellen
- [x] Frontend `Dockerfile` erstellen
- [x] Frontend `nginx.conf` erstellen
- [ ] `.env.example` erweitern
- [ ] CORS in Kong konfigurierbar machen

### Deployment-Scripts
- [x] `deployment/scripts/deploy-local.sh` erstellen
- [x] `deployment/scripts/deploy-local.ps1` erstellen
- [x] `deployment/scripts/deploy-server.sh` erstellen
- [x] `deployment/docker/docker-compose.prod.hub.yml` erstellen

### CI/CD
- [x] GitHub Actions Workflow erstellen
- [ ] GitHub Secrets konfigurieren
- [ ] Workflow aktivieren

### Dokumentation
- [x] `DEPLOYMENT_GUIDE.md` erstellen
- [ ] `deployment/README.md` erstellen
- [ ] `README.md` aktualisieren

### Server-Setup
- [ ] Server vorbereiten (Docker, Firewall, User)
- [ ] Repository klonen
- [ ] `.env` konfigurieren
- [ ] Erstes Deployment

### Management-Tools
- [x] Portainer hinzufügen
- [x] Tools-Profile aktivieren
- [ ] SSH-Tunnel für Zugriff einrichten

---

## 🎯 Wichtige Unterschiede zu MonshyBot

### Architektur:
1. **Microservices:** MonshyFlow hat 5 Backend-Services (API, Auth, Secrets, Execution, Scheduler)
2. **Kong Gateway:** API Gateway vor allen Services
3. **SSO Provider:** MonshyFlow ist SSO-Provider für MonshyBot

### Container-Namen:
- `monshyflow-*` statt `monshybot-*`

### Ports:
- Frontend: Port 80 (gleich wie MonshyBot)
- Kong Gateway: Port 8000 (intern)
- MongoDB: Port 27017 (lokal, kann mit MonshyBot kollidieren - prüfen!)
- Redis: Port 6379 (lokal, kann mit MonshyBot kollidieren - prüfen!)

### Networks:
- Separate Networks für Isolation (`monshyflow-network`)

### Volumes:
- Separate Volumes (keine Konflikte)

### Environment-Variablen:
- MonshyFlow-spezifische Variablen
- JWT-Konfiguration für SSO
- Service-URLs für interne Kommunikation

---

## 🔗 Integration mit MonshyBot

### SSO-Konfiguration

MonshyBot nutzt MonshyFlow als SSO-Provider:

1. **MonshyBot konfigurieren:**
   - `MONSHY_GATEWAY_URL=http://monshyflow-server:5000` (oder Domain)
   - MonshyBot ruft `/api/auth/login` und `/api/auth/validate` auf MonshyFlow auf

2. **MonshyFlow konfigurieren:**
   - CORS muss MonshyBot-Domain erlauben
   - Auth Service muss erreichbar sein

3. **Testen:**
   - Login in MonshyBot sollte JWT-Token von MonshyFlow erhalten
   - Token-Validierung sollte funktionieren

---

## 📚 Zusammenfassung

**Was wurde erreicht:**
- ✅ Production-ready Deployment
- ✅ Frontend + Backend integriert
- ✅ Automatisierte Builds (GitHub Actions)
- ✅ Management-Tools (Portainer)
- ✅ Vollständige Dokumentation
- ✅ Deployment-Scripts
- ✅ Docker Hub Integration

**Zeitaufwand:**
- Setup: ~2-3 Stunden
- Erstes Deployment: ~30 Minuten
- Updates: ~2-3 Minuten

**Ergebnis:**
- Professionelles Production-Setup
- Einfache Updates
- Vollständige Überwachung
- Skalierbar und wartbar

---

## 🆘 Troubleshooting

### Build-Fehler
- TypeScript-Fehler beheben
- Dependencies prüfen (pnpm install)
- Logs ansehen: `docker compose logs`

### Container starten nicht
- Logs prüfen: `docker compose logs -f SERVICE_NAME`
- Health Checks prüfen
- Ports prüfen: `netstat -tulpn`
- MongoDB/Redis-Verbindungen prüfen

### Frontend nicht erreichbar
- Nginx-Config prüfen
- Kong Gateway prüfen
- CORS-Einstellungen prüfen

### SSO funktioniert nicht
- MonshyBot `MONSHY_GATEWAY_URL` prüfen
- Kong Gateway erreichbar?
- CORS in Kong konfiguriert?
- Auth Service läuft?

---

## 📞 Nächste Schritte

1. **SSL/HTTPS einrichten** (Let's Encrypt)
2. **Domain konfigurieren**
3. **Monitoring erweitern** (optional)
4. **Backup-Strategie** (optional)
5. **Staging-Environment** (optional)
6. **MonshyBot Integration testen** (SSO)

---

**Erstellt für:** MonshyFlow Deployment  
**Datum:** 2026-02-08  
**SSO Provider für:** MonshyBot

