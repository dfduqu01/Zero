"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      // 1. Sign in with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      if (authData.user) {
        // 1.5. Ensure profile exists (create if missing)
        const { data: existingProfile } = await supabase
          .from("users")
          .select("id")
          .eq("id", authData.user.id)
          .single();

        if (!existingProfile) {
          // Get user metadata from signup
          const metadata = authData.user.user_metadata;

          // Create profile
          await supabase.from("users").insert({
            id: authData.user.id,
            name: metadata?.name || "",
            phone: metadata?.phone || "",
            country: metadata?.country || "México",
            is_admin: false,
          });
        }

        // 2. Merge localStorage cart with database cart
        try {
          const localCart = localStorage.getItem("cart");
          console.log("🛒 Cart transfer: localStorage cart =", localCart);

          if (localCart) {
            const cartItems = JSON.parse(localCart);
            console.log("🛒 Cart transfer: Parsed cart items =", cartItems.length, "items");

            if (cartItems.length > 0) {
              // Get existing cart items from database
              const { data: existingCartItems } = await supabase
                .from("cart_items")
                .select("id, product_id, quantity")
                .eq("user_id", authData.user.id);

              // Merge logic: for each localStorage item
              for (const item of cartItems) {
                // Check if product already exists in database cart
                const existingItem = existingCartItems?.find(
                  (dbItem) => dbItem.product_id === item.productId
                );

                let cartItemId: string;

                if (existingItem) {
                  // Update quantity (add localStorage quantity to database quantity)
                  const newQuantity = existingItem.quantity + item.quantity;

                  await supabase
                    .from("cart_items")
                    .update({ quantity: newQuantity })
                    .eq("id", existingItem.id);

                  cartItemId = existingItem.id;
                  console.log("🛒 Cart transfer: Updated existing item:", item.productName);
                } else {
                  // Insert new cart item
                  const { data: cartItem, error: cartError } = await supabase
                    .from("cart_items")
                    .insert({
                      user_id: authData.user.id,
                      product_id: item.productId,
                      quantity: item.quantity,
                    })
                    .select()
                    .single();

                  if (cartError) {
                    console.error("Error merging cart item:", cartError);
                    continue;
                  }

                  cartItemId = cartItem.id;
                  console.log("🛒 Cart transfer: Inserted new item:", item.productName);
                }

                // Add prescription if exists (NEW STRUCTURE - Nov 7, 2025)
                // This runs for BOTH new and existing items!
                if (item.prescription && cartItemId) {
                  console.log("🛒 Cart transfer: Item has prescription, inserting...");
                  const prescriptionData: any = {
                    cart_item_id: cartItemId,
                    has_prescription: true,
                    prescription_type_id: item.prescription.prescription_type_id,
                    lens_type_id: item.prescription.lens_type_id,
                    lens_index_id: item.prescription.lens_index_id,
                    view_area_id: item.prescription.view_area_id,
                  };

                  // Add formula if present
                  if (item.prescription.formula) {
                    const formula = item.prescription.formula;
                    prescriptionData.od_sph = formula.od_sph;
                    prescriptionData.od_cyl = formula.od_cyl;
                    prescriptionData.od_axis = formula.od_axis;
                    prescriptionData.os_sph = formula.os_sph;
                    prescriptionData.os_cyl = formula.os_cyl;
                    prescriptionData.os_axis = formula.os_axis;
                    prescriptionData.pd = formula.pd;
                    prescriptionData.pd_dual_od = formula.pd_dual_od;
                    prescriptionData.pd_dual_os = formula.pd_dual_os;
                    prescriptionData.add_value = formula.add_value;
                    console.log("🛒 Cart transfer: Added formula to prescription");
                  }

                  // Add prescription image if present (base64 from localStorage)
                  if (item.prescription.prescription_image_url) {
                    // TODO: Upload to Supabase Storage and get URL
                    // For now, store the base64 directly (not ideal for production)
                    prescriptionData.prescription_image_url = item.prescription.prescription_image_url;
                    console.log("🛒 Cart transfer: Added prescription image");
                  }

                  console.log("🛒 Cart transfer: Inserting prescription data");
                  const { error: prescError } = await supabase
                    .from("cart_item_prescriptions")
                    .insert(prescriptionData);

                  if (prescError) {
                    console.error("🛒 Cart transfer: ERROR inserting prescription:", prescError);
                  } else {
                    console.log("🛒 Cart transfer: Prescription inserted successfully!");
                  }
                }
              }

              // Clear localStorage cart after successful merge
              console.log("🛒 Cart transfer: Clearing localStorage cart");
              localStorage.removeItem("cart");
            }
          }
        } catch (cartError) {
          console.error("🛒 Cart transfer: Error merging cart:", cartError);
          // Don't throw - cart merge failure shouldn't block login
        }

        // 3. Redirect to products page
        router.push("/products");
      }
    } catch (error: unknown) {
      setError(
        error instanceof Error
          ? error.message
          : "Ocurrió un error al iniciar sesión"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Iniciar Sesión</CardTitle>
          <CardDescription>
            Ingresa tu correo y contraseña para acceder a tu cuenta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin}>
            <div className="flex flex-col gap-4">
              {/* Email */}
              <div className="grid gap-2">
                <Label htmlFor="email">Correo Electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="correo@ejemplo.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              {/* Password */}
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Contraseña</Label>
                  <Link
                    href="/auth/forgot-password"
                    className="ml-auto inline-block text-sm text-gray-600 hover:text-gray-900 underline-offset-4 hover:underline"
                  >
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
              </Button>
            </div>

            <div className="mt-4 text-center text-sm text-gray-600">
              ¿No tienes cuenta?{" "}
              <Link
                href="/auth/sign-up"
                className="font-medium text-black hover:underline"
              >
                Regístrate
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
