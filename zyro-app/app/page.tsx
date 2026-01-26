import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle2,
  Shield,
  MessageCircle,
  Eye,
  Clock,
  ArrowRight
} from 'lucide-react';
import { HeroCarousel } from '@/components/HeroCarousel';

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

  // Fetch featured products (only those with images, from active brands)
  const { data: allProducts } = await supabase
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
    .limit(20);

  // Filter to only show products with images and take first 4
  const products = allProducts?.filter(p => p.product_images && p.product_images.length > 0).slice(0, 4);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold">Zyro</span>
          </Link>
          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
            <Link href="/products" className="transition-colors hover:text-foreground/80">
              Productos
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
            <div className="space-y-4">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl xl:text-6xl 2xl:text-7xl font-extrabold tracking-tight leading-tight">
                CERO<br />
                INTERMEDIARIOS<br />
                CERO LÍMITES
              </h1>
              <p className="text-xl text-muted-foreground max-w-md">
                Tu vista merece más que lo mismo de siempre. 25 años conectando calidad directamente contigo.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" asChild className="text-base">
                <Link href="/products">Explorar Colección</Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="text-base">
                <Link href="#how-it-works">Cómo Funciona</Link>
              </Button>
            </div>
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
          <div className="relative h-[280px] sm:h-[350px] md:h-[400px] lg:h-[500px] xl:h-[550px] rounded-lg overflow-hidden bg-muted">
            <HeroCarousel />
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="border-t bg-muted/30 py-24">
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
            <Card className="border-2">
              <CardContent className="pt-8 pb-6 text-center space-y-4">
                <div className="mx-auto w-12 h-12 rounded-full bg-foreground flex items-center justify-center">
                  <Clock className="h-6 w-6 text-background" />
                </div>
                <h3 className="text-xl font-semibold">25+ Años</h3>
                <p className="text-sm text-muted-foreground">
                  Conectando calidad directamente desde 1998
                </p>
              </CardContent>
            </Card>
            <Card className="border-2">
              <CardContent className="pt-8 pb-6 text-center space-y-4">
                <div className="mx-auto w-12 h-12 rounded-full bg-foreground flex items-center justify-center">
                  <Shield className="h-6 w-6 text-background" />
                </div>
                <h3 className="text-xl font-semibold">Calidad Garantizada</h3>
                <p className="text-sm text-muted-foreground">
                  Trabajamos solo con proveedores certificados
                </p>
              </CardContent>
            </Card>
            <Card className="border-2">
              <CardContent className="pt-8 pb-6 text-center space-y-4">
                <div className="mx-auto w-12 h-12 rounded-full bg-foreground flex items-center justify-center">
                  <MessageCircle className="h-6 w-6 text-background" />
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

      {/* Featured Products */}
      <section className="py-24">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Productos Destacados
            </h2>
            <p className="text-lg text-muted-foreground">
              Descubre nuestra selección curada
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {products?.map((product) => {
              const primaryImage = product.product_images?.find((img: { is_primary?: boolean; image_url?: string }) => img.is_primary)?.image_url
                || product.product_images?.[0]?.image_url;

              return (
                <Link key={product.id} href={`/products/${product.id}`}>
                  <Card className="group hover:shadow-lg transition-all duration-300 overflow-hidden">
                    <div className="aspect-square relative bg-muted overflow-hidden">
                      {primaryImage ? (
                        <Image
                          src={primaryImage}
                          alt={product.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Eye className="h-16 w-16 text-muted-foreground/20" />
                        </div>
                      )}
                      {product.stock_quantity <= 10 && product.stock_quantity > 0 && (
                        <Badge className="absolute top-2 right-2 bg-black text-white">
                          Pocas Unidades
                        </Badge>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground mb-1">
                        {product.brand?.name || 'Zyro'}
                      </p>
                      <h3 className="font-semibold mb-2 line-clamp-1">
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
          <div className="text-center">
            <Button size="lg" variant="outline" asChild>
              <Link href="/products">Ver Toda la Colección →</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="border-t bg-muted/30 py-24">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Cómo Funciona
            </h2>
            <p className="text-lg text-muted-foreground">
              Lentes con receta en 3 simples pasos
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Step 1 */}
            <div className="text-center space-y-4">
              <div className="relative">
                <div className="mx-auto w-16 h-16 rounded-full bg-foreground text-background flex items-center justify-center text-2xl font-bold">
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
                <div className="mx-auto w-16 h-16 rounded-full bg-foreground text-background flex items-center justify-center text-2xl font-bold">
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
                <div className="mx-auto w-16 h-16 rounded-full bg-foreground text-background flex items-center justify-center text-2xl font-bold">
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
            <Button size="lg" asChild>
              <Link href="/products">Comenzar Ahora</Link>
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
            <Button size="lg" variant="secondary" asChild>
              <Link href="/products">Explorar Colección</Link>
            </Button>
            <Button size="lg" variant="outline" className="bg-transparent border-background text-background hover:bg-background hover:text-foreground" asChild>
              <a href="https://wa.me/50764802601" target="_blank" rel="noopener noreferrer">Contactar Soporte</a>
            </Button>
          </div>
        </div>
      </section>

      {/* Nuestra Historia Section */}
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
            <Button size="lg" variant="outline" asChild>
              <Link href="/about" className="inline-flex items-center gap-2">
                Conoce Más
                <ArrowRight className="h-4 w-4" />
              </Link>
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
