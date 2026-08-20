import Link from "next/link";

export default function NotFound() {
  return (
    <main className="wrap flex min-h-dvh flex-col items-center justify-center gap-6 text-center">
      <p className="font-display text-6xl text-kaki">404</p>
      <p className="text-washi-dim">Deze pagina bestaat niet · This page does not exist</p>
      <Link
        href="/nl"
        className="border border-rule px-6 py-3 text-xs tracking-[0.1em] uppercase transition-colors hover:bg-washi/8"
      >
        Kyoto
      </Link>
    </main>
  );
}
