import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";

export const metadata = {
  title: "Registro Exitoso | ZERO",
  description: "Tu cuenta ha sido creada exitosamente",
};

export default function Page() {
  return (
    <div className="flex min-h-svh w-full flex-col items-center justify-center p-6 md:p-10 bg-gray-50">
      {/* Header */}
      <div className="w-full max-w-sm mb-6">
        <Link href="/" className="text-2xl font-bold text-center block">
          ZERO
        </Link>
      </div>

      {/* Success Message */}
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">
                ¡Gracias por registrarte!
              </CardTitle>
              <CardDescription>Revisa tu correo para confirmar tu cuenta</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Te has registrado exitosamente. Por favor revisa tu correo
                electrónico para confirmar tu cuenta antes de iniciar sesión.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Back to Home */}
      <Link
        href="/"
        className="mt-6 text-sm text-gray-600 hover:text-gray-900"
      >
        ← Volver al Inicio
      </Link>
    </div>
  );
}
