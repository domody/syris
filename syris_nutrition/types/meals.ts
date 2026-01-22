import { z} from "zod";

const MealSchema = z.object({
    id: z.string(),
    eaten_at: z.string(),
    local_date: z.string(),
    meal_type: z.string(),
    note: z.string(),
    created_at: z.string(),
})

export type Meal = z.infer<typeof MealSchema>