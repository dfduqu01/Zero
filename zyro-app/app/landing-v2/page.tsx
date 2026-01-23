import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle2,
  Truck,
  Shield,
  MessageCircle,
  Eye,
  Clock,
  Package,
  ArrowRight
} from 'lucide-react';

export default async function LandingV2() {
  const supabase = await createClient();

  // Fetch featured products (from active brands only)
  const { data: products } = await supabase
    .from('products')
    .select(`
      *,
      brand:brands!inner(name, is_active),
      category:categories(name),
      product_images(image_url, is_primary)
    `)
    .eq('is_active', true)
    .eq('brand.is_active', true)
    .order('created_at', { ascending: false })
    .limit(4);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="container mx-auto flex h-16 items-center justify-between">
          <Link href="/landing-v2" className="flex items-center space-x-2">
            <span className="text-2xl font-bold" style={{ color: 'hsl(176 70% 32%)' }}>Zyro</span>
          </Link>
          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
            <Link href="/products" className="transition-colors hover:opacity-80" style={{ color: 'hsl(222 47% 11%)' }}>
              Gafas de Sol
            </Link>
            <Link href="/products" className="transition-colors hover:opacity-80" style={{ color: 'hsl(222 47% 11%)' }}>
              Gafas con Receta
            </Link>
            <Link href="#how-it-works" className="transition-colors hover:opacity-80" style={{ color: 'hsl(222 47% 11%)' }}>
              Cómo Funciona
            </Link>
          </nav>
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              asChild
              className="hover:bg-slate-100"
            >
              <Link href="/auth/login">Iniciar Sesión</Link>
            </Button>
            <Button
              asChild
              className="text-white"
              style={{ backgroundColor: 'hsl(176 70% 32%)' }}
            >
              <Link href="/products">Ver Colección</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section with Gradient */}
      <section
        className="relative py-24 md:py-32"
        style={{
          background: 'linear-gradient(135deg, hsl(0 0% 100%) 0%, hsl(210 40% 96%) 50%, hsl(176 70% 90%) 100%)'
        }}
      >
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <h1
                  className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.1]"
                  style={{ color: 'hsl(222 47% 11%)' }}
                >
                  CERO INTERMEDIARIOS<br />
                  CERO COMPLICACIONES<br />
                  CERO LÍMITES
                </h1>
                <p
                  className="text-xl max-w-md leading-relaxed"
                  style={{ color: 'hsl(215 16% 47%)' }}
                >
                  Tu vista merece más que lo mismo de siempre. 25 años conectando calidad directamente contigo.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  size="lg"
                  asChild
                  className="text-base px-8 py-6 text-white shadow-lg hover:shadow-xl transition-all"
                  style={{ backgroundColor: 'hsl(176 70% 32%)' }}
                >
                  <Link href="/products">Explorar Colección</Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  asChild
                  className="text-base px-8 py-6 border-2"
                  style={{
                    borderColor: 'hsl(215 20% 65%)',
                    color: 'hsl(215 25% 27%)'
                  }}
                >
                  <Link href="#how-it-works">Cómo Funciona</Link>
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4">
                {[
                  'Envío gratis +$50',
                  'Garantía de 30 días',
                  'Lentes con receta en 7-10 días',
                  'Soporte WhatsApp'
                ].map((text, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 flex-shrink-0" style={{ color: 'hsl(176 70% 32%)' }} />
                    <span className="text-sm font-medium">{text}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative h-[500px] lg:h-[600px] rounded-2xl overflow-hidden shadow-2xl" style={{ backgroundColor: 'hsl(210 40% 96%)' }}>
              <div className="absolute inset-0 flex items-center justify-center">
                <Eye className="h-32 w-32" style={{ color: 'hsl(176 70% 32% / 0.15)' }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-24">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2
              className="text-3xl md:text-4xl font-bold mb-4"
              style={{ color: 'hsl(222 47% 11%)' }}
            >
              Por Qué Elegir Zyro
            </h2>
            <p
              className="text-lg max-w-2xl mx-auto"
              style={{ color: 'hsl(215 16% 47%)' }}
            >
              Experiencia, calidad y servicio sin intermediarios
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: Clock,
                title: '25+ Años Experiencia',
                description: 'Conectando calidad directamente desde 1998'
              },
              {
                icon: Shield,
                title: 'Calidad Garantizada',
                description: 'Trabajamos solo con proveedores certificados'
              },
              {
                icon: Truck,
                title: 'Envío Gratis',
                description: 'En compras superiores a $50 en toda Latinoamérica'
              },
              {
                icon: MessageCircle,
                title: 'Soporte Experto',
                description: 'Asesoría personalizada por WhatsApp'
              }
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <Card key={i} className="border-2 hover:shadow-lg transition-all duration-300" style={{ borderColor: 'hsl(214 32% 91%)' }}>
                  <CardContent className="pt-8 pb-6 text-center space-y-4">
                    <div
                      className="mx-auto w-16 h-16 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: 'hsl(176 70% 32%)' }}
                    >
                      <Icon className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold" style={{ color: 'hsl(222 47% 11%)' }}>
                      {item.title}
                    </h3>
                    <p className="text-sm" style={{ color: 'hsl(215 16% 47%)' }}>
                      {item.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-24" style={{ backgroundColor: 'hsl(210 40% 96%)' }}>
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2
              className="text-3xl md:text-4xl font-bold mb-4"
              style={{ color: 'hsl(222 47% 11%)' }}
            >
              Productos Destacados
            </h2>
            <p
              className="text-lg"
              style={{ color: 'hsl(215 16% 47%)' }}
            >
              Descubre nuestra selección curada
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {products?.map((product) => {
              const primaryImage = product.product_images?.find((img: { is_primary?: boolean; image_url?: string }) => img.is_primary)?.image_url
                || product.product_images?.[0]?.image_url;

              return (
                <Link key={product.id} href={`/products/${product.id}`}>
                  <Card className="group hover:shadow-xl transition-all duration-300 overflow-hidden bg-white">
                    <div className="aspect-square relative overflow-hidden" style={{ backgroundColor: 'hsl(210 40% 96%)' }}>
                      {primaryImage ? (
                        <Image
                          src={primaryImage}
                          alt={product.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Eye className="h-16 w-16" style={{ color: 'hsl(215 16% 47% / 0.3)' }} />
                        </div>
                      )}
                      {product.stock_quantity <= 10 && product.stock_quantity > 0 && (
                        <Badge
                          className="absolute top-2 right-2 text-white border-0"
                          style={{ backgroundColor: 'hsl(16 85% 58%)' }}
                        >
                          Pocas Unidades
                        </Badge>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <p className="text-sm mb-1" style={{ color: 'hsl(215 16% 47%)' }}>
                        {product.brand?.name || 'Zyro'}
                      </p>
                      <h3 className="font-semibold mb-2 line-clamp-1" style={{ color: 'hsl(222 47% 11%)' }}>
                        {product.name}
                      </h3>
                      <p className="text-2xl font-bold" style={{ color: 'hsl(176 70% 32%)' }}>
                        ${product.price.toFixed(2)}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
          <div className="text-center">
            <Button
              size="lg"
              variant="outline"
              asChild
              className="border-2 hover:shadow-md transition-all"
              style={{
                borderColor: 'hsl(176 70% 32%)',
                color: 'hsl(176 70% 32%)'
              }}
            >
              <Link href="/products" className="flex items-center gap-2">
                Ver Toda la Colección
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2
              className="text-3xl md:text-4xl font-bold mb-4"
              style={{ color: 'hsl(222 47% 11%)' }}
            >
              Cómo Funciona
            </h2>
            <p
              className="text-lg"
              style={{ color: 'hsl(215 16% 47%)' }}
            >
              Lentes con receta en 3 simples pasos
            </p>
          </div>
          <div className="relative">
            <div className="hidden lg:block absolute top-8 left-0 right-0 h-0.5" style={{ backgroundColor: 'hsl(176 70% 32% / 0.2)' }}></div>
            <div className="grid md:grid-cols-3 gap-8 lg:gap-12 relative">
              {[
                {
                  number: '1',
                  title: 'Elige tu Montura',
                  description: 'Explora nuestra colección y selecciona el estilo perfecto para ti'
                },
                {
                  number: '2',
                  title: 'Sube tu Receta',
                  description: 'Ingresa los datos de tu prescripción o sube una foto'
                },
                {
                  number: '3',
                  title: 'Recibe en 7-10 Días',
                  description: 'Tus lentes personalizados llegan directamente a tu puerta'
                }
              ].map((step, i) => (
                <div key={i} className="relative text-center space-y-4">
                  <div className="relative inline-block">
                    <div
                      className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold text-white shadow-lg relative z-10"
                      style={{ backgroundColor: 'hsl(176 70% 32%)' }}
                    >
                      {step.number}
                    </div>
                    <div
                      className="absolute inset-0 rounded-full opacity-20"
                      style={{ backgroundColor: 'hsl(16 85% 58%)', transform: 'scale(1.3)' }}
                    ></div>
                  </div>
                  <h3 className="text-xl font-semibold" style={{ color: 'hsl(222 47% 11%)' }}>
                    {step.title}
                  </h3>
                  <p style={{ color: 'hsl(215 16% 47%)' }}>
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <div className="text-center mt-12">
            <Button
              size="lg"
              asChild
              className="px-8 py-6 text-base text-white shadow-lg hover:shadow-xl transition-all"
              style={{ backgroundColor: 'hsl(16 85% 58%)' }}
            >
              <Link href="/products">Comenzar Ahora</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Final CTA with Gradient */}
      <section
        className="py-24"
        style={{
          background: 'linear-gradient(135deg, hsl(176 70% 32%) 0%, hsl(176 70% 28%) 100%)'
        }}
      >
        <div className="container mx-auto max-w-4xl text-center space-y-8 text-white">
          <h2 className="text-4xl md:text-5xl font-bold">
            ¿Listo Para Ver La Diferencia?
          </h2>
          <p className="text-xl opacity-90 max-w-2xl mx-auto">
            Únete a miles de clientes satisfechos en toda Latinoamérica
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              asChild
              className="px-8 py-6 text-base shadow-lg hover:shadow-xl transition-all text-white"
              style={{ backgroundColor: 'hsl(16 85% 58%)' }}
            >
              <Link href="/products">Explorar Colección</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="px-8 py-6 text-base bg-transparent border-2 border-white text-white hover:bg-white transition-all"
              style={{
                borderColor: 'white',
              }}
            >
              <Link href="#how-it-works" className="hover:text-[hsl(176,70%,32%)]">
                Contactar Soporte
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16" style={{ backgroundColor: 'hsl(222 47% 11%)', color: 'white' }}>
        <div className="container mx-auto">
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div>
              <h3 className="font-bold text-lg mb-4" style={{ color: 'hsl(176 70% 70%)' }}>
                Nosotros
              </h3>
              <ul className="space-y-2 text-sm opacity-80">
                <li><Link href="#" className="hover:opacity-100 transition-opacity">Historia</Link></li>
                <li><Link href="#" className="hover:opacity-100 transition-opacity">Misión</Link></li>
                <li><Link href="#" className="hover:opacity-100 transition-opacity">Equipo</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-4" style={{ color: 'hsl(176 70% 70%)' }}>
                Ayuda
              </h3>
              <ul className="space-y-2 text-sm opacity-80">
                <li><Link href="#" className="hover:opacity-100 transition-opacity">Guía de Tallas</Link></li>
                <li><Link href="#" className="hover:opacity-100 transition-opacity">Envíos</Link></li>
                <li><Link href="#" className="hover:opacity-100 transition-opacity">Devoluciones</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-4" style={{ color: 'hsl(176 70% 70%)' }}>
                Legal
              </h3>
              <ul className="space-y-2 text-sm opacity-80">
                <li><Link href="#" className="hover:opacity-100 transition-opacity">Privacidad</Link></li>
                <li><Link href="#" className="hover:opacity-100 transition-opacity">Términos</Link></li>
                <li><Link href="#" className="hover:opacity-100 transition-opacity">Devoluciones</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-4" style={{ color: 'hsl(176 70% 70%)' }}>
                Contacto
              </h3>
              <ul className="space-y-2 text-sm opacity-80">
                <li>Email: info@zero.com</li>
                <li>WhatsApp: +1 234 567 8900</li>
                <li>Lun-Vie: 9:00-18:00</li>
              </ul>
            </div>
          </div>
          <div className="border-t pt-8 text-center text-sm opacity-60" style={{ borderColor: 'hsl(176 70% 32% / 0.3)' }}>
            <p>© {new Date().getFullYear()} Zyro Online. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
