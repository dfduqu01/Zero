import Link from 'next/link';

export function SiteFooter() {
  return (
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
                <a
                  href="mailto:admin@zyroonline.com"
                  className="hover:text-foreground"
                >
                  admin@zyroonline.com
                </a>
              </li>
              <li>
                <a
                  href="https://wa.me/50764802601"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground"
                >
                  WhatsApp: +507 6480-2601
                </a>
              </li>
              <li>Lun-Vie: 9:00-18:00</li>
            </ul>
          </div>
        </div>
        <div className="border-t pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Zyro Online. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
