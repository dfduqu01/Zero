import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  ArrowLeft,
  ArrowRight,
  Heart,
  Users,
  Target,
  Sparkles,
  Clock,
  Shield,
  MessageCircle
} from 'lucide-react';

export const metadata = {
  title: 'Nuestra Historia | Zyro Online',
  description: 'Conoce la historia de Zyro Online. Más de 25 años conectando calidad directamente contigo.',
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b">
        <div className="container mx-auto px-4 py-4">
          <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al inicio
          </Link>
        </div>
      </div>

      {/* Hero */}
      <section className="bg-muted/30 py-16 md:py-24">
        <div className="container mx-auto px-4 text-center max-w-4xl">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Nuestra Historia
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed">
            Durante más de 25 años hemos conectado fábricas, marcas y ópticas en toda Latinoamérica.
            Ahora, llevamos esa experiencia directamente a ti.
          </p>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="prose prose-lg max-w-none">
            <div className="space-y-8 text-muted-foreground leading-relaxed">
              <p className="text-xl">
                Tras décadas trabajando en el sector B2B de la industria óptica, surgió una pregunta
                que no podíamos ignorar: <span className="text-foreground font-medium">¿Por qué el consumidor
                final sigue tan lejos de todo esto?</span>
              </p>

              <p>
                Hemos visto cómo los lentes pasan por múltiples intermediarios antes de llegar a las
                personas que los necesitan. Cada paso agrega costos, complejidad y distancia entre
                la calidad y el cliente.
              </p>

              <p>
                Así nació <span className="text-foreground font-bold">Zyro</span> — una nueva forma de
                hacer las cosas. Una marca que quiere empezar desde cero, eliminando todo lo que no
                agrega valor a tu experiencia.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Zero Values */}
      <section className="py-16 md:py-24 bg-foreground text-background">
        <div className="container mx-auto px-4 max-w-5xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 md:mb-16">
            ¿Por Qué &quot;Zyro&quot;?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 rounded-full border-2 border-background/30 flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl font-bold">0</span>
              </div>
              <h3 className="text-xl font-bold mb-3">Cero Intermediarios</h3>
              <p className="text-background/70">
                Conectamos directamente con fabricantes de calidad para ofrecerte los mejores
                precios sin sacrificar la calidad.
              </p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 rounded-full border-2 border-background/30 flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl font-bold">0</span>
              </div>
              <h3 className="text-xl font-bold mb-3">Cero Complicaciones</h3>
              <p className="text-background/70">
                Un proceso simple y transparente. Desde elegir tu montura hasta recibir tus
                lentes en la puerta de tu casa.
              </p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 rounded-full border-2 border-background/30 flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl font-bold">0</span>
              </div>
              <h3 className="text-xl font-bold mb-3">Cero Límites</h3>
              <p className="text-background/70">
                Tu estilo, tu prescripción, tu elección. Te damos la libertad de elegir
                exactamente lo que necesitas.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 max-w-5xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Nuestros Valores
          </h2>
          <p className="text-center text-muted-foreground mb-12 md:mb-16 max-w-2xl mx-auto">
            Estos principios guían todo lo que hacemos
          </p>
          <div className="grid md:grid-cols-2 gap-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Heart className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Honestidad</h3>
                    <p className="text-muted-foreground">
                      Precios claros, sin sorpresas. Te decimos exactamente qué estás comprando
                      y cuánto cuesta. Sin letra pequeña.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Shield className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Calidad</h3>
                    <p className="text-muted-foreground">
                      Solo trabajamos con proveedores que cumplen con nuestros estándares.
                      25 años de experiencia nos han enseñado a reconocer la calidad real.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Servicio Personal</h3>
                    <p className="text-muted-foreground">
                      Detrás de Zyro hay personas reales que se preocupan por tu experiencia.
                      Estamos a un mensaje de WhatsApp de distancia.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Target className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Simplicidad</h3>
                    <p className="text-muted-foreground">
                      Comprar lentes no tiene que ser complicado. Diseñamos cada paso de la
                      experiencia pensando en hacerte la vida más fácil.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Experience */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                25+ Años de Experiencia
              </h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Nuestra historia comienza hace más de dos décadas, cuando la primera generación
                  de nuestra familia empezó a conectar fabricantes de lentes con ópticas en
                  toda Latinoamérica.
                </p>
                <p>
                  Hemos visto la industria desde adentro: cómo se fabrican los lentes,
                  qué hace la diferencia entre un producto bueno y uno excepcional,
                  y por qué los precios a veces no tienen sentido.
                </p>
                <p>
                  Ahora, como segunda generación, traemos todo ese conocimiento directamente
                  a ti. Sin filtros, sin intermediarios, sin complicaciones.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Card className="text-center">
                <CardContent className="pt-6">
                  <Clock className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <p className="text-3xl font-bold">25+</p>
                  <p className="text-sm text-muted-foreground">Años de experiencia</p>
                </CardContent>
              </Card>
              <Card className="text-center">
                <CardContent className="pt-6">
                  <Users className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <p className="text-3xl font-bold">2da</p>
                  <p className="text-sm text-muted-foreground">Generación familiar</p>
                </CardContent>
              </Card>
              <Card className="text-center">
                <CardContent className="pt-6">
                  <Target className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <p className="text-3xl font-bold">100%</p>
                  <p className="text-sm text-muted-foreground">Compromiso contigo</p>
                </CardContent>
              </Card>
              <Card className="text-center">
                <CardContent className="pt-6">
                  <Sparkles className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <p className="text-3xl font-bold">∞</p>
                  <p className="text-sm text-muted-foreground">Pasión por lo que hacemos</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Nuestra Misión
          </h2>
          <p className="text-xl text-muted-foreground leading-relaxed mb-8">
            Hacer que cada persona en Latinoamérica pueda acceder a lentes de calidad
            a precios justos, con un servicio personalizado y sin complicaciones.
          </p>
          <p className="text-lg text-muted-foreground">
            Creemos que ver bien no debería ser un lujo. Es una necesidad básica que
            merece ser atendida con respeto, calidad y precios honestos.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-24 bg-foreground text-background">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            ¿Listo para Conocernos?
          </h2>
          <p className="text-xl text-background/80 mb-8">
            Explora nuestra colección y descubre la diferencia de comprar sin intermediarios.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/products">
                Ver Colección
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="bg-transparent border-background text-background hover:bg-background hover:text-foreground"
              asChild
            >
              <a href="https://wa.me/50764802601" target="_blank" rel="noopener noreferrer">
                <MessageCircle className="h-4 w-4 mr-2" />
                Contáctanos
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer Note */}
      <section className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>Zyro Online — Empezando desde cero, llegando lejos.</p>
        </div>
      </section>
    </div>
  );
}
