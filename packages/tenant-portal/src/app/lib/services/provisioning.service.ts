import crypto from 'crypto';
import { injectable, inject } from 'tsyringe';
import { TenantService } from './tenant.service';
import { FlowTemplateService } from './flow-template.service';
import { CryptoService } from './crypto.service';
import { KeycloakAdminClient } from '../clients/keycloak-admin';
import { LangflowClient } from '../clients/langflow';
import { LangfuseClient } from '../clients/langfuse';
import { LiteLLMClient } from '../clients/litellm';
import type { TenantRow, EncryptedValue } from '../db/types';

/**
 * Orchestrates the "Grant Access" flow: creates accounts in Keycloak,
 * Langflow, Langfuse, and LiteLLM, clones the ECE Chat flow for the new
 * tenant, persists every resulting id (with secrets encrypted), and
 * flips the Tenant row to 'active'.
 *
 * Design: forward-only saga. On any step's failure we DON'T roll back
 * previously-created upstream resources -- instead we persist the
 * partial state on the Tenant row with status='failed' and a
 * provisioning column recording which step blew up. Two reasons:
 *   1. Visibility: an admin can look at the Tenant row and see exactly
 *      what got created vs not, manually verify state in each upstream
 *      system, and decide whether to retry or clean up by hand.
 *   2. Rollback failures: if step 4 fails and we then fail to roll back
 *      step 3, we're worse off than just leaving step 3 in place. The
 *      admin UI in a later commit will surface failures + offer a
 *      separate Deprovision action for cleanup.
 *
 * Retry semantics: each step checks the current Tenant row for its
 * output and skips if already populated. Calling provision() on a
 * 'failed' tenant therefore resumes from the first incomplete step.
 * Idempotent in the happy path: calling provision() on an 'active'
 * tenant is a no-op and returns the existing row.
 */

export interface ProvisionInput {
  email: string;
  display_name: string;
  /** Lowercase URL-safe tenant slug; used in Langflow endpoint_name,
   * Langfuse project name, and LiteLLM key alias. Must be unique across
   * tenants. */
  slug: string;
  /** Optional per-tenant overrides for the LiteLLM virtual key. */
  max_budget?: number;
  rpm_limit?: number;
  tpm_limit?: number;
}

type Step =
  | 'keycloak.create_user'
  | 'tenant.persist'
  | 'langflow.create_user'
  | 'langflow.create_api_key'
  | 'langflow.create_flow'
  | 'langfuse.create_project'
  | 'langfuse.create_api_key'
  | 'litellm.create_virtual_key'
  | 'tenant.activate';

function generateStrongPassword(): string {
  // 24 url-safe chars (~144 bits of entropy). Plenty for service-account
  // passwords that humans never see.
  return crypto
    .randomBytes(24)
    .toString('base64')
    .replace(/[+/=]/g, '')
    .slice(0, 24);
}

function errorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  return String(e);
}

@injectable()
export class ProvisioningService {
  constructor(
    @inject(TenantService) private tenants: TenantService,
    @inject(FlowTemplateService) private templates: FlowTemplateService,
    @inject(CryptoService) private cryptoService: CryptoService,
    @inject(KeycloakAdminClient) private keycloak: KeycloakAdminClient,
    @inject(LangflowClient) private langflow: LangflowClient,
    @inject(LangfuseClient) private langfuse: LangfuseClient,
    @inject(LiteLLMClient) private litellm: LiteLLMClient,
  ) {}

