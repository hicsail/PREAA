import 'reflect-metadata';
import { container } from 'tsyringe';
import { CryptoService } from './services/crypto.service';
import { TenantService } from './services/tenant.service';

/**
 * tsyringe DI registry. Services are registered as singletons so each
 * request reuses the same instances (and so the Mongo connection cache in
 * mongo.ts isn't bypassed).
 *
 * Services are auto-registered by their class via @injectable(), so we
 * only need to ensure the file gets imported at boot — that happens via
 * the import statements above.
 */
container.registerSingleton(CryptoService);
container.registerSingleton(TenantService);

export { container };

// Re-export resolver helpers so callers can avoid touching tsyringe directly.
export const getCrypto = () => container.resolve(CryptoService);
export const getTenantService = () => container.resolve(TenantService);
