import { redirect } from "next/navigation";
import { requireSession } from "@/lib/admin-session";
import { Dashboard } from "@/components/admin/Dashboard";

export default async function BeheerPage() {
  // Middleware already gates this route — this is a second, independent
  // check for the same reason every admin API route checks again too: a
  // route reachable only because "something upstream should have blocked it"
  // is one refactor away from being reachable by anyone.
  if (!(await requireSession())) redirect("/beheer/login");

  return <Dashboard />;
}
