import AuthBookEntry from "@/components/AuthBookEntry";

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

export default function Home() {
  return <AuthBookEntry />;
}
