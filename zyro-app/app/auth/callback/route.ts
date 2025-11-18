import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/cart";

  const supabase = await createClient();

  // Exchange code for session (PKCE flow)
  if (code) {
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error("Error exchanging code for session:", exchangeError);
      redirect("/auth/login?error=confirmation_failed");
    }
  }

  // Get the current user session (should exist after code exchange)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    // Check if user profile exists
    const { data: existingProfile } = await supabase
      .from("users")
      .select("id")
      .eq("id", user.id)
      .single();

    if (!existingProfile) {
      // Get user metadata from signup
      const metadata = user.user_metadata;

      // Create profile
      const { error: profileError } = await supabase.from("users").insert({
        id: user.id,
        name: metadata?.name || "",
        phone: metadata?.phone || "",
        country: metadata?.country || "México",
        is_admin: false,
      });

      if (profileError) {
        console.error("Error creating profile:", profileError);
      }
    }

    // Redirect to intended page
    redirect(next);
  }

  // If no user, redirect to login
  redirect("/auth/login");
}
