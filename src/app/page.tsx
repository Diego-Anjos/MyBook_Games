import AuthBookEntry from "@/components/AuthBookEntry";
import Library from "@/components/library/Library";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const configured =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  // Fase front-end: sem Supabase, a capa de login mockada abre a Library.
  if (!configured) {
    return <AuthBookEntry />;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <AuthBookEntry />;
  }

  const displayName =
    (user.user_metadata?.full_name as string | undefined)?.trim() ||
    user.email ||
    "Leitor";

  return <Library userName={displayName} />;
}
