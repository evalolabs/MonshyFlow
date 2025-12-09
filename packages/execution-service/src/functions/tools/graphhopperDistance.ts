import axios from 'axios';
import type { FunctionHandler } from '../index';

interface GeocodeResult {
    lat: number;
    lon: number;
}

const GEOCODE_ENDPOINT = 'https://graphhopper.com/api/1/geocode';
const ROUTE_ENDPOINT = 'https://graphhopper.com/api/1/route';

const lookupSecret = (secrets: Record<string, string>): string | undefined => {
    return (
        secrets.graphhopper ||
        secrets.GRAPHOPPER ||
        secrets.GRAPHOPPER_API_KEY ||
        secrets.graphhopper_api_key
    );
};

const geocode = async (address: string, apiKey: string): Promise<GeocodeResult> => {
    const response = await axios.get(GEOCODE_ENDPOINT, {
        params: {
            q: address,
            limit: 1,
            key: apiKey,
        },
        timeout: 15000,
    });

    const hit = response.data?.hits?.[0];
    if (!hit) {
        throw new Error(`GraphHopper geocoding returned no results for "${address}"`);
    }

    return {
        lat: hit.point?.lat,
        lon: hit.point?.lng ?? hit.point?.lon,
    };
};

export const graphhopperDistanceHandler: FunctionHandler = {
    name: 'calculate_distance_graphhopper',
    description: 'Calculate driving distance between two addresses using the GraphHopper API. Requires a secret named "graphhopper" (or GRAPHOPPER / GRAPHOPPER_API_KEY) with your API key.',
    parameters: {
        type: 'object',
        properties: {
            origin: {
                type: 'string',
                description: 'Origin address or place name, e.g. "Paris, France"',
            },
            destination: {
                type: 'string',
                description: 'Destination address or place name, e.g. "Berlin, Germany"',
            },
            profile: {
                type: 'string',
                description: 'Travel profile: car, foot, bike, etc. Defaults to "car".',
                enum: ['car', 'car_hgv', 'foot', 'hike', 'bike', 'mtb', 'racingbike', 'scooter'],
            },
            locale: {
                type: 'string',
                description: 'Locale for the instructions (e.g. "en"). Defaults to "en".',
            },
        },
        required: ['origin', 'destination'],
        additionalProperties: false,
    },
    metadata: {
        requiredSecrets: ['graphhopper'],
        docsUrl: 'https://docs.graphhopper.com/#section/Authentication',
        apiKeyUrl: 'https://www.graphhopper.com/my-account/create-api-key',
        setupInstructions: '1. Erstelle einen Account auf graphhopper.com\n2. Generiere einen API Key\n3. Füge den Key als Secret "graphhopper" hinzu',
    },
    async execute(args, context) {
        const apiKey = lookupSecret(context.secrets);
        if (!apiKey) {
            throw new Error(
                'GraphHopper API key not found. Add a secret named "graphhopper" (or GRAPHOPPER/GRAPHOPPER_API_KEY).'
            );
        }

        const origin = args?.origin;
        const destination = args?.destination;

        if (typeof origin !== 'string' || typeof destination !== 'string') {
            throw new Error('Both "origin" and "destination" must be provided as strings.');
        }

        const profile =
            typeof args?.profile === 'string' && args.profile.trim() !== ''
                ? args.profile.trim()
                : 'car';

        const locale =
            typeof args?.locale === 'string' && args.locale.trim() !== ''
                ? args.locale.trim()
                : 'en';

        const [originPoint, destinationPoint] = await Promise.all([
            geocode(origin, apiKey),
            geocode(destination, apiKey),
        ]);

        const routeResponse = await axios.get(ROUTE_ENDPOINT, {
            params: {
                key: apiKey,
                profile,
                locale,
                calc_points: false,
                instructions: false,
                point: [
                    `${originPoint.lat},${originPoint.lon}`,
                    `${destinationPoint.lat},${destinationPoint.lon}`,
                ],
            },
            paramsSerializer: params => {
                // Axios doesn't automatically handle array params for GraphHopper's repeated "point"
                const parts: string[] = [];
                Object.entries(params).forEach(([key, value]) => {
                    if (Array.isArray(value)) {
                        value.forEach(v => parts.push(`${key}=${encodeURIComponent(String(v))}`));
                    } else if (value !== undefined && value !== null) {
                        parts.push(`${key}=${encodeURIComponent(String(value))}`);
                    }
                });
                return parts.join('&');
            },
            timeout: 15000,
        });

        const path = routeResponse.data?.paths?.[0];
        if (!path) {
            throw new Error('GraphHopper route API returned no paths.');
        }

        const distanceMeters = path.distance;
        const distanceKm = typeof distanceMeters === 'number' ? distanceMeters / 1000 : null;
        const timeMillis = path.time;
        const durationMinutes = typeof timeMillis === 'number' ? timeMillis / 1000 / 60 : null;

        return {
            status: 'success',
            origin: {
                query: origin,
                lat: originPoint.lat,
                lon: originPoint.lon,
            },
            destination: {
                query: destination,
                lat: destinationPoint.lat,
                lon: destinationPoint.lon,
            },
            profile,
            locale,
            distance_km: distanceKm,
            distance_m: distanceMeters,
            duration_minutes: durationMinutes,
            provider: 'graphhopper',
            message: `Estimated ${profile} trip from ${origin} to ${destination}`,
            raw: routeResponse.data,
        };
    },
};


