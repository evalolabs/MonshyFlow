// Azure Container Apps: Service Discovery über interne Namen
// Lokal: Ports 5002-5005, Azure: Port 80

function getServiceUrl(serviceName: string, defaultPort: number): string {
  // Environment Variable Name: AUTH_SERVICE_URL, SECRETS_SERVICE_URL, etc.
  // serviceName ist z.B. "auth-service" -> "AUTH_SERVICE" -> "AUTH_SERVICE_URL"
  // ABER: Wenn serviceName bereits "auth-service" ist, wird es zu "AUTH_SERVICE_SERVICE_URL"
  // Lösung: Service-Name normalisieren (entferne "-service" falls vorhanden)
  let normalizedName = serviceName;
  if (serviceName.endsWith('-service')) {
    normalizedName = serviceName.replace('-service', '');
  }
  const envVar = `${normalizedName.toUpperCase().replace('-', '_')}_SERVICE_URL`;
  const url = process.env[envVar];
  
  // Log für Debugging
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Config] ${envVar} = ${url || 'not set'}`);
  }
  
  if (url) {
    return url;
  }
  
  // Azure Container Apps: interne Namen mit Port 80
  const isContainer = process.env.DOTNET_RUNNING_IN_CONTAINER === 'true' || 
                      process.env.AZURE_CONTAINER_APPS_ENVIRONMENT !== undefined;
  
  if (isContainer) {
    return `http://${serviceName}:80`;
  }
  
  // Docker Compose: Verwende Service-Namen (funktioniert im Docker-Netzwerk)
  // Prüfe ob wir in Docker laufen durch Container-Name
  const isDocker = process.env.HOSTNAME?.includes('monshyflow') || 
                   process.env.COMPOSE_PROJECT_NAME !== undefined;
  
  if (isDocker) {
    // In Docker Compose: Service-Namen verwenden, Port 80 (Container-Port)
    return `http://${serviceName}:80`;
  }
  
  // Lokal (außerhalb Docker): localhost mit Standard-Port (explizit IPv4)
  // Verwende 127.0.0.1 statt localhost, um IPv6-Probleme zu vermeiden
  return `http://127.0.0.1:${defaultPort}`;
}

export const config = {
  port: parseInt(process.env.PORT || process.env.API_SERVICE_PORT || '5000', 10),
  services: {
    auth: {
      url: getServiceUrl('auth-service', 5002),
    },
    secrets: {
      url: getServiceUrl('secrets-service', 5003),
    },
    execution: {
      url: getServiceUrl('execution-service', 5004),
    },
    scheduler: {
      url: getServiceUrl('scheduler-service', 5005),
    },
  },
};

