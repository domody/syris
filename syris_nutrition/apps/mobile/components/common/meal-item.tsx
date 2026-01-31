import { MealWithItems } from "@/api/meals.api";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "../ui/item";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { Button } from "../ui/button";
import { Text } from "../ui/text";
import {
  marcoMealPercentagesFromTotals,
  MEAL_CONFIG,
  previewFromNames,
  totalsFromItems,
} from "@/utils/meals.utils";

export function MealItem({ meal }: { meal: MealWithItems }) {
  const names = meal.meal_items
    .map((item) => item.display_name)
    .filter(Boolean);
  const preview = previewFromNames(names);

  const totals = totalsFromItems(meal.meal_items);
  const percentages = marcoMealPercentagesFromTotals(
    totals.kcal,
    totals.protein,
    totals.carbs,
    totals.fat,
  );

  return (
    <Item variant={"muted"}>
      <ItemMedia className="translate-y-0.5 self-start">
        <HugeiconsIcon
          icon={MEAL_CONFIG[meal.meal_type].icon}
          size={16}
          color={"white"}
          strokeWidth={2}
        />
      </ItemMedia>
      <ItemContent>
        <ItemTitle>{MEAL_CONFIG[meal.meal_type].label}</ItemTitle>
        <ItemDescription>{preview}</ItemDescription>
        {/* TODO: Bold C, P, and F while maintaining inline ItemDescription text styles. */}
        <ItemDescription>{totals.kcal} kcal | C {percentages.c}% P {percentages.p}% F {percentages.f}%</ItemDescription>
      </ItemContent>
      <ItemActions>
        <Button variant={"secondary"}>
          <Text>Log</Text>
        </Button>
      </ItemActions>
    </Item>
  );
}
