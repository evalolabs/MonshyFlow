# Code-Anpassungen für Azure Deployment

Diese Datei dokumentiert alle Code-Änderungen, die für das Azure Container Apps Deployment vorgenommen wurden.

---

## ✅ Durchgeführte Änderungen

### 1. Gateway (AgentBuilder.Gateway)

#### Ocelot Config Loading
- **Datei:** `Program.cs`
- **Änderung:** Automatisches Laden von `ocelot.Azure.json` in Production
- **Priorität:** Environment Variable `OCELOT_CONFIG_FILE` > Azure Config > Docker Config > Local Config

```csharp
// Load Ocelot configuration - priority: Environment Variable > Azure > Docker > Local
var ocelotConfigFile = Environment.GetEnvironmentVariable("OCELOT_CONFIG_FILE")
    ?? (Environment.GetEnvironmentVariable("DOTNET_RUNNING_IN_CONTAINER") == "true"
        ? "ocelot.Docker.json"
        : "ocelot.json");

// Check if Azure config exists and we're in production
if (string.IsNullOrEmpty(Environment.GetEnvironmentVariable("OCELOT_CONFIG_FILE")) 
    && builder.Environment.IsProduction() 
    && System.IO.File.Exists("ocelot.Azure.json"))
{
    ocelotConfigFile = "ocelot.Azure.json";
}
```

#### CORS Configuration
- **Änderung:** Frontend URL aus Environment Variable `FRONTEND_URL`
- **Fallback:** Localhost URLs für Development

```csharp
var frontendUrl = Environment.GetEnvironmentVariable("FRONTEND_URL");
// ... dynamische CORS-Konfiguration
```

---

### 2. AuthService (AgentBuilder.AuthService)

#### JWT Configuration
- **Datei:** `Program.cs`
- **Änderung:** JWT Settings aus Environment Variables bevorzugen
- **Format:** `JwtSettings__SecretKey`, `JwtSettings__Issuer`, `JwtSettings__Audience`

```csharp
var jwtSecretKey = Environment.GetEnvironmentVariable("JwtSettings__SecretKey")
    ?? builder.Configuration["JwtSettings:SecretKey"]
    ?? throw new InvalidOperationException("JWT SecretKey is not configured");
```

#### CORS Configuration
- **Änderung:** Frontend URL aus Environment Variable `FRONTEND_URL`
- **Fallback:** Localhost URLs für Development

---

### 3. AgentService (AgentBuilder.AgentService)

#### JWT Configuration
- **Datei:** `Program.cs`
- **Änderung:** JWT Settings aus Environment Variables bevorzugen

#### Execution Service URL
- **Änderung:** Unterstützung für Azure Container Apps interne URLs
- **Logik:** 
  - Production: `http://execution-service:80` (Container Apps)
  - Docker: `http://execution-service:5002` (Docker Compose)
  - Local: `http://localhost:5002`

```csharp
if (string.IsNullOrEmpty(baseUrl))
{
    if (isContainer)
    {
        baseUrl = builder.Environment.IsProduction() 
            ? "http://execution-service:80"  // Azure Container Apps
            : "http://execution-service:5002"; // Docker Compose
    }
    else
    {
        baseUrl = "http://localhost:5002";
    }
}
```

#### CORS Configuration
- **Änderung:** Von `AllowAll` zu `AllowFrontend` mit Environment Variable Support
- **Sicherheit:** Restriktive CORS für Production

---

### 4. SecretsService (AgentBuilder.SecretsService)

#### JWT Configuration
- **Datei:** `Program.cs`
- **Änderung:** JWT Settings aus Environment Variables bevorzugen

#### CORS Configuration
- **Änderung:** Frontend URL aus Environment Variable `FRONTEND_URL`
- **Fallback:** Localhost URLs für Development

---

## 📋 Environment Variable Format

### .NET Services
- **Format:** `Section__Key` (doppelte Unterstriche)
- **Beispiel:** `JwtSettings__SecretKey`, `MongoDbSettings__ConnectionString`
- **Laden:** Automatisch durch .NET Configuration System

### Node.js Services
- **Format:** `UPPER_SNAKE_CASE`
- **Beispiel:** `MONGODB_URL`, `REDIS_URL`
- **Laden:** Über `process.env`

---

## 🔄 Prioritätsreihenfolge

Für alle Services gilt folgende Priorität:

1. **Environment Variable** (höchste Priorität)
2. **Configuration File** (appsettings.json)
3. **Default Value** (falls vorhanden)
4. **Exception** (falls required)

---

## ✅ Vorteile der Änderungen

1. **Flexibilität:** Konfiguration über Environment Variables ohne Code-Änderungen
2. **Sicherheit:** Secrets nicht in Config Files, sondern in Azure Key Vault
3. **Multi-Environment:** Gleicher Code für Development, Docker, Azure
4. **CORS:** Dynamische Frontend URL Unterstützung
5. **Service Discovery:** Automatische Erkennung von Container Apps vs. Docker vs. Local

---

## 🚀 Nächste Schritte

1. ✅ Code-Anpassungen abgeschlossen
2. ⏭️ Deployment-Scripts erstellen
3. ⏭️ Azure Ressourcen erstellen
4. ⏭️ Environment Variables setzen
5. ⏭️ Deployment testen

---

## 📚 Weitere Informationen

- [Environment Variables Dokumentation](./ENVIRONMENT_VARIABLES.md)
- [Deployment Guide](./README.md)