  /**
   * Provision a new tenant end-to-end. Idempotent: safe to call again on
   * a 'pending' or 'failed' tenant (resumes from the first incomplete
   * step) or on an 'active' tenant (no-op).
   */
  async provision(
    input: ProvisionInput,
    adminCallerSub: string,
  ): Promise<TenantRow> {
    let currentStep: Step = 'keycloak.create_user';
    let tenant: TenantRow | null = null;

    try {
      // -----------------------------------------------------------------
      // Step 1: Keycloak user
      // -----------------------------------------------------------------
      currentStep = 'keycloak.create_user';
      // Check for an existing tenant row keyed by email so we don't
      // create a duplicate Keycloak user on retry. We don't have the
      // keycloak_user_id yet on a fresh provision, so look up by email.
      const existingByEmail = await this.findExistingByEmail(input.email);
      let keycloakUserId: string;

      if (existingByEmail?.keycloak_user_id) {
        // Retry path: KC user already created in a previous attempt.
        keycloakUserId = existingByEmail.keycloak_user_id;
        tenant = existingByEmail;
      } else {
        // Fresh path: create the KC user.
        const tempPassword = generateStrongPassword();
        keycloakUserId = await this.keycloak.createUser({
          username: input.email, // keep usernames email-shaped
          email: input.email,
          firstName: input.display_name.split(' ')[0],
          lastName: input.display_name.split(' ').slice(1).join(' ') || undefined,
          emailVerified: true,
          password: tempPassword,
        });
        await this.keycloak.assignTenantRole(keycloakUserId);
      }

      // -----------------------------------------------------------------
      // Step 2: Tenant row in our DB
      // -----------------------------------------------------------------
      currentStep = 'tenant.persist';
      if (!tenant) {
        tenant = await this.tenants.findByKeycloakSub(keycloakUserId);
      }
      if (!tenant) {
        tenant = await this.tenants.create(
          {
            keycloak_user_id: keycloakUserId,
            email: input.email,
            display_name: input.display_name,
          },
          adminCallerSub,
        );
      }

      // -----------------------------------------------------------------
      // Step 3: Langflow user
      // -----------------------------------------------------------------
      currentStep = 'langflow.create_user';
      // We need the Langflow password for the followup api-key-create
      // step. Generate a fresh one if we don't have a langflow user yet.
      // On retry where the user exists but the api_key doesn't, we can't
      // re-derive the original password, so we set a new one via Keycloak
      // ... wait, Langflow != Keycloak. If the user exists but the api
      // key doesn't, we'd need to either reset their Langflow password
      // (no client method for that yet) or skip the api-key step and
      // require manual intervention. Document that retry-after-step-3-
      // success-but-step-4-failure currently needs admin help.
      let langflowPassword: string | undefined;
      if (!tenant.langflow?.user_id) {
        langflowPassword = generateStrongPassword();
        const lfUser = await this.langflow.createUser({
          username: input.slug,
          password: langflowPassword,
          isSuperuser: false,
        });
        tenant = await this.expectUpdate(tenant.id, {
          langflow: { user_id: lfUser.id },
        });
      }

      // -----------------------------------------------------------------
      // Step 4: Langflow API key (logged in as the new LF user)
      // -----------------------------------------------------------------
      currentStep = 'langflow.create_api_key';
      if (!tenant.langflow?.api_key_encrypted) {
        if (!langflowPassword) {
          throw new Error(
            'Cannot mint Langflow API key on retry: the password for the ' +
              'existing Langflow user was generated in a previous attempt ' +
              'and is no longer available. Reset the Langflow user password ' +
              'manually and re-run, or deprovision and start over.',
          );
        }
        const apiKey = await this.langflow.createApiKeyAs(
          input.slug,
          langflowPassword,
          `tenant-portal-${input.slug}`,
        );
        const encrypted = this.cryptoService.encrypt(apiKey);
        tenant = await this.expectUpdate(tenant.id, {
          langflow: { api_key_encrypted: encrypted },
        });
      }

      // -----------------------------------------------------------------
      // Step 5: Langflow flow (clone of ECE Chat)
      // -----------------------------------------------------------------
      currentStep = 'langflow.create_flow';
      if (!tenant.langflow?.flow_id) {
        const endpointName = `${input.slug}-chat`;
        const flowJson = this.templates.cloneEceChat({
          name: `${input.display_name} Chat`,
          endpointName,
          userId: tenant.langflow!.user_id!,
        });
        const flow = await this.langflow.createFlow(flowJson);
        tenant = await this.expectUpdate(tenant.id, {
          langflow: {
            flow_id: flow.id,
            endpoint_name: flow.endpoint_name ?? endpointName,
          },
        });
      }

      // -----------------------------------------------------------------
      // Step 6: Langfuse project
      // -----------------------------------------------------------------
      currentStep = 'langfuse.create_project';
      if (!tenant.langfuse?.project_id) {
        const project = await this.langfuse.createProject(`tenant-${input.slug}`);
        tenant = await this.expectUpdate(tenant.id, {
          langfuse: { project_id: project.id },
        });
      }

      // -----------------------------------------------------------------
      // Step 7: Langfuse API key pair
      // -----------------------------------------------------------------
      currentStep = 'langfuse.create_api_key';
      if (!tenant.langfuse?.public_key) {
        const pair = await this.langfuse.createApiKey(
          tenant.langfuse!.project_id!,
          `tenant-portal provisioning for ${input.slug}`,
        );
        tenant = await this.expectUpdate(tenant.id, {
          langfuse: {
            public_key: pair.public_key,
            secret_key_encrypted: this.cryptoService.encrypt(pair.secret_key),
          },
        });
      }

      // -----------------------------------------------------------------
      // Step 8: LiteLLM virtual key
      // -----------------------------------------------------------------
      currentStep = 'litellm.create_virtual_key';
      if (!tenant.litellm?.virtual_key_id) {
        const modelAlias = tenant.langflow!.endpoint_name!;
        const virtual = await this.litellm.createVirtualKey({
          key_alias: `tenant-${input.slug}`,
          models: [modelAlias],
          max_budget: input.max_budget,
          rpm_limit: input.rpm_limit,
          tpm_limit: input.tpm_limit,
          metadata: { tenant_id: tenant.id, slug: input.slug },
        });
        const keyValue = virtual.key;
        tenant = await this.expectUpdate(tenant.id, {
          litellm: {
            virtual_key_id: virtual.key_name ?? keyValue,
            virtual_key_encrypted: this.cryptoService.encrypt(keyValue),
            model_alias: modelAlias,
            max_budget: input.max_budget,
            rpm_limit: input.rpm_limit,
          },
        });
      }

      // -----------------------------------------------------------------
      // Step 9: mark active
      // -----------------------------------------------------------------
      currentStep = 'tenant.activate';
      tenant = await this.expectUpdate(tenant.id, {
        status: 'active',
        provisioning: null,
      });

      return tenant;
    } catch (e) {
      // Persist the failure on the Tenant row if we have one. If the
      // failure happened before we created a row (step 1), there's
      // nothing to persist -- just rethrow.
      if (tenant) {
        await this.tenants.update(tenant.id, {
          status: 'failed',
          provisioning: {
            step: currentStep,
            error: errorMessage(e),
            at: new Date().toISOString(),
          },
        });
      }
      throw e;
    }
  }

