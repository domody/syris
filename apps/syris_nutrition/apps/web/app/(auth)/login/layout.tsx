import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export default async function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

//   if (data.user) redirect("/");
if (data.user) {
    console.log(data.user)
}

  return <>{children}</>;
}
