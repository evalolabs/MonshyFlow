# Dokumentations-Struktur

## 📁 Übersicht

Die Dokumentation ist jetzt in zwei Bereiche aufgeteilt:

### 🌐 Öffentliche Dokumentation (für Open Source)

**Root-Level** (wichtigste Dateien):
- `README.md` - Hauptdokumentation, Quick Start
- `LICENSE` - MIT License
- `CHANGELOG.md` - Versionshistorie
- `CONTRIBUTING.md` - Guide für Contributors
- `CODE_OF_CONDUCT.md` - Verhaltensregeln
- `SECURITY.md` - Security Policy
- `ARCHITECTURE.md` - System-Architektur

**docs/** - Entwickler-Dokumentation:
- `docs/README.md` - Dokumentations-Index
- `docs/NODE_DEVELOPMENT_GUIDE.md` - Node-Entwicklung

**Weitere öffentliche Ordner**:
- `azure-deployment/` - Deployment-Dokumentation
- `kong/` - API Gateway Dokumentation
- `frontend/README.md` - Frontend Setup
- `packages/README.md` - Packages Übersicht

### 🔒 Private Dokumentation (nur für uns)

**.private/** - Entwicklungsdokumentation (in .gitignore):
- `README.md` - Übersicht über private Docs
- `TODOS.md` - Aktuelle TODOs und Checklisten
- `OPEN_SOURCE_CHECKLIST.md` - Open Source Vorbereitung
- `OPEN_SOURCE_READY.md` - Status
- `PUBLISHING_GUIDE.md` - Publishing Anleitung
- `ALPHA_LAUNCH_CHECKLIST.md` - Alpha Launch
- Alle Implementierungs-Dokumentationen
- Alle Analysen (Security, Frontend, etc.)
- `CursorDocs/` - Cursor AI Development Docs

## ✅ Was wurde gemacht

1. **Entwicklungsdokumente verschoben** → `.private/`
2. **.gitignore aktualisiert** → `.private/` wird ignoriert
3. **Öffentliche Dokumentation organisiert** → `docs/` und Root
4. **ARCHITECTURE.md erstellt** → System-Übersicht
5. **docs/README.md aktualisiert** → Dokumentations-Index

## 📋 Struktur

```
MonshyFlow/
├── README.md                    # ✅ Öffentlich - Hauptdokumentation
├── LICENSE                      # ✅ Öffentlich
├── CHANGELOG.md                 # ✅ Öffentlich
├── CONTRIBUTING.md              # ✅ Öffentlich
├── CODE_OF_CONDUCT.md           # ✅ Öffentlich
├── SECURITY.md                  # ✅ Öffentlich
├── ARCHITECTURE.md              # ✅ Öffentlich - Neu erstellt
├── .env.example                 # ✅ Öffentlich
│
├── docs/                        # ✅ Öffentlich
│   ├── README.md                # Dokumentations-Index
│   └── NODE_DEVELOPMENT_GUIDE.md
│
├── .private/                    # 🔒 PRIVAT (gitignored)
│   ├── README.md
│   ├── TODOS.md                 # Unsere TODOs
│   ├── OPEN_SOURCE_CHECKLIST.md
│   ├── OPEN_SOURCE_READY.md
│   ├── PUBLISHING_GUIDE.md
│   ├── ALPHA_LAUNCH_CHECKLIST.md
│   ├── [Alle Entwicklungsdocs]
│   └── CursorDocs/
│
├── .github/                     # ✅ Öffentlich
│   ├── ISSUE_TEMPLATE/
│   ├── workflows/
│   └── PULL_REQUEST_TEMPLATE.md
│
├── azure-deployment/            # ✅ Öffentlich
├── kong/                        # ✅ Öffentlich
└── frontend/README.md           # ✅ Öffentlich
```

## 🎯 Nächste Schritte

1. ✅ Dokumentation aufgeräumt
2. ⏳ Secrets final prüfen
3. ⏳ GitHub Repository vorbereiten
4. ⏳ Erste Release erstellen

---

**Status**: Dokumentation ist jetzt sauber organisiert! 🎉

