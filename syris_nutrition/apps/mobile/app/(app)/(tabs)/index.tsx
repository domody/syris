import React from "react";
import { useAuth } from "@/providers/auth-provider";
import { useTheme } from "@/providers/theme-provider";
import { ThemedView } from "@/components/ui/themed-view";
import { ThemedText } from "@/components/ui/themed-text";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { Link } from "expo-router";
import { useMealsDay } from "@/hooks/meals.hooks";
import { MealItem } from "@/components/common/meal-item";
import { PageWrap } from "@/components/common/page-wrap";
import { MealsCard } from "@/components/home/meals-card";
import { TargetsCard } from "@/components/home/targets-card";
import { Progress } from "@/components/ui/progress";

export default function Home() {
  const { user, loading } = useAuth();


  return (
    <PageWrap>
        <TargetsCard />
        <MealsCard />
    </PageWrap>
  );
}
