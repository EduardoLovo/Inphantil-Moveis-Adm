import type { Metadata } from "next";
import { requireUser } from "@/lib/rbac";
import { DashboardContent } from "./dashboard-content";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const user = await requireUser();
  return <DashboardContent name={user.name} role={user.role} />;
}
