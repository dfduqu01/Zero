import { LoginForm } from "@/components/login-form";
import Link from "next/link";

export const metadata = {
  title: "Iniciar Sesión | ZERO",
  description: "Inicia sesión en tu cuenta de ZERO",
};

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const errorMessage = params.error === "confirmation_failed"
    ? "Error al confirmar tu correo. Por favor intenta nuevamente o contacta a soporte."
    : null;

  return (
    <div className="flex min-h-svh w-full flex-col items-center justify-center p-6 md:p-10 bg-gray-50">
      {/* Header */}
      <div className="w-full max-w-sm mb-6">
        <Link href="/" className="text-2xl font-bold text-center block">
          ZERO
        </Link>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="w-full max-w-sm mb-4">
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
            {errorMessage}
          </div>
        </div>
      )}

      {/* Login Form */}
      <div className="w-full max-w-sm">
        <LoginForm />
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
