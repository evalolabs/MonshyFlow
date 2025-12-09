// Azure Container Apps: Service Discovery über interne Namen
// Lokal: Ports 5002-5005, Azure: Port 80

function getServiceUrl(serviceName: string, defaultPort: number): string {
  const envVar = `${serviceName.toUpperCase().replace('-', '_')}_SERVICE_URL`;
  const url = process.env[envVar];
  
  if (url) {
    return url;
  }
  
  // Azure Container Apps: interne Namen mit Port 80
  const isContainer = process.env.DOTNET_RUNNING_IN_CONTAINER === 'true' || 
                      process.env.AZURE_CONTAINER_APPS_ENVIRONMENT !== undefined;
  
  if (isContainer) {
    return `http://${serviceName}:80`;
  }
  
  // Lokal: localhost mit Standard-Port
  return `http://localhost:${defaultPort}`;
}

export const config = {
  port: parseInt(process.env.PORT || process.env.API_SERVICE_PORT || '5001', 10),
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

