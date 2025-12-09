import { registerWebSearchHandler } from './index';
import { serperWebSearchHandler } from './handlers/serperWebSearchHandler';
import { customWebSearchHandler } from './handlers/customWebSearchHandler';
import { autoWebSearchHandler } from './handlers/autoWebSearchHandler';

export function registerBuiltInWebSearchHandlers() {
    registerWebSearchHandler(autoWebSearchHandler);
    registerWebSearchHandler(serperWebSearchHandler);
    registerWebSearchHandler(customWebSearchHandler);
}
