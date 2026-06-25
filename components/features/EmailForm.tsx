const MAILCHIMP_URL =
  'https://gmail.us3.list-manage.com/subscribe/post?u=a3ad581c8ea4c95dc89077764&id=6cdb696d18&f_id=00195ae2f0';

// Honeypot anti-bot de Mailchimp: campo de texto fuera de pantalla que un
// humano nunca rellena. El nombre es b_<u>_<id> y debe ir vacío.
const HONEYPOT_NAME = 'b_a3ad581c8ea4c95dc89077764_6cdb696d18';

export function EmailForm() {
  return (
    <form
      action={MAILCHIMP_URL}
      method="post"
      target="_blank"
      className="w-full max-w-md space-y-4"
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

      {/* Honeypot: oculto a usuarios reales, no a bots. */}
      <div aria-hidden="true" style={{ position: 'absolute', left: '-5000px' }}>
        <input type="text" name={HONEYPOT_NAME} tabIndex={-1} defaultValue="" />
      </div>
    </form>
  );
}
