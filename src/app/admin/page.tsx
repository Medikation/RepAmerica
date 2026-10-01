import { redirect } from "next/navigation";
import { getAdmin } from "@/lib/adminAuth";

// /admin lands the owner on the producer's desk; everyone else (fulfilment) on Orders.
const OWNER = "medi@repamerica.com";

export default async function AdminIndex() {
  const state = await getAdmin();
  redirect(state.user?.email?.toLowerCase() === OWNER ? "/admin/today" : "/admin/orders");
}
