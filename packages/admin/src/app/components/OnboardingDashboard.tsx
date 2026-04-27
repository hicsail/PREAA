'use client';
import { useState } from 'react';
import { Title } from 'react-admin';
import { OnboardingWizard } from './onboarding/Onboarding';

export function OnboardingDashboard() {
  const [wizardOpen, setWizardOpen] = useState(false);

  return (
    <div style={{ padding: '2rem' }}>
      <Title title="Dashboard" />
      <h2 style={{ fontWeight: 700, fontSize: '1.5rem', marginBottom: '0.5rem' }}>Welcome</h2>
      <p style={{ color: '#555', marginBottom: '2rem', fontSize: '0.95rem' }}>
        Use the panel on the left to manage models and proxies, or create a new chatbot widget below.
      </p>
      <button
        onClick={() => setWizardOpen(true)}
        style={{
          padding: '0.75rem 1.5rem',
          background: '#3b82f6',
          color: '#fff',
          border: 'none',
          borderRadius: 8,
          cursor: 'pointer',
          fontWeight: 600,
          fontSize: '0.95rem'
        }}
      >
        + Create New Widget
      </button>
      <OnboardingWizard open={wizardOpen} onClose={() => setWizardOpen(false)} />
    </div>
  );
}
