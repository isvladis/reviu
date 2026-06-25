import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { EmailForm } from "@/components/features/EmailForm";

export default function Home() {
  return (
    <>
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="w-full px-6 md:px-8 pt-16 pb-20 md:pt-24 md:pb-28">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight tracking-tight mb-6">
              Reviu — Las cosas merecen una segunda vida
            </h1>
            <p className="text-lg md:text-xl leading-relaxed max-w-2xl" style={{ color: 'var(--color-muted)' }}>
              Un movimiento ciudadano que nace en Barcelona para cambiar la forma
              en que nos relacionamos con los objetos y con el reciclaje real.
            </p>
          </div>
        </section>

        {/* Manifiesto */}
        <section className="w-full px-6 md:px-8 py-16 md:py-20" style={{ backgroundColor: 'var(--color-bg-alt)' }}>
          <div className="max-w-4xl mx-auto space-y-6">
            <h2 className="text-2xl md:text-3xl font-semibold mb-8">Manifiesto</h2>

            <p className="text-lg leading-relaxed">
              Vivimos rodeados de cosas que ya no usamos. Las acumulamos en
              armarios, trasteros y cajones, convencidos de que algún día les
              daremos una segunda oportunidad. Mientras tanto, cada año millones
              de objetos perfectamente útiles acaban en vertederos porque no
              existe un camino fácil para devolverles la vida.
            </p>

            <p className="text-lg leading-relaxed">
              El reciclaje, tal como lo conocemos, no funciona. Separamos
              envases, vidrio, papel… pero la mayoría acaba incinerada o
              exportada. España no tiene un sistema de retorno de envases como
              Alemania, donde devuelves la botella y recuperas tu depósito. Aquí
              reciclamos la conciencia, no los materiales.
            </p>

            <p className="text-lg leading-relaxed">
              Reviu nace para cambiar eso. No somos una empresa, ni una startup,
              ni una app con inversores detrás. Somos un movimiento ciudadano.
              Creemos que cada objeto merece un destino mejor que la basura:
              reciclaje real, segunda vida en otra casa, reacondicionamiento en
              un taller del barrio o donación a quien lo necesite.
            </p>

            <p className="text-lg leading-relaxed">
              Creemos en la trazabilidad: que puedas saber qué pasó con tu
              silla, tu bicicleta o tu cafetera después de cederla. Que la
              persona que la recibe tenga nombre — un nombre de pila y un barrio,
              nada más — y que eso baste para cerrar el círculo con dignidad.
            </p>

            <p className="text-lg leading-relaxed">
              Creemos en la gobernanza democrática: nadie acumula poder, los
              roles rotan, las decisiones se votan y cualquier vecino puede vetar
              lo que considere injusto. El fundador se rige por las mismas reglas
              que todos.
            </p>

            <p className="text-lg leading-relaxed">
              Creemos en la transparencia total: sin algoritmos ocultos, sin
              datos vendidos, sin publicidad. El código es abierto, las cuentas
              son públicas y la única agenda es que las cosas dejen de acabar
              donde no deben.
            </p>

            <p className="text-lg leading-relaxed font-medium" style={{ color: 'var(--color-accent)' }}>
              Reviu es una invitación. Si crees que merece la pena intentarlo,
              únete. No hace falta más que voluntad.
            </p>
          </div>
        </section>

        {/* Formulario de email */}
        <section className="w-full px-6 md:px-8 py-16 md:py-20">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-semibold mb-3">
              Únete al movimiento
            </h2>
            <p className="text-lg mb-8" style={{ color: 'var(--color-muted)' }}>
              Sé de los primeros en saber cuándo abrimos.
            </p>
            <EmailForm />
          </div>
        </section>

        {/* CTA Change.org */}
        <section className="w-full px-6 md:px-8 py-16 md:py-20" style={{ backgroundColor: 'var(--color-bg-alt)' }}>
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-semibold mb-4">
              Firma la petición
            </h2>
            <p className="text-lg leading-relaxed mb-6" style={{ color: 'var(--color-muted)' }}>
              Exige que España adopte el sistema de retorno de envases como
              Alemania.
            </p>
            <a
              href="#"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-6 py-3 rounded-lg text-base font-medium border-2 transition-colors"
              style={{
                borderColor: 'var(--color-secondary)',
                color: 'var(--color-secondary)',
              }}
            >
              Firmar en Change.org →
            </a>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
