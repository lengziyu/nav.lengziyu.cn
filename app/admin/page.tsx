import { redirect } from "next/navigation";

import AdminDashboard from "@/components/admin-dashboard";
import { isAdminSession } from "@/lib/auth";

export default async function AdminPage() {
  const authed = await isAdminSession();

  if (!authed) {
    redirect("/admin/login");
  }

  return <AdminDashboard />;
}
