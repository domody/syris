import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { qk } from "@/lib/queryKeys";
import { useAuth } from "@/providers/auth-provider";
import type { Meal, MealType } from "@/types/meals";
import {
  getMealById,
  getMealByType,
  getMealsDay,
  logMealItemRpc,
  updateMealItemGramsRpc,
  type LogMealItemRpcParams,
  type MealWithItems,
} from "@/api/meals.api";

// read hooks

export function useMealsDay(localDate: string) {
  const { user, loading } = useAuth();

  return useQuery({
    queryKey: user?.id
      ? qk.meals.day(user.id, localDate)
      : ["meals", "no-user", localDate],
    queryFn: () => getMealsDay(user!.id, localDate),
    enabled: !loading && !!user?.id && !!localDate,
  });
}

export function useMealsByType(localDate: string, mealType: MealType) {
  const { user, loading } = useAuth();

  return useQuery({
    queryKey: user?.id
      ? qk.meals.byType(user.id, localDate, mealType)
      : ["meal", "no-user", "byType", localDate, mealType],
    queryFn: () => getMealByType(user!.id, localDate, mealType),
    enabled: !loading && !!user?.id && !!localDate && !!mealType,
  });
}

export function useMealById(mealId: string) {
  const { user, loading } = useAuth();

  return useQuery({
    queryKey: user?.id
      ? qk.meals.byId(user.id, mealId)
      : ["meal", "no-user", "byId", mealId],
    queryFn: () => getMealById(user!.id, mealId),
    enabled: !loading && !!user?.id && !!mealId,
  });
}

// mutations

function findAffectedMealKeysFromCache(
  queryClient: ReturnType<typeof useQueryClient>,
  userId: string,
  mealItemId: string,
) {
  const affected: Array<{
    localDate: string;
    mealType: MealType;
    mealId: string;
  }> = [];

  // scan day caches and by type caches
  const dayQueries = queryClient.getQueriesData<MealWithItems[]>({
    queryKey: ["meals", userId, "day"],
  });

  for (const [key, data] of dayQueries) {
    if (!data) continue;
    for (const meal of data) {
      const hasItem = (meal.meal_items ?? []).some(
        (item) => item.id === mealItemId,
      );
      if (hasItem) {
        affected.push({
          localDate: meal.local_date as unknown as string,
          mealType: meal.meal_type as MealType,
          mealId: meal.id as unknown as string,
        });
      }
    }
  }

  const byTypeQueries = queryClient.getQueriesData<MealWithItems | null>({
    queryKey: ["meal", userId, "byType"],
  });

  for (const [, meal] of byTypeQueries) {
    if (!meal) continue;
    const hasItem = (meal.meal_items ?? []).some((it) => it.id === mealItemId);
    if (hasItem) {
      affected.push({
        localDate: meal.local_date as unknown as string,
        mealType: meal.meal_type as MealType,
        mealId: meal.id as unknown as string,
      });
    }
  }

  //   dedupe by meal id
  const unique = new Map<string, (typeof affected)[number]>();
  for (const a of affected) unique.set(a.mealId, a);
  return [...unique.values()];
}

export function useLogMealItem() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: LogMealItemRpcParams) => {
      if (!user?.id) throw Error("Not Authenticated");
      return logMealItemRpc(params);
    },
    onSuccess: (_data, vars) => {
      if (!user?.id) return;

      // meals changed for that (date, type); refethc totals
      queryClient.invalidateQueries({
        queryKey: qk.meals.day(user.id, vars.localDate),
      });
      queryClient.invalidateQueries({
        queryKey: qk.meals.byType(user.id, vars.localDate, vars.mealType),
      });
      queryClient.invalidateQueries({
        queryKey: qk.totals.day(user.id, vars.localDate),
      });
    },
  });
}

export function useUpdateMealItemGrams() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (vars: { mealItemId: string; grams: number }) => {
      if (!user?.id) throw Error("Not Authenticated");
      return updateMealItemGramsRpc(vars.mealItemId, vars.grams);
    },
    // update portion label/amount optimistically wherever the meal item appears
    onMutate: async ({ mealItemId, grams }) => {
      if (!user?.id) return;

      // cancel outgoing refetches so they dont overrun optimistic updates
      await queryClient.cancelQueries({ queryKey: ["meals", user.id] });
      await queryClient.cancelQueries({ queryKey: ["meal", user.id] });

      const prevDay = queryClient.getQueriesData<MealWithItems[]>({
        queryKey: ["meals", user.id, "day"],
      });
      const prevByType = queryClient.getQueriesData<MealWithItems | null>({
        queryKey: ["meal", user.id, "byType"],
      });
      const prevById = queryClient.getQueriesData<MealWithItems | null>({
        queryKey: ["meal", user.id, "byId"],
      });

      const patchMeal = (meal: MealWithItems | null) => {
        if (!meal) return meal;
        const items = meal.meal_items ?? [];
        let changed = false;

        const nextItems = items.map((item) => {
          if (item.id !== mealItemId) return item;
          changed = true;

          const portion = item.portion
            ? {
                ...item.portion,
                amount: grams,
                grams_equivalent: grams,
                poriton_label: `${grams}g`,
              }
            : item.portion;

          return { ...item, portion };
        });

        return changed ? { ...meal, meal_items: nextItems } : meal;
      };

      // patch day lists
      for (const [key, data] of prevDay) {
        if (!data) continue;
        const next = data.map((m) => patchMeal(m) as MealWithItems);
        queryClient.setQueryData(key, next);
      }

      // patch meal-by-type
      for (const [key, data] of prevByType) {
        queryClient.setQueryData(key, patchMeal(data ?? null));
      }

      // patch meal-by-id
      for (const [key, data] of prevById) {
        queryClient.setQueryData(key, patchMeal(data ?? null));
      }

      return { prevDay, prevByType, prevById };
    },

    onError: (_err, _vars, ctx) => {
      // rollback
      if (!ctx) return;
      for (const [key, data] of ctx.prevDay)
        queryClient.setQueryData(key, data);
      for (const [key, data] of ctx.prevByType)
        queryClient.setQueryData(key, data);
      for (const [key, data] of ctx.prevById)
        queryClient.setQueryData(key, data);
    },

    onSuccess: (_data, { mealItemId }) => {
      if (!user?.id) return;

      // Totals are trigger-updated; invalidate precisely if we can find the affected date/type from cache
      const affected = findAffectedMealKeysFromCache(
        queryClient,
        user.id,
        mealItemId,
      );

      if (affected.length > 0) {
        for (const a of affected) {
          queryClient.invalidateQueries({
            queryKey: qk.meals.day(user.id, a.localDate),
          });
          queryClient.invalidateQueries({
            queryKey: qk.meals.byType(user.id, a.localDate, a.mealType),
          });
          queryClient.invalidateQueries({
            queryKey: qk.meals.byId(user.id, a.mealId),
          });
          queryClient.invalidateQueries({
            queryKey: qk.totals.day(user.id, a.localDate),
          });
        }
      } else {
        // fallback: safe but broader
        queryClient.invalidateQueries({
          queryKey: qk.meals.allForUser(user.id),
        });
      }
    },
  });
}
