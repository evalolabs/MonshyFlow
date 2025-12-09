# RabbitMQ - Optional & Kostenoptimiert

## 📋 Status

**RabbitMQ ist NICHT in den Azure Resource Creation Scripts enthalten**, um Kosten zu sparen.

---

## 🔍 Aktueller Status im Code

### Verwendung

RabbitMQ wird im Code verwendet für:
- **AgentBuilder.Messaging** - Workflow Run Queueing
- **execution-service** - Queue Service für Workflow Execution

### Fallback-Mechanismus

Der Code hat einen **Fallback-Mechanismus**:

**execution-service (TypeScript):**
```typescript
// queueService.ts
async connect(): Promise<void> {
    try {
        const conn = await amqp.connect(this.rabbitUrl);
        // ... RabbitMQ connection
    } catch (error) {
        console.error('❌ RabbitMQ connection failed:', error);
        // Fallback to in-memory queue for development
        console.warn('⚠️  Using in-memory queue (no persistence)');
    }
}
```

**Fazit:** Wenn `RABBITMQ_URL` nicht gesetzt ist oder die Verbindung fehlschlägt, verwendet der Service eine **in-memory Queue** (keine Persistenz, aber funktioniert).

---

## 💰 Kosten

### Optionen für später (wenn benötigt):

#### Option 1: RabbitMQ auf Azure VM (günstigste)
- **VM B1s**: ~$10/Monat
- **RabbitMQ Docker Container** auf VM
- **Vorteil:** Günstig, volle Kontrolle
- **Nachteil:** Manuelle Verwaltung

#### Option 2: Azure Service Bus (Pay-per-use)
- **Basic Tier**: ~$0.05/Million Operations
- **Standard Tier**: ~$10/Monat + Operations
- **Vorteil:** Managed Service, skalierbar
- **Nachteil:** Migration von RabbitMQ zu Service Bus nötig

#### Option 3: RabbitMQ Cloud (extern)
- **RabbitMQ Cloud**: ~$20-50/Monat
- **Vorteil:** Managed, einfach
- **Nachteil:** Extern, höhere Kosten

---

## 🚀 Für Azure Deployment

### Aktuell (ohne RabbitMQ):

**Environment Variable nicht setzen:**
```bash
# RABBITMQ_URL nicht setzen
# execution-service verwendet in-memory queue
```

**Vorteile:**
- ✅ Keine zusätzlichen Kosten
- ✅ Funktioniert für Development/Testing
- ✅ Code bleibt unverändert

**Nachteile:**
- ⚠️ Keine Persistenz (bei Neustart verloren)
- ⚠️ Keine verteilte Queue (nur in-memory)

---

## 📝 Später hinzufügen (wenn benötigt)

### Option A: RabbitMQ auf Azure VM

1. **VM erstellen:**
```bash
az vm create \
  --resource-group monshy-rg \
  --name monshy-rabbitmq-vm \
  --image Ubuntu2204 \
  --size Standard_B1s \
  --admin-username azureuser \
  --generate-ssh-keys
```

2. **RabbitMQ installieren (auf VM):**
```bash
# SSH zur VM
ssh azureuser@<vm-ip>

# Docker installieren
sudo apt update
sudo apt install docker.io -y

# RabbitMQ Container starten
sudo docker run -d \
  --name rabbitmq \
  -p 5672:5672 \
  -p 15672:15672 \
  -e RABBITMQ_DEFAULT_USER=admin \
  -e RABBITMQ_DEFAULT_PASS=admin123 \
  rabbitmq:3.13-management-alpine
```

3. **Environment Variable setzen:**
```bash
# In Container Apps
RABBITMQ_URL=amqp://admin:admin123@<vm-ip>:5672
```

### Option B: Azure Service Bus

1. **Service Bus Namespace erstellen:**
```bash
az servicebus namespace create \
  --resource-group monshy-rg \
  --name monshy-sb \
  --location westeurope \
  --sku Basic
```

2. **Queue erstellen:**
```bash
az servicebus queue create \
  --resource-group monshy-rg \
  --namespace-name monshy-sb \
  --name workflow_runs
```

3. **Connection String holen:**
```bash
az servicebus namespace authorization-rule keys list \
  --resource-group monshy-rg \
  --namespace-name monshy-sb \
  --name RootManageSharedAccessKey \
  --query primaryConnectionString -o tsv
```

4. **Code anpassen:** Service Bus SDK statt RabbitMQ (später)

---

## ✅ Empfehlung

### Für jetzt (Development/Testing):
- ✅ **Kein RabbitMQ** - in-memory queue verwenden
- ✅ **Keine Kosten**
- ✅ **Funktioniert für Tests**

### Für später (Production):
- 🎯 **RabbitMQ auf VM** (Option A) - günstigste Lösung
- Oder **Azure Service Bus** - wenn Migration möglich

---

## 🔧 Code-Anpassungen (falls nötig)

Der Code unterstützt bereits den Fallback. Falls RabbitMQ später benötigt wird:

1. **Environment Variable setzen:**
   ```bash
   RABBITMQ_URL=amqp://admin:admin123@<vm-ip>:5672
   ```

2. **Code bleibt unverändert** - Fallback funktioniert automatisch

---

## 📚 Zusammenfassung

- ✅ **RabbitMQ Scripts:** Nicht erstellt (Kosten sparen)
- ✅ **Code:** Unterstützt Fallback (in-memory queue)
- ✅ **Azure Deployment:** Funktioniert ohne RabbitMQ
- ✅ **Später:** Kann optional hinzugefügt werden (VM oder Service Bus)

**Aktuell: Keine RabbitMQ-Kosten! 💰**

