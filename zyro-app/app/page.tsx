import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { HeroCarousel } from '@/components/HeroCarousel';
import {
  Zap,
  Shield,
  Star,
  ArrowRight,
  Eye,
  CheckCircle2,
  MessageCircle,
  Clock
} from 'lucide-react';

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export default async function Home() {
  const supabase = await createClient();

  // Check if user is logged in
  const { data: { user } } = await supabase.auth.getUser();

  // Check if user is admin
  let isAdmin = false;
  if (user) {
    const { data: userData } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single();
    isAdmin = userData?.is_admin || false;
  }

  // Fetch featured products
  const { data: allProducts } = await supabase
    .from('products')
    .select(`
      id, name, price, stock_quantity,
      brand:brands!inner(name, is_active),
      product_images(image_url, is_primary)
    `)
    .eq('is_active', true)
    .eq('brand.is_active', true)
    .order('created_at', { ascending: false })
    .limit(20);

  const products = allProducts?.filter(p => p.product_images?.length > 0).slice(0, 6) || [];

  return (
    <div className="min-h-screen bg-white">
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: 'Zyro Online',
            url: siteUrl,
            logo: `${siteUrl}/images/hero/hero-2.jpg`,
            description: 'Gafas y lentes con receta directo a tu puerta. Óptica en línea para Panamá y Latinoamérica.',
            contactPoint: {
              '@type': 'ContactPoint',
              telephone: '+507-6480-2601',
              contactType: 'customer service',
              availableLanguage: 'Spanish',
            },
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: 'Zyro Online',
            url: siteUrl,
            potentialAction: {
              '@type': 'SearchAction',
              target: `${siteUrl}/products?q={search_term_string}`,
              'query-input': 'required name=search_term_string',
            },
          }),
        }}
      />

      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold">Zyro</span>
          </Link>
          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
            <Link href="/products?categoria=sol" className="transition-colors hover:text-foreground/80">
              Gafas de Sol
            </Link>
            <Link href="/products?categoria=aros-opticos" className="transition-colors hover:text-foreground/80">
              Lentes con Receta
            </Link>
            <Link href="#nuestra-historia" className="transition-colors hover:text-foreground/80">
              Nosotros
            </Link>
            <Link href="#how-it-works" className="transition-colors hover:text-foreground/80">
              Cómo Funciona
            </Link>
            <Link href="/cart" className="transition-colors hover:text-foreground/80">
              Carrito
            </Link>
          </nav>
          <div className="flex items-center space-x-2 sm:space-x-4">
            {isAdmin && (
              <Button variant="ghost" asChild className="hidden sm:inline-flex">
                <Link href="/admin">Admin</Link>
              </Button>
            )}
            {user ? (
              <Button variant="ghost" asChild className="hidden sm:inline-flex">
                <Link href="/profile">Mi Perfil</Link>
              </Button>
            ) : (
              <Button variant="ghost" asChild className="hidden sm:inline-flex">
                <Link href="/auth/login">Iniciar Sesión</Link>
              </Button>
            )}
            <Button asChild size="sm" className="sm:hidden">
              <Link href="/products">Colección</Link>
            </Button>
            <Button asChild className="hidden sm:inline-flex">
              <Link href="/products">Ver Colección</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto py-16 md:py-24 lg:py-32 overflow-hidden">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          <div className="space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted border border-border">
              <Zap className="w-4 h-4 text-foreground" />
              <span className="text-sm font-medium">Óptica en línea - Latinoamérica</span>
            </div>

            {/* Headline */}
            <div className="space-y-6">
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-5xl xl:text-6xl 2xl:text-7xl font-extrabold tracking-tight leading-[1.1]">
                GAFAS Y LENTES<br />
                CON RECETA<br />
                DIRECTO A TU PUERTA
              </h1>
              <div className="flex flex-col gap-3 max-w-md">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-foreground text-background flex items-center justify-center text-sm font-bold flex-shrink-0">1</div>
                  <span className="text-lg text-muted-foreground font-medium">Elige tu montura</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-foreground text-background flex items-center justify-center text-sm font-bold flex-shrink-0">2</div>
                  <span className="text-lg text-muted-foreground font-medium">Sube tu receta</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-foreground text-background flex items-center justify-center text-sm font-bold flex-shrink-0">3</div>
                  <span className="text-lg text-muted-foreground font-medium">Recibe en casa en 7-10 días</span>
                </div>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                size="lg"
                asChild
                className="text-base px-8 py-6 rounded-full font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
              >
                <Link href="/products">
                  Explorar Colección
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="text-base px-8 py-6 rounded-full font-bold border-2 hover:bg-muted transition-all duration-300"
              >
                <Link href="#how-it-works">Cómo Funciona</Link>
              </Button>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 pt-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-foreground flex-shrink-0" />
                <span className="text-sm">Garantía 30 días</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-foreground flex-shrink-0" />
                <span className="text-sm">Receta en 7-10 días</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-foreground flex-shrink-0" />
                <span className="text-sm">Soporte WhatsApp</span>
              </div>
            </div>
          </div>

          {/* Hero Image Carousel */}
          <div className="relative h-[280px] sm:h-[350px] md:h-[400px] lg:h-[500px] xl:h-[550px] rounded-2xl overflow-hidden bg-muted shadow-2xl">
            <HeroCarousel />
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 rounded-full bg-foreground text-background text-sm font-semibold mb-4">
              COLECCIÓN DESTACADA
            </span>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Productos Destacados
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Descubre nuestra selección curada de gafas premium
            </p>
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {products.map((product) => {
              const primaryImage = product.product_images?.find((img: { is_primary?: boolean }) => img.is_primary)?.image_url
                || product.product_images?.[0]?.image_url;

              return (
                <Link
                  key={product.id}
                  href={`/products/${product.id}`}
                  className="group"
                >
                  <Card className="overflow-hidden border-2 hover:border-foreground/20 hover:shadow-xl transition-all duration-500 hover:scale-[1.02]">
                    {/* Image */}
                    <div className="relative aspect-square overflow-hidden bg-muted">
                      {primaryImage ? (
                        <Image
                          src={primaryImage}
                          alt={product.name}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Eye className="w-16 h-16 text-muted-foreground/20" />
                        </div>
                      )}

                      {/* Overlay on hover */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />

                      {/* Quick view button */}
                      <div className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                        <div className="bg-white text-foreground text-sm font-semibold py-2.5 px-4 rounded-full text-center shadow-lg">
                          Ver Detalles
                        </div>
                      </div>

                      {/* Low stock badge */}
                      {product.stock_quantity <= 10 && product.stock_quantity > 0 && (
                        <Badge className="absolute top-3 right-3 bg-black text-white">
                          Pocas Unidades
                        </Badge>
                      )}
                    </div>

                    {/* Info */}
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground mb-1">
                        {product.brand?.[0]?.name || 'Zyro'}
                      </p>
                      <h3 className="font-semibold mb-2 line-clamp-1 group-hover:text-foreground/80 transition-colors">
                        {product.name}
                      </h3>
                      <p className="text-2xl font-bold">
                        ${product.price.toFixed(2)}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>

          {/* View All Button */}
          <div className="text-center">
            <Button
              size="lg"
              asChild
              className="px-8 py-6 rounded-full font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
            >
              <Link href="/products" className="flex items-center gap-2">
                Ver Toda la Colección
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Trust/Features Section */}
      <section className="py-24">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Por Qué Elegir Zyro
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Experiencia, calidad y servicio sin intermediarios
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* 25+ Años */}
            <Card className="border-2 hover:border-foreground/20 hover:shadow-xl transition-all duration-500 hover:scale-[1.02]">
              <CardContent className="pt-8 pb-6 text-center space-y-4">
                <div className="mx-auto w-14 h-14 rounded-full bg-foreground flex items-center justify-center">
                  <Clock className="h-7 w-7 text-background" />
                </div>
                <h3 className="text-xl font-semibold">25+ Años</h3>
                <p className="text-sm text-muted-foreground">
                  Conectando calidad directamente desde 1998
                </p>
              </CardContent>
            </Card>

            {/* Calidad Garantizada */}
            <Card className="border-2 hover:border-foreground/20 hover:shadow-xl transition-all duration-500 hover:scale-[1.02]">
              <CardContent className="pt-8 pb-6 text-center space-y-4">
                <div className="mx-auto w-14 h-14 rounded-full bg-foreground flex items-center justify-center">
                  <Shield className="h-7 w-7 text-background" />
                </div>
                <h3 className="text-xl font-semibold">Calidad Garantizada</h3>
                <p className="text-sm text-muted-foreground">
                  Trabajamos solo con proveedores certificados
                </p>
              </CardContent>
            </Card>

            {/* Soporte Experto */}
            <Card className="border-2 hover:border-foreground/20 hover:shadow-xl transition-all duration-500 hover:scale-[1.02]">
              <CardContent className="pt-8 pb-6 text-center space-y-4">
                <div className="mx-auto w-14 h-14 rounded-full bg-foreground flex items-center justify-center">
                  <MessageCircle className="h-7 w-7 text-background" />
                </div>
                <h3 className="text-xl font-semibold">Soporte Experto</h3>
                <p className="text-sm text-muted-foreground">
                  Asesoría personalizada por WhatsApp
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="border-t bg-muted/30 py-24">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 rounded-full bg-foreground text-background text-sm font-semibold mb-4">
              PROCESO SIMPLE
            </span>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Cómo Funciona
            </h2>
            <p className="text-lg text-muted-foreground">
              Lentes con receta en 3 simples pasos
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connection line */}
            <div className="hidden md:block absolute top-8 left-[16.67%] right-[16.67%] h-0.5 bg-border" />

            {/* Step 1 */}
            <div className="text-center space-y-4">
              <div className="relative">
                <div className="mx-auto w-16 h-16 rounded-full bg-foreground text-background flex items-center justify-center text-2xl font-bold relative z-10">
                  1
                </div>
              </div>
              <h3 className="text-xl font-semibold">Elige tu Montura</h3>
              <p className="text-muted-foreground">
                Explora nuestra colección y selecciona el estilo perfecto para ti
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center space-y-4">
              <div className="relative">
                <div className="mx-auto w-16 h-16 rounded-full bg-foreground text-background flex items-center justify-center text-2xl font-bold relative z-10">
                  2
                </div>
              </div>
              <h3 className="text-xl font-semibold">Sube tu Receta</h3>
              <p className="text-muted-foreground">
                Ingresa los datos de tu prescripción o sube una foto
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center space-y-4">
              <div className="relative">
                <div className="mx-auto w-16 h-16 rounded-full bg-foreground text-background flex items-center justify-center text-2xl font-bold relative z-10">
                  3
                </div>
              </div>
              <h3 className="text-xl font-semibold">Recibe en 7-10 Días</h3>
              <p className="text-muted-foreground">
                Tus lentes personalizados llegan directamente a tu puerta
              </p>
            </div>
          </div>

          <div className="text-center mt-12">
            <Button
              size="lg"
              asChild
              className="px-8 py-6 rounded-full font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
            >
              <Link href="/products">Comenzar Ahora</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 rounded-full bg-foreground text-background text-sm font-semibold mb-4">
              TESTIMONIOS
            </span>
            <h2 className="text-3xl md:text-4xl font-bold">
              Lo Que Dicen Nuestros Clientes
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: 'María G.', location: 'Ciudad de Panamá', text: 'Increíble calidad y el precio es imbatible. Mis nuevos lentes llegaron perfectos.', stars: 5 },
              { name: 'Carlos R.', location: 'Panamá Oeste', text: 'El proceso fue super fácil. Subí mi receta y en 8 días tenía mis gafas.', stars: 5 },
              { name: 'Ana M.', location: 'Colón', text: 'Excelente atención por WhatsApp. Me ayudaron a elegir el modelo perfecto.', stars: 5 }
            ].map((testimonial, index) => (
              <Card
                key={index}
                className="border-2 hover:border-foreground/20 hover:shadow-xl transition-all duration-500"
              >
                <CardContent className="p-8">
                  {/* Stars */}
                  <div className="flex gap-1 mb-4">
                    {Array.from({ length: testimonial.stars }).map((_, i) => (
                      <Star key={i} className="w-5 h-5" style={{ fill: '#f59e0b', color: '#f59e0b' }} />
                    ))}
                  </div>

                  <p className="text-muted-foreground mb-6 leading-relaxed">"{testimonial.text}"</p>

                  <div>
                    <p className="font-semibold">{testimonial.name}</p>
                    <p className="text-muted-foreground text-sm">{testimonial.location}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Nuestra Historia */}
      <section id="nuestra-historia" className="py-24 bg-muted/30">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center space-y-8">
            <h2 className="text-3xl md:text-4xl font-bold">
              Nuestra Historia
            </h2>
            <div className="space-y-6 text-lg text-muted-foreground leading-relaxed">
              <p>
                Durante más de 25 años, hemos conectado fábricas, marcas y ópticas en
                toda Latinoamérica. Hemos vivido la industria óptica desde adentro.
              </p>
              <p>
                Ahora, como segunda generación, llevamos esa experiencia directamente
                a ti. Sin intermediarios. Sin complicaciones. Sin límites.
              </p>
              <p className="font-medium text-foreground">
                Zyro es más que una marca de gafas. Es un nuevo comienzo.
                Una forma diferente de ver el mundo: más clara, más simple, más personal.
              </p>
            </div>
            <Button size="lg" variant="outline" asChild className="rounded-full font-bold border-2">
              <Link href="/about" className="inline-flex items-center gap-2">
                Conoce Más
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 bg-foreground text-background">
        <div className="container mx-auto max-w-4xl text-center space-y-8">
          <h2 className="text-4xl md:text-5xl font-bold">
            ¿Listo Para Ver La Diferencia?
          </h2>
          <p className="text-xl text-background/80 max-w-2xl mx-auto">
            Únete a miles de clientes satisfechos en toda Latinoamérica
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              variant="secondary"
              asChild
              className="px-8 py-6 rounded-full font-bold hover:scale-105 transition-all duration-300"
            >
              <Link href="/products">
                Explorar Colección
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="bg-transparent border-2 border-background text-background hover:bg-background hover:text-foreground px-8 py-6 rounded-full font-bold transition-all duration-300"
              asChild
            >
              <a href="https://wa.me/50764802601" target="_blank" rel="noopener noreferrer">
                <MessageCircle className="w-5 h-5 mr-2" />
                Contactar Soporte
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/30 py-16">
        <div className="container mx-auto">
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div>
              <h3 className="font-bold text-lg mb-4">Nosotros</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/about" className="hover:text-foreground">Nuestra Historia</Link></li>
                <li><Link href="/about" className="hover:text-foreground">Misión</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-4">Ayuda</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/size-guide" className="hover:text-foreground">Guía de Tallas</Link></li>
                <li><Link href="/shipping" className="hover:text-foreground">Envíos</Link></li>
                <li><Link href="/returns" className="hover:text-foreground">Devoluciones</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-4">Legal</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/privacy" className="hover:text-foreground">Privacidad</Link></li>
                <li><Link href="/terms" className="hover:text-foreground">Términos</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-4">Contacto</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="mailto:admin@zyroonline.com" className="hover:text-foreground">
                    admin@zyroonline.com
                  </a>
                </li>
                <li>
                  <a href="https://wa.me/50764802601" target="_blank" rel="noopener noreferrer" className="hover:text-foreground">
                    WhatsApp: +507 6480-2601
                  </a>
                </li>
                <li>Lun-Vie: 9:00-18:00</li>
              </ul>
            </div>
          </div>
          <div className="border-t pt-8 text-center text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} Zyro Online. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
