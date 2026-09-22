import AuthBook from "@/components/AuthBook";
import Library from "@/components/library/Library";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const configured =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  // Fase front-end: sem Supabase, a capa de login mockada abre a Library.
  if (!configured) {
    return <AuthBook />;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <AuthBook />;
  }

  const displayName =
    (user.user_metadata?.full_name as string | undefined)?.trim() ||
    user.email ||
    "Leitor";

  return <Library userName={displayName} />;
}
