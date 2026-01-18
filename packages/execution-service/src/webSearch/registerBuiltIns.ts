import { registerWebSearchHandler } from './index';
import { serperWebSearchHandler } from './handlers/serperWebSearchHandler';

export function registerBuiltInWebSearchHandlers() {
    registerWebSearchHandler(serperWebSearchHandler);
}
