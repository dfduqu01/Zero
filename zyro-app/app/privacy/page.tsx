import Link from 'next/link';
import { ArrowLeft, Shield, Lock, Eye, UserCheck, Mail } from 'lucide-react';

export const metadata = {
  title: 'Política de Privacidad | Zyro Online',
  description: 'Conoce cómo protegemos y manejamos tu información personal en Zyro Online.',
};

export default function PrivacyPage() {
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
          <Shield className="h-12 w-12 mx-auto mb-4 text-primary" />
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Política de Privacidad
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Tu privacidad es importante para nosotros. Aquí explicamos cómo recopilamos,
            usamos y protegemos tu información.
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
                En Zyro Online, nos comprometemos a proteger tu privacidad y garantizar la
                seguridad de tu información personal. Esta política describe qué datos recopilamos,
                cómo los utilizamos y cuáles son tus derechos.
              </p>
            </div>

            {/* Section 1 */}
            <div className="mb-10">
              <div className="flex items-center gap-3 mb-4">
                <UserCheck className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-bold m-0">1. Información que Recopilamos</h2>
              </div>
              <div className="pl-9 space-y-4 text-muted-foreground">
                <p>Recopilamos información que nos proporcionas directamente cuando:</p>
                <ul className="space-y-2">
                  <li><strong>Creas una cuenta:</strong> nombre, correo electrónico, teléfono, país</li>
                  <li><strong>Realizas una compra:</strong> dirección de envío, información de pago</li>
                  <li><strong>Subes tu receta:</strong> datos de prescripción óptica (SPH, CYL, AXIS, PD)</li>
                  <li><strong>Nos contactas:</strong> mensajes, consultas y comunicaciones</li>
                </ul>
                <p>También recopilamos automáticamente:</p>
                <ul className="space-y-2">
                  <li>Información del dispositivo y navegador</li>
                  <li>Dirección IP y ubicación aproximada</li>
                  <li>Páginas visitadas y acciones en el sitio</li>
                  <li>Cookies y tecnologías similares</li>
                </ul>
              </div>
            </div>

            {/* Section 2 */}
            <div className="mb-10">
              <div className="flex items-center gap-3 mb-4">
                <Eye className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-bold m-0">2. Cómo Usamos tu Información</h2>
              </div>
              <div className="pl-9 space-y-4 text-muted-foreground">
                <p>Utilizamos tu información para:</p>
                <ul className="space-y-2">
                  <li><strong>Procesar pedidos:</strong> gestionar compras, pagos y envíos</li>
                  <li><strong>Fabricar tus lentes:</strong> usar tu prescripción para crear lentes personalizados</li>
                  <li><strong>Comunicarnos contigo:</strong> enviar confirmaciones, actualizaciones y soporte</li>
                  <li><strong>Mejorar nuestros servicios:</strong> analizar el uso del sitio para ofrecer mejor experiencia</li>
                  <li><strong>Cumplir obligaciones legales:</strong> mantener registros según la ley</li>
                </ul>
              </div>
            </div>

            {/* Section 3 */}
            <div className="mb-10">
              <div className="flex items-center gap-3 mb-4">
                <Lock className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-bold m-0">3. Protección de Datos de Prescripción</h2>
              </div>
              <div className="pl-9 space-y-4 text-muted-foreground">
                <p>
                  Entendemos que tu información de prescripción óptica es sensible. Por eso:
                </p>
                <ul className="space-y-2">
                  <li>Almacenamos tus datos de prescripción de forma segura con encriptación</li>
                  <li>Solo personal autorizado tiene acceso para procesar tu pedido</li>
                  <li>No compartimos tu prescripción con terceros para fines de marketing</li>
                  <li>Puedes solicitar la eliminación de tus datos de prescripción en cualquier momento</li>
                </ul>
              </div>
            </div>

            {/* Section 4 */}
            <div className="mb-10">
              <h2 className="text-2xl font-bold mb-4">4. Compartir Información</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>Compartimos tu información solo con:</p>
                <ul className="space-y-2">
                  <li><strong>Proveedores de pago:</strong> para procesar transacciones de forma segura</li>
                  <li><strong>Servicios de envío:</strong> para entregar tu pedido</li>
                  <li><strong>Proveedores de servicios:</strong> que nos ayudan a operar el sitio (hosting, email)</li>
                </ul>
                <p>
                  <strong>No vendemos</strong> tu información personal a terceros para fines publicitarios.
                </p>
              </div>
            </div>

            {/* Section 5 */}
            <div className="mb-10">
              <h2 className="text-2xl font-bold mb-4">5. Cookies</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Usamos cookies para mejorar tu experiencia en nuestro sitio. Las cookies nos permiten:
                </p>
                <ul className="space-y-2">
                  <li>Recordar tu carrito de compras</li>
                  <li>Mantener tu sesión activa</li>
                  <li>Entender cómo usas el sitio</li>
                  <li>Personalizar tu experiencia</li>
                </ul>
                <p>
                  Puedes configurar tu navegador para rechazar cookies, aunque esto puede
                  afectar algunas funciones del sitio.
                </p>
              </div>
            </div>

            {/* Section 6 */}
            <div className="mb-10">
              <h2 className="text-2xl font-bold mb-4">6. Tus Derechos</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>Tienes derecho a:</p>
                <ul className="space-y-2">
                  <li><strong>Acceder:</strong> solicitar una copia de tus datos personales</li>
                  <li><strong>Rectificar:</strong> corregir información incorrecta</li>
                  <li><strong>Eliminar:</strong> solicitar la eliminación de tus datos</li>
                  <li><strong>Oponerte:</strong> rechazar ciertos usos de tu información</li>
                  <li><strong>Portabilidad:</strong> recibir tus datos en formato electrónico</li>
                </ul>
                <p>
                  Para ejercer cualquiera de estos derechos, contáctanos a través de los
                  medios indicados abajo.
                </p>
              </div>
            </div>

            {/* Section 7 */}
            <div className="mb-10">
              <h2 className="text-2xl font-bold mb-4">7. Seguridad</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Implementamos medidas de seguridad técnicas y organizativas para proteger
                  tu información, incluyendo:
                </p>
                <ul className="space-y-2">
                  <li>Conexiones seguras (HTTPS/SSL)</li>
                  <li>Encriptación de datos sensibles</li>
                  <li>Acceso restringido a información personal</li>
                  <li>Monitoreo de seguridad continuo</li>
                </ul>
              </div>
            </div>

            {/* Section 8 */}
            <div className="mb-10">
              <h2 className="text-2xl font-bold mb-4">8. Retención de Datos</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Conservamos tu información personal mientras mantengas una cuenta activa con
                  nosotros o según sea necesario para:
                </p>
                <ul className="space-y-2">
                  <li>Proporcionar nuestros servicios</li>
                  <li>Cumplir con obligaciones legales</li>
                  <li>Resolver disputas</li>
                  <li>Hacer cumplir nuestros acuerdos</li>
                </ul>
              </div>
            </div>

            {/* Section 9 */}
            <div className="mb-10">
              <h2 className="text-2xl font-bold mb-4">9. Menores de Edad</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Nuestros servicios no están dirigidos a menores de 18 años. No recopilamos
                  intencionalmente información de menores. Si eres padre o tutor y crees que
                  tu hijo nos ha proporcionado información, contáctanos para eliminarla.
                </p>
              </div>
            </div>

            {/* Section 10 */}
            <div className="mb-10">
              <h2 className="text-2xl font-bold mb-4">10. Cambios a esta Política</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Podemos actualizar esta política ocasionalmente. Te notificaremos sobre
                  cambios importantes por correo electrónico o mediante un aviso en nuestro sitio.
                  Te recomendamos revisar esta página periódicamente.
                </p>
              </div>
            </div>

            {/* Contact */}
            <div className="bg-muted/50 rounded-lg p-8 mt-12">
              <h2 className="text-2xl font-bold mb-4 text-center">Contacto</h2>
              <p className="text-center text-muted-foreground mb-6">
                Si tienes preguntas sobre esta política de privacidad o sobre cómo manejamos
                tu información, contáctanos:
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
