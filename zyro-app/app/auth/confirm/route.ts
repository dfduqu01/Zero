import { createClient } from "@/lib/supabase/server";
import { type EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/";

  // Security: Validate redirect URL to prevent open redirect attacks
  const allowedRedirects = [
    "/",
    "/dashboard",
    "/profile",
    "/checkout",
    "/cart",
    "/orders",
    "/products",
  ];

  // Only allow relative paths from our allowlist
  const safeNext = allowedRedirects.includes(next) ? next : "/";

  if (token_hash && type) {
    const supabase = await createClient();

    const { data, error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });

    if (!error && data.user) {
      // After email confirmation, create user profile if it doesn't exist
      const { data: existingProfile } = await supabase
        .from("users")
        .select("id")
        .eq("id", data.user.id)
        .single();

      if (!existingProfile) {
        // Get user metadata from signup
        const metadata = data.user.user_metadata;

        // Create profile
        await supabase.from("users").insert({
          id: data.user.id,
          name: metadata?.name || "",
          phone: metadata?.phone || "",
          country: metadata?.country || "México",
          is_admin: false,
        });
      }

      // redirect user to specified redirect URL or root of app
      redirect(safeNext);
    } else {
      // redirect the user to an error page with some instructions
      redirect(`/auth/error?error=${error?.message}`);
    }
  }

  // redirect the user to an error page with some instructions
  redirect(`/auth/error?error=No token hash or type`);
}
