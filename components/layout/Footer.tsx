export function Footer() {
  return (
    <footer className="w-full py-12 px-6 md:px-8" style={{ borderTop: '1px solid var(--color-border)' }}>
      <div className="max-w-4xl mx-auto space-y-4">
        <p className="text-base leading-relaxed" style={{ color: 'var(--color-muted)' }}>
          Reviu nace sin inversores, sin publicidad y sin agenda oculta.
          Solo personas, objetos y voluntad de cambiar algo.
        </p>
        <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
          © {new Date().getFullYear()} Reviu
        </p>
      </div>
    </footer>
  );
}
