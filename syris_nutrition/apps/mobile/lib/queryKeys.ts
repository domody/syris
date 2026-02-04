export const qk = {
  auth: ["auth"] as const,

  user: (userId: string) => ["user", userId] as const,
  
  meals: {
    day: (userId: string, localDate: string) =>
      ["meals", userId, "day", localDate] as const,

    byType: (
      userId: string,
      localDate: string,
      mealType: "breakfast" | "lunch" | "dinner" | "snack", // TODO: Refactor literal into MealType after typing setup
    ) => ["meal", userId, "byType", localDate, mealType] as const,

    byId: (userId: string, mealId: string) =>
      ["meal", userId, "byId", mealId] as const,

    // useful for invalidating everything meal-related for a user
    allForUser: (userId: string) => ["meals", userId] as const,
  },

  totals: {
    day: (userId: string, localDate: string) =>
      ["totals", userId, localDate] as const,
  },

  goals: {
    effective: (userId: string, localDate: string) =>
      ["goals", userId, "effective", localDate] as const,
  },

  off: {
    product: (barcode: string) => ["off", "product", barcode] as const,
  }
};
