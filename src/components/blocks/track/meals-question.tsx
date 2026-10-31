import { View } from 'react-native';
import { Card, CardTitle } from '@/components/ui/card';
import { Stepper } from '@/components/ui/stepper';

export type Meals = { vegMeals: number; nonVegMeals: number; veganMeals: number };

/** Q2 — "What did you eat today?" Three steppers (PRD-v2 §3.4). */
export function MealsQuestion({
  meals,
  onChange,
}: {
  meals: Meals;
  onChange: (meals: Meals) => void;
}) {
  return (
    <Card>
      <CardTitle title="2 · What did you eat?" />
      <View className="mt-3 gap-3">
        <Stepper
          label="Vegetarian meals"
          value={meals.vegMeals}
          onChange={(vegMeals) => onChange({ ...meals, vegMeals })}
        />
        <Stepper
          label="Non-vegetarian meals"
          value={meals.nonVegMeals}
          onChange={(nonVegMeals) => onChange({ ...meals, nonVegMeals })}
        />
        <Stepper
          label="Vegan meals"
          value={meals.veganMeals}
          onChange={(veganMeals) => onChange({ ...meals, veganMeals })}
        />
      </View>
    </Card>
  );
}
