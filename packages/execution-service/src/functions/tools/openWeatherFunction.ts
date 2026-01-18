import axios from 'axios';
import type { FunctionHandler } from '../index';

const API_ENDPOINT = 'https://api.openweathermap.org/data/2.5';

const lookupSecret = (secrets: Record<string, string>): string | undefined => {
    return (
        secrets.openweathermap_api_key ||
        secrets.OPENWEATHERMAP_API_KEY ||
        secrets.openweathermap ||
        secrets.OPENWEATHERMAP
    );
};

const handleApiError = (error: any, context: string): never => {
    if (axios.isAxiosError(error) && error.response) {
        const status = error.response.status;
        const message = error.response.data?.message || 'Unknown API error';
        if (status === 401) {
            throw new Error(`OpenWeatherMap API Error: Invalid API key. Please check your "openweathermap_api_key" secret.`);
        }
        throw new Error(`OpenWeatherMap API Error (${status}) while trying to ${context}: ${message}`);
    }
    throw new Error(`An unexpected error occurred while trying to ${context}: ${error.message}`);
};

export const openWeatherFunctionHandler: FunctionHandler = {
    name: 'get_weather_openweathermap',
    description: 'Get real-time weather information for any location. Use this tool when the user asks about weather, temperature, forecast, or climate conditions. This tool provides current weather data and multi-day forecasts using the OpenWeatherMap API. Always use this tool when weather information is requested - do not say you cannot access weather data.',
    parameters: {
        type: 'object',
        properties: {
            location: {
                type: 'string',
                description: 'The city name and optionally country, e.g., "Paris", "Paris, France", "London, UK", or "Berlin, DE". This is required.',
            },
            type: {
                type: 'string',
                enum: ['current', 'forecast'],
                description: 'Type of weather data: "current" for current weather, "forecast" for multi-day forecast. Defaults to "current".',
                default: 'current',
            },
            days: {
                type: 'number',
                minimum: 1,
                maximum: 5,
                description: 'Number of days for the forecast (1-5). Only used when type is "forecast". Defaults to 3.',
                default: 3,
            },
        },
        required: ['location'],
        additionalProperties: false,
    },
    metadata: {
        requiredSecrets: ['openweathermap_api_key'],
        docsUrl: 'https://openweathermap.org/api',
        apiKeyUrl: 'https://home.openweathermap.org/api_keys',
        setupInstructions: '1. Erstelle einen Account auf openweathermap.org\n2. Generiere einen API Key\n3. Füge den Key als Secret "openweathermap_api_key" hinzu',
    },
    async execute(args, context) {
        const apiKey = lookupSecret(context.secrets);
        if (!apiKey) {
            throw new Error('Secret "openweathermap_api_key" is missing. Please configure it in the secrets management.');
        }

        const location = args?.location;
        if (typeof location !== 'string' || !location.trim()) {
            throw new Error('Location is required and must be a string.');
        }

        const type = args?.type || 'current';
        const days = args?.days || 3;

        if (type === 'forecast') {
            return await getForecast(location, days, apiKey);
        } else {
            return await getCurrentWeather(location, apiKey);
        }
    },
};

async function getCurrentWeather(location: string, apiKey: string): Promise<any> {
    try {
        const response = await axios.get(`${API_ENDPOINT}/weather`, {
            params: {
                q: location,
                appid: apiKey,
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
            wind_speed: response.data.wind?.speed ? `${response.data.wind.speed} m/s` : 'N/A',
            pressure: response.data.main?.pressure ? `${response.data.main.pressure} hPa` : 'N/A',
        };
    } catch (error: any) {
        handleApiError(error, 'get current weather');
    }
}

async function getForecast(location: string, days: number, apiKey: string): Promise<any> {
    try {
        // OpenWeatherMap free tier gives 5 day / 3 hour forecast
        const response = await axios.get(`${API_ENDPOINT}/forecast`, {
            params: {
                q: location,
                appid: apiKey,
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
        handleApiError(error, `get ${days}-day forecast`);
    }
}

