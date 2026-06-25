'use client';

import { useState, type FormEvent } from 'react';

type Status = 'idle' | 'loading' | 'success' | 'error';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function EmailForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');

  const mailchimpUrl = process.env.NEXT_PUBLIC_MAILCHIMP_URL;

  if (!mailchimpUrl) {
    return (
      <div className="w-full max-w-md">
        <p className="text-base" style={{ color: 'var(--color-muted)' }}>
          Formulario disponible próximamente.
        </p>
      </div>
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (!EMAIL_RE.test(email)) return;

    setStatus('loading');

    try {
      const formData = new URLSearchParams();
      formData.append('EMAIL', email);

      await fetch(mailchimpUrl!, {
        method: 'POST',
        body: formData,
        mode: 'no-cors',
      });

      setStatus('success');
      setEmail('');
    } catch {
      setStatus('error');
    }
  }

  if (status === 'success') {
    return (
      <div className="w-full max-w-md">
        <p className="text-lg font-medium" style={{ color: 'var(--color-accent)' }}>
          ¡Apuntado! Te avisamos cuando abramos.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4" noValidate>
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="email"
          required
          placeholder="tu@email.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (status === 'error') setStatus('idle');
          }}
          className="flex-1 px-4 py-3 rounded-lg text-base border outline-none transition-colors focus:ring-2"
          style={{
            borderColor: 'var(--color-border)',
            backgroundColor: 'white',
            color: 'var(--color-text)',
          }}
          aria-label="Correo electrónico"
        />
        <button
          type="submit"
          disabled={status === 'loading' || !EMAIL_RE.test(email)}
          className="px-6 py-3 rounded-lg text-base font-medium text-white transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
          style={{ backgroundColor: 'var(--color-accent)' }}
        >
          {status === 'loading' ? 'Enviando…' : 'Unirme'}
        </button>
      </div>
      {status === 'error' && (
        <p className="text-sm" style={{ color: '#B91C1C' }}>
          Algo ha fallado. Inténtalo de nuevo.
        </p>
      )}
    </form>
  );
}
