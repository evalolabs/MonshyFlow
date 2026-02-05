# 🐳 Docker Registry Vergleich: ACR vs Docker Hub

Vergleich zwischen Azure Container Registry (ACR) und Docker Hub für MonshyFlow.

---

## 💰 Kostenvergleich

### Azure Container Registry (ACR)

| Tier | Preis/Monat | Storage | Features |
|------|-------------|---------|----------|
| **Basic** | ~€5 | 10 GB | Private repos, keine Geo-Replikation |
| **Standard** | ~€20 | 100 GB | Geo-Replikation, Webhooks |
| **Premium** | ~€50 | 500 GB | Alle Features + Content Trust |

**Zusätzliche Kosten:**
- Storage: €0.10/GB/Monat (über inkludiertes Limit)
- Data Transfer: Kostenlos innerhalb Azure, €0.05/GB nach außen

### Docker Hub

| Plan | Preis/Monat | Private Repos | Features |
|------|-------------|---------------|----------|
| **Free** | €0 | 1 privates Repo | Unbegrenzte öffentliche Repos, 1 private |
| **Pro** | €5 | Unbegrenzt | Unbegrenzte private Repos, Builds |
| **Team** | €7/User | Unbegrenzt | Team-Features |

**Limits (Free Tier):**
- 200 Pulls/6h für anonyme Nutzer
- 200 Pulls/6h für Free-Accounts
- Keine Limits für authentifizierte Pulls

---

## ✅ Vor- und Nachteile

### Docker Hub

**Vorteile:**
- ✅ **Kostenlos** für öffentliche Repos (perfekt für Open Source)
- ✅ **Einfach zu nutzen** - Standard Docker Registry
- ✅ **Keine zusätzlichen Azure-Kosten**
- ✅ **Gut für Open Source Projekte**
- ✅ **Schnelle Einrichtung** - nur Account erstellen

**Nachteile:**
- ❌ Rate Limits für anonyme Pulls (200/6h)
- ❌ Nur 1 privates Repo im Free Tier
- ❌ Keine direkte Azure-Integration
- ❌ Images werden außerhalb Azure gehostet

### Azure Container Registry (ACR)

**Vorteile:**
- ✅ **Direkte Azure-Integration** - nahtlos mit Container Apps
- ✅ **Keine Rate Limits** innerhalb Azure
- ✅ **Private Repos** standardmäßig
- ✅ **Bessere Performance** (Images in Azure-Region)
- ✅ **Azure RBAC** Integration

**Nachteile:**
- ❌ **Zusätzliche Kosten** (~€5-20/Monat)
- ❌ **Nur für Azure** optimiert
- ❌ **Mehr Setup** erforderlich

---

## 🎯 Empfehlung für MonshyFlow

### Für Open Source Projekt: **Docker Hub (Free)**

**Warum:**
1. ✅ **Kostenlos** - spart €5-20/Monat
2. ✅ **Open Source** - öffentliche Repos sind Standard
3. ✅ **Einfach** - Standard Docker Registry
4. ✅ **Ausreichend** - Rate Limits sind für normale Nutzung kein Problem

**Setup:**
```bash
# 1. Docker Hub Account erstellen (kostenlos)
# 2. Login
docker login

# 3. Images taggen und pushen
docker build -t <username>/monshy-api-service:latest -f packages/api-service/Dockerfile .
docker push <username>/monshy-api-service:latest
```

### Für Private/Enterprise: **ACR**

**Warum:**
1. ✅ **Private Repos** standardmäßig
2. ✅ **Bessere Performance** in Azure
3. ✅ **Keine Rate Limits**
4. ✅ **Azure RBAC** Integration

---

## 📝 Migration: ACR → Docker Hub

Falls du bereits ACR hast, kannst du einfach zu Docker Hub wechseln:

### 1. Docker Hub Account erstellen
- Gehe zu https://hub.docker.com
- Erstelle kostenlosen Account

### 2. Images zu Docker Hub pushen

```bash
# Login zu Docker Hub
docker login

# Images bauen und taggen
docker build -t <username>/monshy-api-service:latest -f packages/api-service/Dockerfile .
docker build -t <username>/monshy-auth-service:latest -f packages/auth-service/Dockerfile .
docker build -t <username>/monshy-secrets-service:latest -f packages/secrets-service/Dockerfile .
docker build -t <username>/monshy-execution-service:latest -f packages/execution-service/Dockerfile .
docker build -t <username>/monshy-scheduler-service:latest -f packages/scheduler-service/Dockerfile .

# Images pushen
docker push <username>/monshy-api-service:latest
docker push <username>/monshy-auth-service:latest
docker push <username>/monshy-secrets-service:latest
docker push <username>/monshy-execution-service:latest
docker push <username>/monshy-scheduler-service:latest
```

### 3. Container Apps aktualisieren

```bash
# API Service
az containerapp update \
  --name api-service \
  --resource-group <your-resource-group> \
  --image <username>/monshy-api-service:latest

# Auth Service
az containerapp update \
  --name auth-service \
  --resource-group <your-resource-group> \
  --image <username>/monshy-auth-service:latest

# ... etc für alle Services
```

### 4. ACR löschen (optional, spart €5/Monat)

```bash
az acr delete --name monshyregistry --resource-group <your-resource-group>
```

---

## 🔄 Hybrid-Ansatz

Du kannst auch beide nutzen:
- **Docker Hub** für öffentliche Images (Open Source)
- **ACR** für private Images (wenn nötig)

---

## 💡 Kostenersparnis

**Mit Docker Hub (Free):**
- Spare: **€5-20/Monat** (ACR Basic/Standard)
- **€60-240/Jahr** Ersparnis

**Für Open Source Projekt:** Definitiv Docker Hub empfehlenswert!

---

## 📚 Weitere Optionen

### GitHub Container Registry (ghcr.io)
- ✅ **Kostenlos** für öffentliche Repos
- ✅ **Integriert mit GitHub**
- ✅ **Keine Rate Limits** für öffentliche Repos
- ❌ Weniger bekannt als Docker Hub

### Amazon ECR / Google Container Registry
- ✅ Alternative Cloud-Registries
- ❌ Nicht Azure-native
- ❌ Zusätzliche Kosten

---

**Empfehlung:** Für MonshyFlow als Open Source Projekt → **Docker Hub (Free)** 🎯

