import Link from 'next/link';
import { ArrowLeft, FileText, Mail } from 'lucide-react';

export const metadata = {
  title: 'Términos y Condiciones | Zyro Online',
  description: 'Términos y condiciones de uso de Zyro Online.',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b">
        <div className="container mx-auto py-4">
          <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al inicio
          </Link>
        </div>
      </div>

      {/* Hero */}
      <section className="bg-muted/30 py-16">
        <div className="container mx-auto text-center">
          <FileText className="h-12 w-12 mx-auto mb-4 text-primary" />
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Términos y Condiciones
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Por favor lee estos términos cuidadosamente antes de usar nuestro sitio web.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16">
        <div className="container mx-auto max-w-4xl">
          <div className="prose prose-gray max-w-none">

            {/* Introduction */}
            <div className="mb-12">
              <p className="text-lg text-muted-foreground leading-relaxed">
                Bienvenido a Zyro Online. Al acceder o usar nuestro sitio web y servicios,
                aceptas cumplir con estos términos y condiciones. Si no estás de acuerdo
                con alguna parte de estos términos, no deberías usar nuestros servicios.
              </p>
            </div>

            {/* Section 1 */}
            <div className="mb-10">
              <h2 className="text-2xl font-bold mb-4">1. Definiciones</h2>
              <div className="space-y-4 text-muted-foreground">
                <ul className="space-y-2">
                  <li><strong>&quot;Zyro Online&quot;, &quot;nosotros&quot;, &quot;nuestro&quot;:</strong> se refiere a la empresa operadora de este sitio web.</li>
                  <li><strong>&quot;Usuario&quot;, &quot;tú&quot;, &quot;cliente&quot;:</strong> se refiere a la persona que accede o usa nuestros servicios.</li>
                  <li><strong>&quot;Productos&quot;:</strong> se refiere a los artículos disponibles para compra en nuestro sitio, incluyendo monturas, lentes y accesorios ópticos.</li>
                  <li><strong>&quot;Servicios&quot;:</strong> incluye la venta de productos, fabricación de lentes con receta y entrega.</li>
                </ul>
              </div>
            </div>

            {/* Section 2 */}
            <div className="mb-10">
              <h2 className="text-2xl font-bold mb-4">2. Uso del Sitio Web</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>Al usar nuestro sitio, te comprometes a:</p>
                <ul className="space-y-2">
                  <li>Proporcionar información veraz y precisa en tu registro y pedidos</li>
                  <li>Mantener la confidencialidad de tu cuenta y contraseña</li>
                  <li>Notificarnos inmediatamente sobre cualquier uso no autorizado de tu cuenta</li>
                  <li>No usar el sitio para fines ilegales o no autorizados</li>
                  <li>No intentar acceder a áreas restringidas del sitio</li>
                </ul>
              </div>
            </div>

            {/* Section 3 */}
            <div className="mb-10">
              <h2 className="text-2xl font-bold mb-4">3. Productos y Precios</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  <strong>3.1 Descripción de Productos:</strong> Nos esforzamos por mostrar los productos
                  de forma precisa. Sin embargo, los colores pueden variar ligeramente según tu pantalla.
                </p>
                <p>
                  <strong>3.2 Precios:</strong> Todos los precios están expresados en dólares estadounidenses (USD).
                  Nos reservamos el derecho de modificar precios sin previo aviso, pero los cambios no
                  afectarán pedidos ya confirmados.
                </p>
                <p>
                  <strong>3.3 Disponibilidad:</strong> Los productos están sujetos a disponibilidad.
                  Si un producto no está disponible después de tu compra, te contactaremos para
                  ofrecerte alternativas o un reembolso.
                </p>
              </div>
            </div>

            {/* Section 4 */}
            <div className="mb-10">
              <h2 className="text-2xl font-bold mb-4">4. Pedidos y Pagos</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  <strong>4.1 Proceso de Compra:</strong> Al realizar un pedido, estás haciendo una
                  oferta de compra. El contrato se perfecciona cuando confirmamos tu pedido por correo electrónico.
                </p>
                <p>
                  <strong>4.2 Métodos de Pago:</strong> Aceptamos pagos a través de PagueloFacil y
                  otros métodos indicados en el checkout. Todos los pagos son procesados de forma segura.
                </p>
                <p>
                  <strong>4.3 Verificación:</strong> Nos reservamos el derecho de verificar tu identidad
                  y método de pago antes de procesar pedidos, especialmente en casos de montos elevados.
                </p>
              </div>
            </div>

            {/* Section 5 */}
            <div className="mb-10">
              <h2 className="text-2xl font-bold mb-4">5. Prescripciones Ópticas</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  <strong>5.1 Responsabilidad del Usuario:</strong> Es tu responsabilidad proporcionar
                  datos de prescripción correctos y actualizados. Los errores en la prescripción
                  proporcionada son responsabilidad del cliente.
                </p>
                <p>
                  <strong>5.2 Validez:</strong> Te recomendamos que tu prescripción no tenga más de
                  2 años de antigüedad. Para prescripciones más antiguas, consulta con tu oftalmólogo.
                </p>
                <p>
                  <strong>5.3 Verificación:</strong> Nos reservamos el derecho de contactarte para
                  verificar o aclarar datos de tu prescripción antes de fabricar tus lentes.
                </p>
                <p>
                  <strong>5.4 Productos Personalizados:</strong> Los lentes graduados son productos
                  fabricados específicamente según tu prescripción. Consulta nuestra política de
                  devoluciones para conocer las condiciones aplicables.
                </p>
              </div>
            </div>

            {/* Section 6 */}
            <div className="mb-10">
              <h2 className="text-2xl font-bold mb-4">6. Envíos y Entregas</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  <strong>6.1 Tiempos de Entrega:</strong> Los tiempos de entrega son estimados y
                  pueden variar según tu ubicación y disponibilidad del producto. Para lentes con
                  receta, el tiempo de fabricación es adicional al tiempo de envío.
                </p>
                <p>
                  <strong>6.2 Direcciones:</strong> Es tu responsabilidad proporcionar una dirección
                  de envío correcta y completa. No somos responsables por entregas fallidas debido
                  a direcciones incorrectas.
                </p>
                <p>
                  <strong>6.3 Riesgo de Pérdida:</strong> El riesgo de pérdida o daño pasa a ti
                  una vez que el producto es entregado al transportista.
                </p>
              </div>
            </div>

            {/* Section 7 */}
            <div className="mb-10">
              <h2 className="text-2xl font-bold mb-4">7. Devoluciones y Reembolsos</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Las devoluciones están sujetas a nuestra{' '}
                  <Link href="/returns" className="text-primary hover:underline">
                    Política de Devoluciones
                  </Link>
                  . Te recomendamos leerla antes de realizar tu compra.
                </p>
              </div>
            </div>

            {/* Section 8 */}
            <div className="mb-10">
              <h2 className="text-2xl font-bold mb-4">8. Propiedad Intelectual</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Todo el contenido del sitio web, incluyendo textos, imágenes, logotipos, diseños
                  y software, es propiedad de Zyro Online o de sus licenciantes y está protegido
                  por leyes de propiedad intelectual.
                </p>
                <p>
                  No está permitido copiar, modificar, distribuir o usar nuestro contenido sin
                  autorización previa por escrito.
                </p>
              </div>
            </div>

            {/* Section 9 */}
            <div className="mb-10">
              <h2 className="text-2xl font-bold mb-4">9. Limitación de Responsabilidad</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  <strong>9.1</strong> Zyro Online no será responsable por daños indirectos, incidentales,
                  especiales o consecuentes que resulten del uso o incapacidad de usar nuestros productos o servicios.
                </p>
                <p>
                  <strong>9.2</strong> Nuestra responsabilidad máxima estará limitada al monto pagado
                  por el producto o servicio en cuestión.
                </p>
                <p>
                  <strong>9.3</strong> Los productos ópticos no reemplazan el consejo médico profesional.
                  Consulta siempre con un profesional de la salud visual.
                </p>
              </div>
            </div>

            {/* Section 10 */}
            <div className="mb-10">
              <h2 className="text-2xl font-bold mb-4">10. Garantía</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  <strong>10.1 Garantía de Producto:</strong> Ofrecemos garantía contra defectos de
                  fabricación por un período de 30 días desde la fecha de entrega.
                </p>
                <p>
                  <strong>10.2 Exclusiones:</strong> La garantía no cubre daños por mal uso, accidentes,
                  modificaciones no autorizadas o desgaste normal.
                </p>
              </div>
            </div>

            {/* Section 11 */}
            <div className="mb-10">
              <h2 className="text-2xl font-bold mb-4">11. Privacidad</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  El manejo de tu información personal está regulado por nuestra{' '}
                  <Link href="/privacy" className="text-primary hover:underline">
                    Política de Privacidad
                  </Link>
                  , la cual forma parte integral de estos términos.
                </p>
              </div>
            </div>

            {/* Section 12 */}
            <div className="mb-10">
              <h2 className="text-2xl font-bold mb-4">12. Modificaciones</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Nos reservamos el derecho de modificar estos términos en cualquier momento.
                  Los cambios entrarán en vigor al ser publicados en este sitio. El uso continuado
                  de nuestros servicios después de los cambios constituye tu aceptación de los nuevos términos.
                </p>
              </div>
            </div>

            {/* Section 13 */}
            <div className="mb-10">
              <h2 className="text-2xl font-bold mb-4">13. Ley Aplicable</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Estos términos se rigen por las leyes de la República de Panamá. Cualquier disputa
                  será sometida a la jurisdicción de los tribunales competentes de la Ciudad de Panamá.
                </p>
              </div>
            </div>

            {/* Section 14 */}
            <div className="mb-10">
              <h2 className="text-2xl font-bold mb-4">14. Divisibilidad</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Si alguna disposición de estos términos es declarada inválida o inaplicable,
                  las demás disposiciones continuarán en pleno vigor y efecto.
                </p>
              </div>
            </div>

            {/* Contact */}
            <div className="bg-muted/50 rounded-lg p-8 mt-12">
              <h2 className="text-2xl font-bold mb-4 text-center">Contacto</h2>
              <p className="text-center text-muted-foreground mb-6">
                Si tienes preguntas sobre estos términos, contáctanos:
              </p>
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <a href="mailto:admin@zyroonline.com" className="flex items-center gap-2 hover:text-foreground">
                  <Mail className="h-4 w-4" />
                  admin@zyroonline.com
                </a>
                <a href="https://wa.me/50764802601" target="_blank" rel="noopener noreferrer" className="hover:text-foreground">
                  WhatsApp: +507 6480-2601
                </a>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Footer Note */}
      <section className="border-t py-8">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          <p>Última actualización: Enero 2026</p>
        </div>
      </section>
    </div>
  );
}
