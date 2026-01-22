import { type EmailOtpType } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

function toErr(e: any) {
  return {
    name: e?.name,
    message: e?.message,
    status: e?.status,
    code: e?.code,
  };
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const token_hash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  //   const next = url.searchParams.get("next") ?? "/";
  const next = "/";

  console.log("[auth/confirm] params", {
    hasTokenHash: !!token_hash,
    type,
    next,
  });

  const redirectTo = request.nextUrl.clone();
  redirectTo.pathname = next;
  redirectTo.searchParams.delete("token_hash");
  redirectTo.searchParams.delete("type");

  if (!token_hash || !type) {
    const errorUrl = new URL("/login", request.url);
    errorUrl.searchParams.set("error", "missing_token_or_type");
    return NextResponse.redirect(errorUrl);
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.verifyOtp({ token_hash, type });

  if (error) {
    const info = toErr(error);
    console.error("[auth/confirm] verifyOtp failed", info);

    const errorUrl = new URL("/login", request.url);
    errorUrl.searchParams.set("error", "verifyOtp_failed");
    if (info.code) errorUrl.searchParams.set("code", String(info.code));
    if (info.status) errorUrl.searchParams.set("status", String(info.status));
    if (info.message) errorUrl.searchParams.set("message", info.message);
    return NextResponse.redirect(errorUrl);
  }


  redirectTo.searchParams.delete("next")
  if (redirectTo.origin !== url.origin) redirectTo.pathname = "/";

  return NextResponse.redirect(redirectTo);
}
