"use client";

import * as React from "react";
import { createClient } from "@/utils/supabase/client";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldGroup,
  FieldDescription,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { HugeiconsIcon } from "@hugeicons/react";
import { AiBrain05Icon } from "@hugeicons/core-free-icons";

export default function Page() {
  const supabase = createClient();

  const [email, setEmail] = React.useState("");
  const [status, setStatus] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        setStatus(null)

        const emailRedirectTo = `${window.location.origin}/auth/confirm`

        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                shouldCreateUser: false,
                emailRedirectTo: emailRedirectTo,
            }
        })

        setLoading(false);
        setStatus(error ? error.message : "Check your email for the sign-in link.")
    }
  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div className="flex items-center gap-2 self-center font-medium">
          <div className="bg-primary text-primary-foreground flex size-6 [&>svg]:size-4.5 items-center justify-center rounded-md">
            <HugeiconsIcon icon={AiBrain05Icon} strokeWidth={2} />
          </div>
          SYRIS
        </div>
      </div>
      <div className="flex flex-col gap-6">
        <Card className="max-w-3xl">
          <CardHeader className="text-left">
            <CardTitle className="text-xl">Continue</CardTitle>
            <CardDescription>
              Enter your email to get a secure sign-in link.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="w-full" onSubmit={onSubmit}>
              <FieldGroup>
                <Field>
                  <FieldLabel>Email</FieldLabel>
                  <Input
                  placeholder="m@example.com"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    type="email"
                    required
                  />
                </Field>
                <FieldDescription>{status && status}</FieldDescription>
                <Field orientation="horizontal" className="justify-end">
                  <Button disabled={loading} type="submit">
                    {loading ? "Sending..." : "Continue"}
                  </Button>
                </Field>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>
        <p className="text-xs text-muted-foreground text-center w-full px-4">By clicking 'Continue', you agree to various legal stuff and forfeit the right to sue me.</p>
      </div>
    </div>
  );
}
