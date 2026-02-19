import { router, useLocalSearchParams } from "expo-router";
import { PageWrap } from "@/components/common/page-wrap";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { ScrollView, View } from "react-native";
import { useOffProduct } from "@/hooks/open-food-facts.hooks";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MacronutrientProgress } from "@/components/common/macro-progress";
import { useEffectiveGoals } from "@/hooks/goals.hooks";
import { TargetsCard } from "@/components/home/targets-card";

export default function ProductScreen() {
  const insets = useSafeAreaInsets();
  const { barcode, type } = useLocalSearchParams<{
    barcode?: string;
    type?: string;
  }>();
  if (!barcode) return;
  const {
    data: product,
    isLoading: isProductLoading,
    error: productError,
  } = useOffProduct(barcode);
  const {
    data: goals,
    isLoading: isGoalsLoading,
    error: goalsError,
  } = useEffectiveGoals("22-01-2026");

  return (
    <PageWrap className="px-0" withScrollView={false}>
      <ScrollView
        className="flex-1 w-full px-4"
        contentContainerClassName="gap-4"
      >
        <View className="w-full flex gap-0 items-start justify-start">
          <Text className="text-lg">{product?.name}</Text>
          <Text className="text-xs text-muted-foreground">
            Barcode: {barcode} {type}
          </Text>
        </View>
        <TargetsCard
          override={{
            kcal: product?.nutrients_per_serving["energy-kcal"] as number,
            protein_g: product?.nutrients_per_serving.proteins as number,
            carbs_g: product?.nutrients_per_serving.carbohydrates as number,
            fat_g: product?.nutrients_per_serving.fat as number,
          }}
        />
      </ScrollView>
      <View
        className="flex-row gap-4 items-start justify-between w-full px-4 pt-2 border-t border-border"
        style={{ paddingBottom: insets.bottom }}
      >
        <Button
          className="flex-1"
          variant={"secondary"}
          onPress={() => router.replace("/")}
        >
          <Text>Cancel</Text>
        </Button>
        <Button className="flex-1" onPress={() => router.replace("/")}>
          <Text>Add to Diary</Text>
        </Button>
      </View>
    </PageWrap>
  );
}
