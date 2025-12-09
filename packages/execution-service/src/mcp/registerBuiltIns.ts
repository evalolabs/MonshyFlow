import { registerMcpHandler } from './index';
import { genericMcpHandler } from './handlers/genericMcpHandler';
import { openWeatherMcpHandler } from './handlers/openWeatherMcpHandler';
import { emailMcpHandler } from './handlers/emailMcpHandler';

// OpenAI MCP Connectors
import { gmailMcpHandler } from './handlers/gmailMcpHandler';
import { googleCalendarMcpHandler } from './handlers/googleCalendarMcpHandler';
import { googleDriveMcpHandler } from './handlers/googleDriveMcpHandler';
import { outlookEmailMcpHandler } from './handlers/outlookEmailMcpHandler';
import { outlookCalendarMcpHandler } from './handlers/outlookCalendarMcpHandler';
import { sharepointMcpHandler } from './handlers/sharepointMcpHandler';
import { teamsMcpHandler } from './handlers/teamsMcpHandler';
import { dropboxMcpHandler } from './handlers/dropboxMcpHandler';

export function registerBuiltInMcpHandlers() {
    // Built-in handlers
    registerMcpHandler(genericMcpHandler);
    registerMcpHandler(openWeatherMcpHandler);
    registerMcpHandler(emailMcpHandler);
    
    // OpenAI MCP Connectors
    registerMcpHandler(gmailMcpHandler);
    registerMcpHandler(googleCalendarMcpHandler);
    registerMcpHandler(googleDriveMcpHandler);
    registerMcpHandler(outlookEmailMcpHandler);
    registerMcpHandler(outlookCalendarMcpHandler);
    registerMcpHandler(sharepointMcpHandler);
    registerMcpHandler(teamsMcpHandler);
    registerMcpHandler(dropboxMcpHandler);
}


