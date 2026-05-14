import 'reflect-metadata';
import { container } from 'tsyringe';
import { CryptoService } from './services/crypto.service';
import { TenantService } from './services/tenant.service';
import { FlowTemplateService } from './services/flow-template.service';
import { KeycloakAdminClient } from './clients/keycloak-admin';
import { LangflowClient } from './clients/langflow';
import { LangfuseClient } from './clients/langfuse';
import { LiteLLMClient } from './clients/litellm';

/**
 * tsyringe DI registry. Services and integration clients are registered as
 * singletons so each request reuses the same instances (cheap object reuse,
 * and important for the Keycloak admin client's in-memory token cache).
 *
 * Auto-registered classes only need to be imported here -- @injectable on
 * each does the rest. registerSingleton is explicit to make the lifetime
 * obvious at the registry site.
 */
container.registerSingleton(CryptoService);
container.registerSingleton(TenantService);
container.registerSingleton(FlowTemplateService);
container.registerSingleton(KeycloakAdminClient);
container.registerSingleton(LangflowClient);
container.registerSingleton(LangfuseClient);
container.registerSingleton(LiteLLMClient);

export { container };

// Resolver helpers -- callers should prefer these over touching tsyringe
// directly, so swapping the DI library later is a single-file change.
export const getCrypto = () => container.resolve(CryptoService);
export const getTenantService = () => container.resolve(TenantService);
export const getFlowTemplateService = () => container.resolve(FlowTemplateService);
export const getKeycloakAdminClient = () => container.resolve(KeycloakAdminClient);
export const getLangflowClient = () => container.resolve(LangflowClient);
export const getLangfuseClient = () => container.resolve(LangfuseClient);
export const getLiteLLMClient = () => container.resolve(LiteLLMClient);
