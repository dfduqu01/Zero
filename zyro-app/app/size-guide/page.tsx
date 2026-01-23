import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Ruler,
  Eye,
  MessageCircle,
  Info,
  CheckCircle2
} from 'lucide-react';

export const metadata = {
  title: 'Guía de Tallas | Zyro Online',
  description: 'Aprende cómo medir y elegir el tamaño correcto de montura para tus gafas.',
};

export default function SizeGuidePage() {
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
          <Ruler className="h-12 w-12 mx-auto mb-4 text-primary" />
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Guía de Tallas
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Encontrar la montura perfecta es más fácil de lo que piensas.
            Aquí te explicamos cómo leer las medidas y elegir tu talla ideal.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16">
        <div className="container mx-auto max-w-5xl">

          {/* Understanding Measurements */}
          <div className="mb-16">
            <h2 className="text-2xl font-bold mb-8 text-center">Entendiendo las Medidas</h2>
            <p className="text-center text-muted-foreground mb-8 max-w-2xl mx-auto">
              Todas las monturas tienen 3 medidas principales que encontrarás grabadas
              en la patilla (brazo) de tus gafas actuales o en la descripción del producto.
            </p>

            {/* Measurement Diagram */}
            <Card className="mb-8">
              <CardContent className="pt-6">
                <div className="relative bg-muted/30 rounded-lg p-8">
                  {/* Simple text-based diagram */}
                  <div className="flex justify-center items-center gap-4 flex-wrap">
                    <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                      <div className="text-3xl font-bold text-primary mb-2">52</div>
                      <p className="text-sm font-medium">Ancho del Lente</p>
                      <p className="text-xs text-muted-foreground">(mm)</p>
                    </div>
                    <div className="text-2xl text-muted-foreground">—</div>
                    <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                      <div className="text-3xl font-bold text-primary mb-2">18</div>
                      <p className="text-sm font-medium">Ancho del Puente</p>
                      <p className="text-xs text-muted-foreground">(mm)</p>
                    </div>
                    <div className="text-2xl text-muted-foreground">—</div>
                    <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                      <div className="text-3xl font-bold text-primary mb-2">140</div>
                      <p className="text-sm font-medium">Largo de Patilla</p>
                      <p className="text-xs text-muted-foreground">(mm)</p>
                    </div>
                  </div>
                  <p className="text-center text-sm text-muted-foreground mt-6">
                    Ejemplo: 52-18-140 significa Lente 52mm, Puente 18mm, Patilla 140mm
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Detailed Explanations */}
            <div className="grid md:grid-cols-3 gap-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                    <Eye className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="font-bold mb-2">Ancho del Lente</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Es el ancho horizontal de cada lente. Determina qué tan grandes o
                    pequeñas se verán las gafas en tu rostro.
                  </p>
                  <div className="text-sm">
                    <p className="font-medium mb-1">Rangos comunes:</p>
                    <ul className="text-muted-foreground space-y-1">
                      <li>• Pequeño: 48-51 mm</li>
                      <li>• Mediano: 52-55 mm</li>
                      <li>• Grande: 56-60 mm</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
                    <span className="text-green-600 font-bold">⌓</span>
                  </div>
                  <h3 className="font-bold mb-2">Ancho del Puente</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Es la distancia entre los dos lentes, donde la montura descansa
                    sobre tu nariz. Muy importante para la comodidad.
                  </p>
                  <div className="text-sm">
                    <p className="font-medium mb-1">Rangos comunes:</p>
                    <ul className="text-muted-foreground space-y-1">
                      <li>• Estrecho: 14-17 mm</li>
                      <li>• Mediano: 18-21 mm</li>
                      <li>• Ancho: 22-24 mm</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mb-4">
                    <Ruler className="h-6 w-6 text-purple-600" />
                  </div>
                  <h3 className="font-bold mb-2">Largo de Patilla</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Es la longitud del brazo que va desde el frente hasta detrás
                    de tu oreja. Afecta el ajuste lateral.
                  </p>
                  <div className="text-sm">
                    <p className="font-medium mb-1">Rangos comunes:</p>
                    <ul className="text-muted-foreground space-y-1">
                      <li>• Corto: 135-140 mm</li>
                      <li>• Estándar: 140-145 mm</li>
                      <li>• Largo: 145-155 mm</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* How to Find Your Size */}
          <div className="mb-16">
            <h2 className="text-2xl font-bold mb-8">¿Cómo Encontrar Tu Talla?</h2>

            <div className="space-y-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-foreground text-background flex items-center justify-center font-bold flex-shrink-0">
                      1
                    </div>
                    <div>
                      <h3 className="font-bold mb-2">Revisa tus gafas actuales</h3>
                      <p className="text-muted-foreground">
                        Si ya tienes gafas que te quedan bien, busca los números grabados en el
                        interior de la patilla. Generalmente verás algo como &quot;52-18-140&quot; o
                        &quot;52 □ 18 140&quot;.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-foreground text-background flex items-center justify-center font-bold flex-shrink-0">
                      2
                    </div>
                    <div>
                      <h3 className="font-bold mb-2">Mide tu rostro</h3>
                      <p className="text-muted-foreground mb-4">
                        Si no tienes gafas de referencia, puedes medir tu rostro con una regla
                        o cinta métrica:
                      </p>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span><strong>Ancho del rostro:</strong> Mide de sien a sien. Esto te da una idea del ancho total de la montura.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span><strong>Ancho del puente:</strong> Mide el ancho de tu nariz donde descansarían las gafas.</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-foreground text-background flex items-center justify-center font-bold flex-shrink-0">
                      3
                    </div>
                    <div>
                      <h3 className="font-bold mb-2">Usa nuestra guía de referencia</h3>
                      <p className="text-muted-foreground">
                        Compara tus medidas con las especificaciones de cada producto en
                        nuestra tienda. Cada montura incluye las medidas exactas en su descripción.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Size Recommendations */}
          <div className="mb-16">
            <h2 className="text-2xl font-bold mb-8">Recomendaciones por Tipo de Rostro</h2>

            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-bold mb-4">Rostro Pequeño / Estrecho</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Ancho de lente: 48-52 mm</li>
                    <li>• Ancho de puente: 14-17 mm</li>
                    <li>• Largo de patilla: 135-140 mm</li>
                  </ul>
                  <p className="text-sm text-muted-foreground mt-4">
                    Busca monturas compactas que no sobresalgan mucho de tu rostro.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-bold mb-4">Rostro Mediano</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Ancho de lente: 52-55 mm</li>
                    <li>• Ancho de puente: 17-20 mm</li>
                    <li>• Largo de patilla: 140-145 mm</li>
                  </ul>
                  <p className="text-sm text-muted-foreground mt-4">
                    La mayoría de monturas estándar te quedarán bien.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-bold mb-4">Rostro Grande / Ancho</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Ancho de lente: 56-60 mm</li>
                    <li>• Ancho de puente: 20-24 mm</li>
                    <li>• Largo de patilla: 145-155 mm</li>
                  </ul>
                  <p className="text-sm text-muted-foreground mt-4">
                    Busca monturas amplias que proporcionen cobertura completa.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-bold mb-4">Puente Bajo</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Busca monturas con almohadillas ajustables</li>
                    <li>• Prefiere puentes de 18-22 mm</li>
                    <li>• Evita monturas muy pesadas</li>
                  </ul>
                  <p className="text-sm text-muted-foreground mt-4">
                    Las almohadillas de silicona ayudan a mantener las gafas en su lugar.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Tips */}
          <Card className="mb-16 bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <Info className="h-6 w-6 text-blue-600 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-blue-900 mb-4">Consejos Útiles</h3>
                  <ul className="space-y-3 text-blue-800">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span>Las monturas deben alinearse con tus cejas, no cubrirlas ni quedar muy abajo.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span>Tus ojos deben quedar centrados en los lentes, no muy arriba ni abajo.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span>La montura no debe tocar tus mejillas ni apretar tus sienes.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span>Las patillas deben seguir la curva de tu oreja sin apretar.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span>Si estás entre dos tallas, generalmente es mejor ir por la más grande.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Help Section */}
          <Card className="bg-muted/50">
            <CardContent className="pt-6">
              <h3 className="text-xl font-semibold mb-4 text-center">¿Necesitas Ayuda?</h3>
              <p className="text-center text-muted-foreground mb-6">
                Si no estás seguro de qué talla elegir, estamos aquí para ayudarte.
                Envíanos las medidas de tus gafas actuales o una foto y te orientamos.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild>
                  <a href="https://wa.me/50764802601" target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Consultar por WhatsApp
                  </a>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/products">Ver Productos</Link>
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
