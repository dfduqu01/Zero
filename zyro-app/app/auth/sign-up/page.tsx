import { RegisterForm } from "@/components/register-form";
import Link from "next/link";

export const metadata = {
  title: "Registrarse | Zyro Online",
  description: "Crea tu cuenta en Zyro Online",
};

export default function Page() {
  return (
    <div className="flex min-h-svh w-full flex-col items-center justify-center p-6 md:p-10 bg-gray-50">
      {/* Header */}
      <div className="w-full max-w-sm mb-6">
        <Link href="/" className="text-2xl font-bold text-center block">
          Zyro
        </Link>
      </div>

      {/* Registration Form */}
      <div className="w-full max-w-sm">
        <RegisterForm />
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
