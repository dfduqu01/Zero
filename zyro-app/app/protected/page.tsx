import { redirect } from "next/navigation";

// This page was part of the Supabase template.
// Redirect to home page instead.
export default function ProtectedPage() {
  redirect("/");
}
