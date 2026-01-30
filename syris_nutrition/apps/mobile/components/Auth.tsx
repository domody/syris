import { makeRedirectUri } from "expo-auth-session";
import * as QueryParams from "expo-auth-session/build/QueryParams";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { supabase } from "@/lib/supabase";
import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "./ui/field";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Text } from "./ui/text";
import { View } from "react-native";
import { cn } from "@/lib/utils";

const redirectTo = makeRedirectUri();

const sendMagicLink = async (email: string) => {
  console.log("Sending email...")
  const { error } = await supabase.auth.signInWithOtp({
    email: email,
    options: {
      emailRedirectTo: redirectTo,
    },
  });

  if (error) throw error;
  // Email sent.
};

const submitOtp = async (otpInput: string) => {
  console.log({ otpInput });
  const {
    data: { session },
    error,
  } = await supabase.auth.verifyOtp({
    email: "domody11@gmail.com",
    token: otpInput,
    type: "email",
  });

  if (error) throw error;
  if (!session) return;

  supabase.auth.setSession({
    access_token: session.access_token,
    refresh_token: session.access_token,
  });
};

export default function Auth() {
  const [loading, setLoading] = React.useState(false);
  const [email, setEmail] = React.useState<string>("");
  const [emailSent, setEmailSent] = React.useState(false);
  const [otpInput, setOtpInput] = React.useState("");

  return (
    <Card className="max-w-3xl">
      <View
        className={cn("gap-6", loading && "opacity-25", emailSent && "hidden")}
      >
        <CardHeader className="text-left">
          <CardTitle>Continue</CardTitle>
          <CardDescription>
            Enter your email to begin the sign-in process.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel>Email</FieldLabel>
              <Input
                placeholder="m@example.com"
                id="email"
                inputMode="email"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
                className="font-mono"
                placeholderTextColor={"var(--muted-foreground)"}
                textContentType="emailAddress"
                autoComplete="email"
              />
            </Field>
            <Field orientation={"horizontal"} className="justify-end">
              <Button
                onPress={() => {
                  setLoading(true);
                  sendMagicLink(email!);
                  setEmailSent(true);
                  setLoading(false);
                  // setTimeout(() => {
                  //   setEmailSent(true);
                  //   setLoading(false);
                  // }, 500);
                }}
              >
                <Text>Continue</Text>
              </Button>
            </Field>
          </FieldGroup>
        </CardContent>
      </View>
      <View
        className={cn(
          "gap-6 transition-all left-0",
          loading && "opacity-25",
          !emailSent && "hidden",
        )}
      >
        <CardHeader className="text-left">
          <CardTitle>Verify your login</CardTitle>
          <CardDescription>
            Enter the verification code we sent to your email address: {email}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel>OTP</FieldLabel>
              <Input
                placeholder="XXXXXX"
                id="otp"
                inputMode="numeric"
                keyboardType="numeric"
                value={otpInput}
                onChangeText={setOtpInput}
                className="font-mono"
                placeholderTextColor={"var(--muted-foreground)"}
                textContentType="oneTimeCode"
                autoComplete="one-time-code"
              />
            </Field>
            <Field orientation={"horizontal"} className="justify-between">
              <Button
                variant={"secondary"}
                onPress={() => {
                  setLoading(true);
                  setEmail("");
                  setEmailSent(false);
                  setLoading(false);
                  setOtpInput("");
                }}
              >
                <Text>Back</Text>
              </Button>
              <Button
                onPress={() => {
                  setLoading(true);
                  submitOtp(otpInput);
                  setLoading(false);
                  // setTimeout(() => {
                  //   setEmailSent(false);
                  //   setLoading(false);
                  // }, 500);
                }}
              >
                <Text>Continue</Text>
              </Button>
            </Field>
          </FieldGroup>
        </CardContent>
      </View>
    </Card>
    // <>
    //   <Text>{url ?? "No Linking URL"}</Text>
    //   <Button onPress={sendMagicLink} title="Send Magic Link" />

    //   <TextInput
    //     value={otpInput}
    //     onChangeText={setOtpInput}
    //     placeholder="Enter OTP"
    //     style={{
    //       borderStyle: "solid",
    //       borderColor: "#000",
    //       padding: 8,
    //       borderRadius: "8",
    //     }}
    //   />

    //   <Button onPress={() => submitOtp(otpInput)} title="Submit OTP" />
    // </>
  );
}
