# 🛠️ Lokale Entwicklung

## ⚠️ Wichtig: Dieses Projekt verwendet pnpm!

Das Projekt nutzt **pnpm** mit Workspaces. `npm` funktioniert nicht, da es die `workspace:*` Syntax nicht unterstützt.

---

## 🚀 Option 1: Docker (Empfohlen)

**Einfachste Methode - alles läuft in Containern:**

```bash
# Services starten
docker-compose up -d --build

# Logs anzeigen
docker-compose logs -f api-service
```

**Vorteile:**
- ✅ Keine lokalen Dependencies nötig
- ✅ Konsistente Umgebung
- ✅ Einfach zu starten

---

## 🚀 Option 2: Lokal mit pnpm

### 1. pnpm installieren

**Windows (PowerShell):**
```powershell
npm install -g pnpm
```

**Oder mit Chocolatey:**
```powershell
choco install pnpm
```

### 2. Dependencies installieren

```bash
# Im Root-Verzeichnis
pnpm install
```

### 3. Services starten

```bash
# Alle Services
pnpm dev

# Einzelner Service
pnpm --filter @monshy/api-service dev
pnpm --filter @monshy/auth-service dev
```

### 4. Build

```bash
# Alle Services bauen
pnpm build

# Einzelner Service
pnpm --filter @monshy/api-service build
```

---

## ❌ Warum npm nicht funktioniert

- ❌ `workspace:*` Syntax wird nicht unterstützt
- ❌ pnpm Workspaces werden nicht erkannt
- ❌ Shared Packages funktionieren nicht

**Lösung:** pnpm installieren oder Docker verwenden.

---

## 🐳 Docker vs. Lokal

| Feature | Docker | Lokal (pnpm) |
|---------|--------|--------------|
| Setup | ✅ Einfach | ⚠️ pnpm installieren |
| Dependencies | ✅ Automatisch | ⚠️ Manuell installieren |
| Konsistenz | ✅ Garantiert | ⚠️ Abhängig von System |
| Performance | ⚠️ Etwas langsamer | ✅ Schneller |

**Empfehlung:** Docker für Production, pnpm für Development.

---

## 🔧 Troubleshooting

### "tsc is not recognized"
→ TypeScript ist nicht installiert. Führe `pnpm install` aus.

### "workspace:* not supported"
→ Du verwendest npm statt pnpm. Installiere pnpm.

### "Cannot find module @monshy/core"
→ Dependencies nicht installiert. Führe `pnpm install` im Root aus.

---

## 📝 Nächste Schritte

1. **Docker verwenden** (einfachste Option):
   ```bash
   docker-compose up -d --build
   ```

2. **Oder pnpm installieren**:
   ```powershell
   npm install -g pnpm
   pnpm install
   pnpm dev
   ```

