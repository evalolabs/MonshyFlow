import { registerFunction } from './index';
import { graphhopperDistanceHandler } from './tools/graphhopperDistance';
import { openWeatherFunctionHandler } from './tools/openWeatherFunction';
import { emailFunctionHandler } from './tools/emailFunction';

export function registerBuiltInFunctionHandlers() {
    registerFunction(graphhopperDistanceHandler);
    registerFunction(openWeatherFunctionHandler);
    registerFunction(emailFunctionHandler);
}

