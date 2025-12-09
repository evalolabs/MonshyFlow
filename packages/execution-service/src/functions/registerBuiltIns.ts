import { registerFunction } from './index';
import { graphhopperDistanceHandler } from './tools/graphhopperDistance';

export function registerBuiltInFunctionHandlers() {
    registerFunction(graphhopperDistanceHandler);
}

