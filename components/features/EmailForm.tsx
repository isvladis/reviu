'use client';

import { useRef, type FormEvent } from 'react';

const MAILCHIMP_URL =
  'https://gmail.us3.list-manage.com/subscribe/post?u=a3ad581c8ea4c95dc89077764&id=6cdb696d18&f_id=00195ae2f0';

export function EmailForm() {
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const form = formRef.current;
    if (!form) return;
    const email = form.EMAIL as unknown as HTMLInputElement;
    if (!email.value) return;
    // Build a plain HTML form outside React and submit it natively
    const nativeForm = document.createElement('form');
    nativeForm.method = 'POST';
    nativeForm.action = MAILCHIMP_URL;
    nativeForm.target = '_blank';
    nativeForm.style.display = 'none';

    const emailInput = document.createElement('input');
    emailInput.name = 'EMAIL';
    emailInput.value = email.value;
    nativeForm.appendChild(emailInput);

    const honeypot = document.createElement('input');
    honeypot.name = 'b_a3ad581c8ea4c95dc89077764_6cdb696d18';
    honeypot.value = '';
    nativeForm.appendChild(honeypot);

    document.body.appendChild(nativeForm);
    nativeForm.submit();
    document.body.removeChild(nativeForm);
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="w-full max-w-md space-y-4"
      noValidate
    >
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="email"
          name="EMAIL"
          required
          placeholder="tu@email.com"
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
          className="px-6 py-3 rounded-lg text-base font-medium text-white transition-colors cursor-pointer"
          style={{ backgroundColor: 'var(--color-accent)' }}
        >
          Unirme
        </button>
      </div>
    </form>
  );
}
