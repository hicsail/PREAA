'use client';
import { useState } from 'react';
import { useSession } from 'next-auth/react';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MODEL_OPTIONS = [
  { value: 'openai/gpt-4o', label: 'GPT-4o' },
  { value: 'openai/gpt-4o-mini', label: 'GPT-4o Mini' },
  { value: 'anthropic/claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet' },
  { value: 'anthropic/claude-3-5-haiku-20241022', label: 'Claude 3.5 Haiku' }
];

const DURATION_OPTIONS = [
  { value: '30d', label: '30 days' },
  { value: '60d', label: '60 days' },
  { value: '90d', label: '90 days' }
];

const STEPS = ['Project Setup', 'Customize', 'Configure', 'Finalize'];

const LANGFLOW_URL = process.env.NEXT_PUBLIC_LANGFLOW_URL || 'http://localhost:7860';
const EMBEDDED_CHAT_URL = process.env.NEXT_PUBLIC_EMBEDDED_CHAT_URL || 'http://localhost:5173';

// ---------------------------------------------------------------------------
// LocalStorage helpers
// ---------------------------------------------------------------------------

interface LangflowAccount {
  userId: string;
  username: string;
  password: string;
}

function storageKey(email: string) {
  return `preaa_langflow_${email}`;
}

function loadAccount(email: string): LangflowAccount | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(storageKey(email));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveAccount(email: string, account: LangflowAccount) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(storageKey(email), JSON.stringify(account));
  } catch {
    // ignore
  }
}

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

interface ProvisionResult {
  langflowUserId?: string;
  langflowPassword?: string;
  folderId: string;
  flowId: string;
}

