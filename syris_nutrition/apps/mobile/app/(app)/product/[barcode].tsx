import { router, useLocalSearchParams } from "expo-router";
import { PageWrap } from "@/components/common/page-wrap";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { View } from "react-native";

export default function ProductScreen() {
  const { barcode, type } = useLocalSearchParams<{
    barcode?: string;
    type?: string;
  }>();

  return (
    <PageWrap className="" withScrollView={false}>
      <View className="flex-1 w-full">
        <Button onPress={() => router.replace("/")}>
          <Text>Back</Text>
        </Button>
        <Text>Barcode: {barcode}</Text>
        <Text>Type: {type}</Text>
      </View>
      <View className="h-16 items-center justify-start w-full">
        <Button className="w-full" onPress={() => router.replace("/")}>
          <Text>Add to Diary</Text>
        </Button>
      </View>
    </PageWrap>
  );
}
