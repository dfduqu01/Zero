import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import {
  ArrowLeft,
  Truck,
  Clock,
  MapPin,
  Package,
  Plane,
  Building2,
  CheckCircle2,
  MessageCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata = {
  title: 'Información de Envíos | Zyro Online',
  description: 'Conoce nuestras opciones de envío, tiempos de entrega y zonas de cobertura.',
};

export default function ShippingPage() {
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
          <Truck className="h-12 w-12 mx-auto mb-4 text-primary" />
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Información de Envíos
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Entregamos en Panamá y toda Latinoamérica. Conoce nuestras opciones de envío
            y tiempos de entrega.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16">
        <div className="container mx-auto max-w-5xl">

          {/* Shipping Options Cards */}
          <div className="grid md:grid-cols-2 gap-6 mb-16">
            {/* Panama */}
            <Card className="border-2">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <MapPin className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Panamá</h3>
                    <p className="text-sm text-muted-foreground">Envío nacional</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-3 border-b">
                    <div>
                      <p className="font-medium">Envío Estándar</p>
                      <p className="text-sm text-muted-foreground">3-5 días hábiles</p>
                    </div>
                    <p className="font-bold">$8.00</p>
                  </div>
                  <div className="flex justify-between items-center py-3">
                    <div>
                      <p className="font-medium">Recoger en Tienda</p>
                      <p className="text-sm text-muted-foreground">Ciudad de Panamá</p>
                    </div>
                    <p className="font-bold text-green-600">Gratis</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* International */}
            <Card className="border-2">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Plane className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Internacional</h3>
                    <p className="text-sm text-muted-foreground">Latinoamérica</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-3">
                    <div>
                      <p className="font-medium">Envío Internacional</p>
                      <p className="text-sm text-muted-foreground">7-14 días hábiles</p>
                    </div>
                    <p className="font-bold">$25.00</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-4">
                  * Los tiempos pueden variar según el país de destino
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Pickup Location */}
          <Card className="mb-16 bg-green-50 border-green-200">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <Building2 className="h-8 w-8 text-green-600 flex-shrink-0" />
                <div>
                  <h3 className="text-xl font-bold text-green-900 mb-2">
                    Recoger en Tienda - Ciudad de Panamá
                  </h3>
                  <p className="text-green-800 mb-4">
                    Si estás en la Ciudad de Panamá, puedes recoger tu pedido sin costo de envío.
                    Te notificaremos cuando tu pedido esté listo.
                  </p>
                  <div className="text-sm text-green-700">
                    <p><strong>Horario de retiro:</strong> Lunes a Viernes, 9:00 AM - 6:00 PM</p>
                    <p className="mt-1">Coordinaremos la dirección exacta por WhatsApp al momento de tu compra.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Process */}
          <div className="mb-16">
            <h2 className="text-2xl font-bold mb-8 text-center">¿Cómo Funciona el Envío?</h2>
            <div className="grid md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-foreground text-background flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  1
                </div>
                <h4 className="font-semibold mb-2">Confirmas tu Pedido</h4>
                <p className="text-sm text-muted-foreground">
                  Seleccionas tus productos y completas el pago
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-foreground text-background flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  2
                </div>
                <h4 className="font-semibold mb-2">Procesamos tu Orden</h4>
                <p className="text-sm text-muted-foreground">
                  Preparamos y verificamos tu pedido (1-2 días)
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-foreground text-background flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  3
                </div>
                <h4 className="font-semibold mb-2">Enviamos</h4>
                <p className="text-sm text-muted-foreground">
                  Te enviamos el número de seguimiento por email
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-foreground text-background flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  4
                </div>
                <h4 className="font-semibold mb-2">¡Lo Recibes!</h4>
                <p className="text-sm text-muted-foreground">
                  Tu pedido llega a la dirección indicada
                </p>
              </div>
            </div>
          </div>

          {/* Prescription Lenses Note */}
          <Card className="mb-16 bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <Clock className="h-8 w-8 text-blue-600 flex-shrink-0" />
                <div>
                  <h3 className="text-xl font-bold text-blue-900 mb-2">
                    Lentes con Receta
                  </h3>
                  <p className="text-blue-800 mb-4">
                    Si tu pedido incluye lentes graduados, el tiempo de fabricación es de
                    <strong> 5-7 días hábiles adicionales</strong> al tiempo de envío.
                    Este tiempo es necesario para fabricar tus lentes según tu prescripción exacta.
                  </p>
                  <div className="flex items-center gap-2 text-sm text-blue-700">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Te notificaremos cuando tus lentes estén listos para envío</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* FAQ */}
          <div className="mb-16">
            <h2 className="text-2xl font-bold mb-8">Preguntas Frecuentes</h2>
            <div className="space-y-6">
              <div>
                <h4 className="font-semibold mb-2">¿Puedo rastrear mi pedido?</h4>
                <p className="text-muted-foreground">
                  Sí, una vez que tu pedido sea enviado, recibirás un correo electrónico con el
                  número de seguimiento y el enlace para rastrear tu paquete en tiempo real.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">¿Qué pasa si no estoy en casa cuando llegue mi pedido?</h4>
                <p className="text-muted-foreground">
                  El transportista intentará la entrega hasta 3 veces. Si no te encuentra,
                  dejará una notificación con instrucciones para reprogramar o recoger tu paquete.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">¿Hacen envíos a toda Latinoamérica?</h4>
                <p className="text-muted-foreground">
                  Sí, enviamos a la mayoría de países en Latinoamérica. Durante el checkout,
                  podrás seleccionar tu país y ver las opciones de envío disponibles.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">¿Qué pasa si mi pedido llega dañado?</h4>
                <p className="text-muted-foreground">
                  Si tu producto llega dañado, contáctanos inmediatamente con fotos del daño.
                  Te enviaremos un reemplazo sin costo adicional o procesaremos un reembolso.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">¿Los precios incluyen impuestos de importación?</h4>
                <p className="text-muted-foreground">
                  Los precios mostrados no incluyen impuestos de importación o aranceles que
                  puedan aplicar según las leyes de tu país. Estos cargos, si los hay, son
                  responsabilidad del cliente.
                </p>
              </div>
            </div>
          </div>

          {/* Countries */}
          <div className="mb-16">
            <h2 className="text-2xl font-bold mb-6">Países con Cobertura</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                'Panamá',
                'Costa Rica',
                'Colombia',
                'México',
                'Ecuador',
                'Perú',
                'Chile',
                'Argentina',
                'República Dominicana',
                'Guatemala',
                'Honduras',
                'El Salvador',
              ].map((country) => (
                <div key={country} className="flex items-center gap-2 text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>{country}</span>
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              ¿Tu país no está en la lista? Contáctanos para verificar disponibilidad.
            </p>
          </div>

          {/* Contact */}
          <Card className="bg-muted/50">
            <CardContent className="pt-6">
              <h3 className="text-xl font-semibold mb-4 text-center">¿Tienes preguntas sobre tu envío?</h3>
              <p className="text-center text-muted-foreground mb-6">
                Estamos aquí para ayudarte con cualquier duda sobre tu pedido.
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
                    admin@zyroonline.com
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>

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