interface WizardProps {
  open: boolean;
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function OnboardingWizard({ open, onClose }: WizardProps) {
  const { data: session } = useSession();

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [projectName, setProjectName] = useState('');

  const [provisionResult, setProvisionResult] = useState<ProvisionResult | null>(null);

  const [selectedModel, setSelectedModel] = useState(MODEL_OPTIONS[0].value);
  const [budget, setBudget] = useState('10');
  const [budgetDuration, setBudgetDuration] = useState('30d');

  const [proxyId, setProxyId] = useState<string | null>(null);

  const userEmail = session?.user?.email ?? '';

  function reset() {
    setStep(0);
    setLoading(false);
    setError(null);
    setProjectName('');
    setProvisionResult(null);
    setSelectedModel(MODEL_OPTIONS[0].value);
    setBudget('10');
    setBudgetDuration('30d');
    setProxyId(null);
  }

  function handleClose() {
    reset();
    onClose();
  }

  // -------------------------------------------------------------------------
  // Step 0 → Adding Project name + log into LangFlow
  // -------------------------------------------------------------------------
  async function handleProvision() {
    if (!projectName.trim()) {
      setError('Please enter a project name.');
      return;
    }
    if (!userEmail) {
      setError('Not signed in. Please reload and sign in again.');
      return;
    }

    setLoading(true);
    setError(null);

    const existingAccount = loadAccount(userEmail);
    const isFirstTime = !existingAccount;

    try {
      const res = await fetch('/api/onboarding/provision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectName: projectName.trim(), clientEmail: userEmail, isFirstTime })
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || 'Provision failed');
      }

      const data: ProvisionResult = await res.json();
      setProvisionResult(data);

      // Persist Langflow account on first time
      if (isFirstTime && data.langflowUserId && data.langflowPassword) {
        saveAccount(userEmail, {
          userId: data.langflowUserId,
          username: userEmail,
          password: data.langflowPassword
        });
      }

      setStep(1);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  // -------------------------------------------------------------------------
  // Step 3 → Finalize
  // -------------------------------------------------------------------------
  async function handleFinalize() {
    if (!provisionResult) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/onboarding/finalize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectName: projectName.trim(),
          flowId: provisionResult.flowId,
          selectedModel,
          budget,
          budgetDuration
        })
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || 'Finalize failed');
      }

      const data = await res.json();
      setProxyId(data.proxyId);
      setStep(3);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)'
      }}
      onClick={handleClose}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 12,
          width: '100%',
          maxWidth: 560,
          padding: '2rem',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0, color: 'black' }}>Create New Widget</h2>
          <p style={{ color: '#666', margin: '0.25rem 0 0', fontSize: '0.9rem' }}>
            Step {step + 1} of {STEPS.length} — {STEPS[step]}
          </p>
        </div>

        <StepIndicator current={step} steps={STEPS} />

        {error && (
          <div
            style={{
              background: '#fee2e2',
              color: '#991b1b',
              borderRadius: 8,
              padding: '0.75rem 1rem',
              marginBottom: '1rem',
              fontSize: '0.875rem'
            }}
          >
            {error}
          </div>
        )}

        {step === 0 && (
          <Step0
            projectName={projectName}
            onProjectNameChange={setProjectName}
            onNext={handleProvision}
            loading={loading}
          />
        )}

        {step === 1 && provisionResult && (
          <Step1
            flowId={provisionResult.flowId}
            langflowUrl={LANGFLOW_URL}
            onNext={() => setStep(2)}
          />
        )}

        {step === 2 && (
          <Step2
            selectedModel={selectedModel}
            onModelChange={setSelectedModel}
            budget={budget}
            onBudgetChange={setBudget}
            budgetDuration={budgetDuration}
            onDurationChange={setBudgetDuration}
            onBack={() => setStep(1)}
            onFinalize={handleFinalize}
            loading={loading}
          />
        )}

        {step === 3 && proxyId && (
          <Step3
            proxyId={proxyId}
            embeddedChatUrl={EMBEDDED_CHAT_URL}
            onClose={handleClose}
          />
        )}

        {step !== 3 && (
          <button
            onClick={handleClose}
            style={{
              position: 'absolute',
              top: '1rem',
              right: '1rem',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '1.25rem',
              color: '#999',
              lineHeight: 1
            }}
            aria-label="Close"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step indicator
// ---------------------------------------------------------------------------

function StepIndicator({ current, steps }: { current: number; steps: string[] }) {
  return (
    <div style={{ display: 'flex', gap: 4, marginBottom: '1.5rem' }}>
      {steps.map((_, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            height: 4,
            borderRadius: 2,
            background: i <= current ? '#3b82f6' : '#e5e7eb',
            transition: 'background 0.3s'
          }}
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 0: Project Setup
// ---------------------------------------------------------------------------

function Step0({
  projectName,
  onProjectNameChange,
  onNext,
  loading
}: {
  projectName: string;
  onProjectNameChange: (v: string) => void;
  onNext: () => void;
  loading: boolean;
}) {
  return (
    <div>
      <p style={{ color: '#555', marginBottom: '1.25rem', fontSize: '0.9rem' }}>
        Give your chatbot project a name. We&apos;ll set up a Langflow project and upload the starter
        template automatically.
      </p>
      <label style={labelStyle}>
        Project Name
        <input
          type="text"
          value={projectName}
          onChange={(e) => onProjectNameChange(e.target.value)}
          placeholder="e.g. My Support Bot"
          style={inputStyle}
          onKeyDown={(e) => e.key === 'Enter' && !loading && onNext()}
          autoFocus
        />
      </label>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
        <PrimaryButton onClick={onNext} loading={loading} disabled={!projectName.trim()}>
          Set Up Project
        </PrimaryButton>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 1: Customize in Langflow
// ---------------------------------------------------------------------------

function Step1({
  flowId,
  langflowUrl,
  onNext
}: {
  flowId: string;
  langflowUrl: string;
  onNext: () => void;
}) {
  return (
    <div>
      <div
        style={{
          background: '#f0fdf4',
          border: '1px solid #86efac',
          borderRadius: 8,
          padding: '0.75rem 1rem',
          marginBottom: '1.25rem',
          fontSize: '0.875rem',
          color: '#15803d'
        }}
      >
        Project created successfully! Your starter chatbot template has been uploaded.
      </div>
      <p style={{ color: '#555', marginBottom: '1.25rem', fontSize: '0.9rem' }}>
        Optionally open Langflow to customize your chatbot flow. When you&apos;re ready, click{' '}
        <strong>I&apos;m Ready</strong> to continue.
      </p>
      <a
        href={`${langflowUrl}/flow/${flowId}`}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'inline-block',
          padding: '0.5rem 1rem',
          background: '#f3f4f6',
          border: '1px solid #d1d5db',
          borderRadius: 6,
          color: '#111',
          textDecoration: 'none',
          fontSize: '0.875rem',
          marginBottom: '1.5rem'
        }}
      >
        Open Langflow to Customize ↗
      </a>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <PrimaryButton onClick={onNext}>I&apos;m Ready</PrimaryButton>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 2: Configure model + budget
// ---------------------------------------------------------------------------

function Step2({
  selectedModel,
  onModelChange,
  budget,
  onBudgetChange,
  budgetDuration,
  onDurationChange,
  onBack,
  onFinalize,
  loading
}: {
  selectedModel: string;
  onModelChange: (v: string) => void;
  budget: string;
  onBudgetChange: (v: string) => void;
  budgetDuration: string;
  onDurationChange: (v: string) => void;
  onBack: () => void;
  onFinalize: () => void;
  loading: boolean;
}) {
  return (
    <div>
      <p style={{ color: '#555', marginBottom: '1.25rem', fontSize: '0.9rem' }}>
        Choose the underlying LLM model and set a usage budget for your chatbot.
      </p>

      <label style={labelStyle}>
        Underlying Model
        <select value={selectedModel} onChange={(e) => onModelChange(e.target.value)} style={inputStyle}>
          {MODEL_OPTIONS.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
      </label>

      <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
        <label style={{ ...labelStyle, flex: 1 }}>
          Budget (USD)
          <input
            type="number"
            min="1"
            step="1"
            value={budget}
            onChange={(e) => onBudgetChange(e.target.value)}
            style={inputStyle}
          />
        </label>
        <label style={{ ...labelStyle, flex: 1 }}>
          Duration
          <select
            value={budgetDuration}
            onChange={(e) => onDurationChange(e.target.value)}
            style={inputStyle}
          >
            {DURATION_OPTIONS.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem' }}>
        <button onClick={onBack} style={secondaryButtonStyle} disabled={loading}>
          Back
        </button>
        <PrimaryButton onClick={onFinalize} loading={loading} disabled={!budget || Number(budget) <= 0}>
          Finalize
        </PrimaryButton>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 3: Done — link to embedded chat
// ---------------------------------------------------------------------------

function Step3({
  proxyId,
  embeddedChatUrl,
  onClose
}: {
  proxyId: string;
  embeddedChatUrl: string;
  onClose: () => void;
}) {
  const link = `${embeddedChatUrl}?modelId=${proxyId}`;

  return (
    <div style={{ textAlign: 'center' }}>
      <h3 style={{ fontWeight: 700, fontSize: '1.2rem', marginBottom: '0.5rem', color: 'black' }}>
        Your chatbot is ready!
      </h3>
      <p style={{ color: '#555', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
        Head to the embed page to get your script tag and configure the widget appearance.
      </p>
      <a
        href={link}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'inline-block',
          padding: '0.625rem 1.25rem',
          background: '#3b82f6',
          color: '#fff',
          borderRadius: 8,
          textDecoration: 'none',
          fontWeight: 600,
          fontSize: '0.9rem',
          marginBottom: '1rem'
        }}
      >
        Go to Embed Page ↗
      </a>
      <div>
        <button onClick={onClose} style={{ ...secondaryButtonStyle, marginTop: '0.5rem' }}>
          Close
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared styles & small components
// ---------------------------------------------------------------------------

const labelStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  fontSize: '0.875rem',
  fontWeight: 600,
  color: '#374151'
};

const inputStyle: React.CSSProperties = {
  padding: '0.5rem 0.75rem',
  border: '1px solid #d1d5db',
  borderRadius: 6,
  fontSize: '0.9rem',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
  background: '#fff'
};

const secondaryButtonStyle: React.CSSProperties = {
  padding: '0.5rem 1rem',
  background: '#f3f4f6',
  border: '1px solid black',
  borderRadius: 6,
  cursor: 'pointer',
  fontSize: '0.875rem',
  color: 'black',
  fontWeight: 500
};

function PrimaryButton({
  children,
  onClick,
  loading,
  disabled
}: {
  children: React.ReactNode;
  onClick: () => void;
  loading?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        padding: '0.5rem 1.25rem',
        background: disabled || loading ? '#93c5fd' : '#3b82f6',
        color: '#fff',
        border: 'none',
        borderRadius: 6,
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        fontSize: '0.875rem',
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center',
        gap: 6
      }}
    >
      {loading && (
        <span
          style={{
            width: 14,
            height: 14,
            border: '2px solid rgba(255,255,255,0.4)',
            borderTopColor: '#fff',
            borderRadius: '50%',
            display: 'inline-block',
            animation: 'spin 0.7s linear infinite'
          }}
        />
      )}
      {children}
    </button>
  );
}
