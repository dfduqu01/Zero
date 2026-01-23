import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  ArrowLeft,
  Package,
  Clock,
  CheckCircle2,
  MessageCircle,
  AlertCircle,
  Mail
} from 'lucide-react';

export const metadata = {
  title: 'Política de Devoluciones | Zyro Online',
  description: 'Conoce nuestra política de devoluciones. Tu satisfacción es nuestra prioridad.',
};

export default function ReturnsPage() {
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
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Política de Devoluciones
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Tu satisfacción es nuestra prioridad. Si no estás 100% feliz con tu compra,
            estamos aquí para ayudarte.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16">
        <div className="container mx-auto max-w-4xl">

          {/* Key Points Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-16">
            <Card>
              <CardContent className="pt-6 text-center">
                <Clock className="h-10 w-10 mx-auto mb-4 text-primary" />
                <h3 className="font-semibold mb-2">30 Días</h3>
                <p className="text-sm text-muted-foreground">
                  Tienes 30 días desde la entrega para solicitar una devolución
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <Package className="h-10 w-10 mx-auto mb-4 text-primary" />
                <h3 className="font-semibold mb-2">Producto Original</h3>
                <p className="text-sm text-muted-foreground">
                  El producto debe estar en su empaque original y sin usar
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <CheckCircle2 className="h-10 w-10 mx-auto mb-4 text-primary" />
                <h3 className="font-semibold mb-2">Reembolso Completo</h3>
                <p className="text-sm text-muted-foreground">
                  Te devolvemos el 100% del valor del producto
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Policy */}
          <div className="space-y-12">

            {/* Section 1 */}
            <div>
              <h2 className="text-2xl font-bold mb-4">¿Cuándo puedo hacer una devolución?</h2>
              <div className="prose prose-gray max-w-none">
                <p className="text-muted-foreground leading-relaxed">
                  Entendemos que a veces las cosas no salen como esperamos. Por eso, aceptamos
                  devoluciones dentro de los <strong>30 días posteriores a la entrega</strong> de tu pedido,
                  siempre que se cumplan las siguientes condiciones:
                </p>
                <ul className="mt-4 space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>El producto está en su empaque original</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>No ha sido usado ni presenta daños causados por el cliente</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Incluye todos los accesorios originales (estuche, paño de limpieza, etc.)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Tienes tu número de pedido o comprobante de compra</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Section 2 - Important Notice */}
            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="pt-6">
                <div className="flex gap-4">
                  <AlertCircle className="h-6 w-6 text-amber-600 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-amber-900 mb-2">Importante: Costo de Envío de Devolución</h3>
                    <p className="text-amber-800">
                      El cliente es responsable del costo de envío para devolver el producto.
                      Te recomendamos usar un servicio de mensajería con número de seguimiento
                      para que puedas rastrear tu paquete. Una vez que recibamos el producto y
                      verifiquemos su estado, procesaremos tu reembolso.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Section 3 */}
            <div>
              <h2 className="text-2xl font-bold mb-4">¿Cómo solicito una devolución?</h2>
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  El proceso es muy sencillo. Solo sigue estos pasos:
                </p>
                <div className="space-y-4">
                  <div className="flex gap-4 items-start">
                    <div className="w-8 h-8 rounded-full bg-foreground text-background flex items-center justify-center font-bold flex-shrink-0">
                      1
                    </div>
                    <div>
                      <h4 className="font-semibold">Contáctanos</h4>
                      <p className="text-muted-foreground">
                        Escríbenos por WhatsApp o correo electrónico indicando tu número de pedido
                        y el motivo de la devolución.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4 items-start">
                    <div className="w-8 h-8 rounded-full bg-foreground text-background flex items-center justify-center font-bold flex-shrink-0">
                      2
                    </div>
                    <div>
                      <h4 className="font-semibold">Recibe la confirmación</h4>
                      <p className="text-muted-foreground">
                        Te enviaremos la dirección de envío y las instrucciones para empacar
                        tu producto de manera segura.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4 items-start">
                    <div className="w-8 h-8 rounded-full bg-foreground text-background flex items-center justify-center font-bold flex-shrink-0">
                      3
                    </div>
                    <div>
                      <h4 className="font-semibold">Envía el producto</h4>
                      <p className="text-muted-foreground">
                        Empaca el producto en su caja original y envíalo a la dirección indicada.
                        Recuerda usar un servicio con número de seguimiento.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4 items-start">
                    <div className="w-8 h-8 rounded-full bg-foreground text-background flex items-center justify-center font-bold flex-shrink-0">
                      4
                    </div>
                    <div>
                      <h4 className="font-semibold">Recibe tu reembolso</h4>
                      <p className="text-muted-foreground">
                        Una vez que recibamos y verifiquemos el producto, procesaremos tu reembolso
                        en un plazo de 5-10 días hábiles al mismo método de pago original.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 4 */}
            <div>
              <h2 className="text-2xl font-bold mb-4">Casos especiales</h2>
              <div className="space-y-4 text-muted-foreground">
                <div>
                  <h4 className="font-semibold text-foreground">Lentes con receta personalizada</h4>
                  <p>
                    Los lentes graduados con receta personalizada son productos hechos específicamente
                    para ti. Por esta razón, solo aceptamos devoluciones si hay un defecto de fabricación
                    o error en la graduación. En estos casos, te haremos un reemplazo sin costo adicional.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">Productos defectuosos</h4>
                  <p>
                    Si recibes un producto con defectos de fabricación, contáctanos inmediatamente.
                    En estos casos, cubrimos el costo de envío de la devolución y te enviamos un
                    reemplazo o reembolso completo, según tu preferencia.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">Cambios de talla o modelo</h4>
                  <p>
                    Si deseas cambiar tu producto por otra talla o modelo, primero debes hacer la
                    devolución y luego realizar una nueva compra. Esto nos permite asegurar que el
                    nuevo producto esté disponible en inventario.
                  </p>
                </div>
              </div>
            </div>

            {/* Contact Section */}
            <Card className="bg-muted/50">
              <CardContent className="pt-6">
                <h3 className="text-xl font-semibold mb-4 text-center">¿Tienes preguntas?</h3>
                <p className="text-center text-muted-foreground mb-6">
                  Estamos aquí para ayudarte. No dudes en contactarnos.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button asChild>
                    <a href="https://wa.me/50764802601" target="_blank" rel="noopener noreferrer">
                      <MessageCircle className="h-4 w-4 mr-2" />
                      WhatsApp
                    </a>
                  </Button>
                  <Button variant="outline" asChild>
                    <a href="mailto:admin@zyroonline.com">
                      <Mail className="h-4 w-4 mr-2" />
                      admin@zyroonline.com
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>

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
