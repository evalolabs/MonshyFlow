import { registerMcpHandler } from './index';
import { genericMcpHandler } from './handlers/genericMcpHandler';

// Note: openWeatherMcpHandler and emailMcpHandler have been migrated to Functions
// They are now available as: get_weather_openweathermap and send_email_smtp

// OpenAI MCP Connectors
import { gmailMcpHandler } from './handlers/gmailMcpHandler';
import { googleCalendarMcpHandler } from './handlers/googleCalendarMcpHandler';
import { googleDriveMcpHandler } from './handlers/googleDriveMcpHandler';
import { outlookEmailMcpHandler } from './handlers/outlookEmailMcpHandler';
import { outlookCalendarMcpHandler } from './handlers/outlookCalendarMcpHandler';
import { sharepointMcpHandler } from './handlers/sharepointMcpHandler';
import { teamsMcpHandler } from './handlers/teamsMcpHandler';
import { dropboxMcpHandler } from './handlers/dropboxMcpHandler';

// Third-Party MCP Connectors
import { boxMcpHandler } from './handlers/boxMcpHandler';
import { zapierMcpHandler } from './handlers/zapierMcpHandler';
import { shopifyMcpHandler } from './handlers/shopifyMcpHandler';
import { intercomMcpHandler } from './handlers/intercomMcpHandler';
import { stripeMcpHandler } from './handlers/stripeMcpHandler';
import { plaidMcpHandler } from './handlers/plaidMcpHandler';
import { squareMcpHandler } from './handlers/squareMcpHandler';
import { cloudflareBrowserMcpHandler } from './handlers/cloudflareBrowserMcpHandler';
import { hubspotMcpHandler } from './handlers/hubspotMcpHandler';
import { pipedreamMcpHandler } from './handlers/pipedreamMcpHandler';
import { paypalMcpHandler } from './handlers/paypalMcpHandler';
import { deepwikiMcpHandler } from './handlers/deepwikiMcpHandler';

export function registerBuiltInMcpHandlers() {
    // Built-in handlers
    // Note: openWeatherMcpHandler and emailMcpHandler have been migrated to Functions
    // They are now available as: get_weather_openweathermap and send_email_smtp
    registerMcpHandler(genericMcpHandler); // Keep for external MCP servers
    
    // OpenAI MCP Connectors
    registerMcpHandler(gmailMcpHandler);
    registerMcpHandler(googleCalendarMcpHandler);
    registerMcpHandler(googleDriveMcpHandler);
    registerMcpHandler(outlookEmailMcpHandler);
    registerMcpHandler(outlookCalendarMcpHandler);
    registerMcpHandler(sharepointMcpHandler);
    registerMcpHandler(teamsMcpHandler);
    registerMcpHandler(dropboxMcpHandler);
    
    // Third-Party MCP Connectors
    registerMcpHandler(boxMcpHandler);
    registerMcpHandler(zapierMcpHandler);
    registerMcpHandler(shopifyMcpHandler);
    registerMcpHandler(intercomMcpHandler);
    registerMcpHandler(stripeMcpHandler);
    registerMcpHandler(plaidMcpHandler);
    registerMcpHandler(squareMcpHandler);
    registerMcpHandler(cloudflareBrowserMcpHandler);
    registerMcpHandler(hubspotMcpHandler);
    registerMcpHandler(pipedreamMcpHandler);
    registerMcpHandler(paypalMcpHandler);
    registerMcpHandler(deepwikiMcpHandler);
}


