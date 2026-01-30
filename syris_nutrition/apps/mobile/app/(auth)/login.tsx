import Auth from "@/components/Auth";
import { View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { Text, TextClassContext } from "@/components/ui/text";
import * as WebBrowser from "expo-web-browser";
import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  AiBrain05Icon,
} from '@hugeicons/core-free-icons';

const opne = (url: string) => WebBrowser.openBrowserAsync(url);

export default function LoginPage() {
  return (
    <View className="flex-1 items-center justify-center bg-muted gap-6 p-6 md:p-10">
      <View className="w-full max-w-sm gap-6">
        <View className="flex-row items-center gap-2 self-center font-medium">
          <View className="bg-primary text-primary-foreground size-6 items-center justify-center rounded-md">
            <HugeiconsIcon
              icon={AiBrain05Icon}
              strokeWidth={2}
              size={16}
              color={"white"}
              className=""
            />
          </View>
          <Text>SYRIS</Text>
        </View>
      </View>
      <View className="gap-6">
        <Auth />
        <View className="items-center">
          <TextClassContext.Provider value="max-w-sm text-xs text-muted-foreground text-center">
            <Text className="">
              By clicking continue, you agree to our{" "}
              <Text
                className="underline"
                onPress={() =>
                  open("https://www.spotify.com/uk/legal/end-user-agreement/")
                }
                suppressHighlighting
              >
                Terms of Service
              </Text>{" "}
              and{" "}
              <Text
                className="underline"
                onPress={() =>
                  open("https://www.spotify.com/uk/legal/end-user-agreement/")
                }
                suppressHighlighting
              >
                Privacy Policy
              </Text>
            </Text>
          </TextClassContext.Provider>
        </View>
      </View>
      <StatusBar style="dark" />
    </View>
  );
}
