import { ThemedText } from "@/components/ui/themed-text";
import { ThemedView } from "@/components/ui/themed-view";
import { View } from "react-native";
import { Button } from "@/components/ui/button";
import { Text, TextClassContext } from "@/components/ui/text";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from "@/components/ui/item";

export default function TestingPage() {
  return (
    <View className="flex-1 items-center justify-center bg-background">
      <View className="rounded-lg border border-border bg-card px-4 py-3 gap-y-4">
        <Text className="text-foreground">Foreground text</Text>
        <Text className="text-muted-foreground -mt-4">Muted text</Text>
        <Button>
          <Text>Click me</Text>
        </Button>
        <Item variant={"muted"}>
          <ItemContent>
            <ItemTitle>Item</ItemTitle>
            <ItemDescription>
              Description goes here, but longer.
            </ItemDescription>
          </ItemContent>
        </Item>
      </View>
    </View>
  );
}
