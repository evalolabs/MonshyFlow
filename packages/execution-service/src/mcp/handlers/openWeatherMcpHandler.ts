import axios from 'axios';
import { z } from 'zod';
import type { McpConnection, McpHandler, McpHandlerContext, McpTool } from '..';

const API_ENDPOINT = 'https://api.openweathermap.org/data/2.5';

/**
 * A custom connection handler for the OpenWeatherMap API.
 * This class wraps the REST API calls to make them behave like MCP tools.
 */
class OpenWeatherMcpConnection implements McpConnection {
    private readonly apiKey: string;

    constructor(apiKey: string) {
        if (!apiKey) {
            throw new Error('OpenWeatherMap API key is required.');
        }
        this.apiKey = apiKey;
    }

    /**
     * Defines the tools that this handler exposes to the agent.
     */
    async listTools(): Promise<McpTool[]> {
        return [
            {
                name: 'getCurrentWeather',
                description: 'Get the current weather for a specific location.',
                parameters: z.object({
                    location: z.string().describe('The city and country, e.g., "London, UK"'),
                }),
            },
            {
                name: 'getForecast',
                description: 'Get a multi-day weather forecast for a specific location.',
                parameters: z.object({
                    location: z.string().describe('The city and country, e.g., "Berlin, DE"'),
                    days: z.number().int().min(1).max(5).optional().default(3).describe('Number of days for the forecast (1-5)'),
                }),
            },
        ];
    }

    /**
     * Executes the requested tool by calling the OpenWeatherMap API.
     */
    async invoke(toolName: string, args: Record<string, any>): Promise<any> {
        switch (toolName) {
            case 'getCurrentWeather':
                return this.getCurrentWeather(args.location);
            case 'getForecast':
                return this.getForecast(args.location, args.days);
            default:
                throw new Error(`Tool "${toolName}" is not supported by the OpenWeatherMap handler.`);
        }
    }

    private async getCurrentWeather(location: string): Promise<any> {
        try {
            const response = await axios.get(`${API_ENDPOINT}/weather`, {
                params: {
                    q: location,
                    appid: this.apiKey,
                    units: 'metric',
                },
                timeout: 5000,
            });
            return {
                location: response.data.name,
                temperature: `${response.data.main.temp}°C`,
                feels_like: `${response.data.main.feels_like}°C`,
                humidity: `${response.data.main.humidity}%`,
                condition: response.data.weather[0]?.description || 'N/A',
            };
        } catch (error: any) {
            this.handleApiError(error, 'get current weather');
        }
    }
    
    private async getForecast(location: string, days: number): Promise<any> {
        try {
            // OpenWeatherMap free tier gives 5 day / 3 hour forecast
            const response = await axios.get(`${API_ENDPOINT}/forecast`, {
                params: {
                    q: location,
                    appid: this.apiKey,
                    units: 'metric',
                    cnt: days * 8, // 8 data points per day (every 3 hours)
                },
                timeout: 5000,
            });
            
            // Simplify the forecast data to be more LLM-friendly
            const dailyForecasts = response.data.list.reduce((acc: any, item: any) => {
                const date = item.dt_txt.split(' ')[0];
                if (!acc[date]) {
                    acc[date] = {
                        temps: [],
                        conditions: new Set(),
                    };
                }
                acc[date].temps.push(item.main.temp);
                acc[date].conditions.add(item.weather[0].description);
                return acc;
            }, {});

            const simplified = Object.entries(dailyForecasts).map(([date, data]: [string, any]) => ({
                date,
                min_temp: `${Math.min(...data.temps).toFixed(1)}°C`,
                max_temp: `${Math.max(...data.temps).toFixed(1)}°C`,
                conditions: Array.from(data.conditions).join(', '),
            }));

            return {
                location: response.data.city.name,
                forecast: simplified,
            };

        } catch (error: any) {
            this.handleApiError(error, `get ${days}-day forecast`);
        }
    }

    private handleApiError(error: any, context: string): never {
        if (axios.isAxiosError(error) && error.response) {
            const status = error.response.status;
            const message = error.response.data?.message || 'Unknown API error';
            if (status === 401) {
                throw new Error(`OpenWeatherMap API Error: Invalid API key. Please check your "openweathermap_api_key" secret.`);
            }
            throw new Error(`OpenWeatherMap API Error (${status}) while trying to ${context}: ${message}`);
        }
        throw new Error(`An unexpected error occurred while trying to ${context}: ${error.message}`);
    }
}


export const openWeatherMcpHandler: McpHandler = {
    id: 'openweathermap',
    name: 'OpenWeatherMap',
    description: 'Provides tools to get current weather conditions and multi-day forecasts.',
    metadata: {
        requiredSecrets: ['openweathermap_api_key'],
        docsUrl: 'https://openweathermap.org/api',
        apiKeyUrl: 'https://home.openweathermap.org/api_keys',
        setupInstructions: '1. Erstelle einen Account auf openweathermap.org\n2. Generiere einen API Key\n3. Füge den Key als Secret "openweathermap_api_key" hinzu',
    },
    async connect(config: any, context: McpHandlerContext): Promise<McpConnection> {
        const apiKey = context.secrets.openweathermap_api_key;
        if (!apiKey) {
            throw new Error('Secret "openweathermap_api_key" is missing. Please configure it in the secrets management.');
        }
        return new OpenWeatherMcpConnection(apiKey);
    },
};