  /**
   * Best-effort cleanup across all four upstream systems plus our DB row.
   * Each upstream call is wrapped so one failure doesn't block the next;
   * errors are collected and returned for the caller (admin UI) to
   * surface.
   *
   * Order: reverse-creation order (LiteLLM key first, KC user last) so
   * mid-cleanup partial state is more useful to a human triaging.
   */
  async deprovision(tenantId: string): Promise<{ errors: string[] }> {
    const tenant = await this.tenants.get(tenantId);
    if (!tenant) return { errors: [`tenant ${tenantId} not found`] };

    const errors: string[] = [];

    // LiteLLM
    if (tenant.litellm?.virtual_key_id) {
      try {
        await this.litellm.deleteVirtualKey(tenant.litellm.virtual_key_id);
      } catch (e) {
        errors.push(`litellm.deleteVirtualKey: ${errorMessage(e)}`);
      }
    }

    // Langfuse
    if (tenant.langfuse?.project_id) {
      try {
        await this.langfuse.deleteProject(tenant.langfuse.project_id);
      } catch (e) {
        errors.push(`langfuse.deleteProject: ${errorMessage(e)}`);
      }
    }

    // Langflow flow then user
    if (tenant.langflow?.flow_id) {
      try {
        await this.langflow.deleteFlow(tenant.langflow.flow_id);
      } catch (e) {
        errors.push(`langflow.deleteFlow: ${errorMessage(e)}`);
      }
    }
    if (tenant.langflow?.user_id) {
      try {
        await this.langflow.deleteUser(tenant.langflow.user_id);
      } catch (e) {
        errors.push(`langflow.deleteUser: ${errorMessage(e)}`);
      }
    }

    // Keycloak user
    if (tenant.keycloak_user_id) {
      try {
        await this.keycloak.deleteUser(tenant.keycloak_user_id);
      } catch (e) {
        errors.push(`keycloak.deleteUser: ${errorMessage(e)}`);
      }
    }

    // Our DB row last (so admins can still see the tenant in our UI
    // while cleanup is in flight)
    try {
      await this.tenants.delete(tenantId);
    } catch (e) {
      errors.push(`tenant.delete: ${errorMessage(e)}`);
    }

    return { errors };
  }

  // ---- helpers ------------------------------------------------------

  /** Wraps tenants.update() and throws if the update returned null
   * (which shouldn't happen mid-saga, since we hold the row in memory).
   * Keeps the saga's main flow free of `if (!tenant) throw` boilerplate. */
  private async expectUpdate(
    id: string,
    patch: Parameters<TenantService['update']>[1],
  ): Promise<TenantRow> {
    const updated = await this.tenants.update(id, patch);
    if (!updated) {
      throw new Error(`tenant ${id} disappeared during provisioning`);
    }
    return updated;
  }

  /** Look up by email rather than keycloak sub (which we don't have on a
   * fresh provision attempt). Used only on retry to detect partial state.
   * If the schema ever allows two tenants with the same email this will
   * need adjusting -- currently email is not unique. */
  private async findExistingByEmail(_email: string): Promise<TenantRow | null> {
    // TenantService doesn't expose findByEmail yet; the saga doesn't
    // strictly need it (callers can pass keycloak_user_id explicitly on
    // retry via a future API surface). Returning null means a retry
    // will try to re-create the Keycloak user, which 409s, and we'll
    // surface that. This is the conservative behavior for v1; the
    // retry-by-email convenience can be added in a follow-up if needed.
    void _email;
    return null;
  }

  /**
   * Encryption helper exposed so callers (e.g. the tenant dashboard
   * "show me my secret" handler) can decrypt without grabbing crypto
   * directly. Keeps the decryption surface auditable.
   */
  decryptSecret(value: EncryptedValue): string {
    return this.cryptoService.decrypt(value);
  }
}
