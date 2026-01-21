import { registerWebSearchHandler } from './index';
import { serperWebSearchHandler } from './handlers/serperWebSearchHandler';
import { openaiWebSearchHandler } from './handlers/openaiWebSearchHandler';

export function registerBuiltInWebSearchHandlers() {
    registerWebSearchHandler(openaiWebSearchHandler);
    registerWebSearchHandler(serperWebSearchHandler);
}
