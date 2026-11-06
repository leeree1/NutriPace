import React from 'react';
import type { DayPlan } from '@/types/plan';

interface MealPlanViewProps {
  /** Wybrany dzień; `undefined`, gdy plan nie ma danych dla tego dnia. */
  day: DayPlan | undefined;
  dayNumber: number;
}

export const MealPlanView: React.FC<MealPlanViewProps> = ({ day, dayNumber }) => {
  if (!day) {
    return (
      <div role="status" className="p-6 bg-red-50 border border-red-200 rounded-xl text-center text-red-700">
        <p className="font-semibold">Brak danych jadłospisu do wyświetlenia.</p>
      </div>
    );
  }

  const meals = Array.isArray(day.meals) ? day.meals : [];

  return (
    <section aria-labelledby="meal-day-heading" className="bg-white rounded-xl shadow-md p-4 sm:p-6 border border-slate-100 space-y-4">
      <div className="flex justify-between items-center gap-2 border-b pb-3">
        <h2 id="meal-day-heading" className="text-lg font-semibold text-brand-700">
          🍽️ {day.day || `Dzień ${dayNumber}`}
        </h2>
        <span className="text-sm font-medium text-slate-500 bg-slate-50 px-3 py-1 rounded-full whitespace-nowrap">
          {day.totalKcal} kcal
        </span>
      </div>

      <div className="space-y-4">
        {meals.length > 0 ? (
          meals.map((meal) => (
            <div
              key={`${meal.mealType}:${meal.name}`}
              className="bg-slate-50 p-4 rounded-lg border border-slate-100 space-y-2"
            >
              <div className="flex justify-between items-start gap-2">
                <div className="min-w-0">
                  <p className="text-xs text-slate-400">{meal.mealType}</p>
                  <h3 className="font-semibold text-slate-800 text-base break-words">{meal.name}</h3>
                </div>
                <span className="text-xs text-brand-600 font-semibold bg-brand-50 px-2 py-1 rounded whitespace-nowrap">
                  {meal.kcal} kcal
                </span>
              </div>

              {meal.description && (
                <p className="text-sm text-slate-600 leading-relaxed">{meal.description}</p>
              )}

              {meal.ingredients?.length > 0 && (
                <p className="text-xs text-slate-500">
                  <span className="font-medium text-slate-600">Składniki: </span>
                  {meal.ingredients
                    .map((ing) => `${ing.name} (${ing.amount} ${ing.unit})`)
                    .join(', ')}
                </p>
              )}

              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 pt-2 font-medium border-t border-slate-200/60 mt-2">
                <span>Białko: <strong className="text-slate-700">{meal.proteinG} g</strong></span>
                <span>Węglowodany: <strong className="text-slate-700">{meal.carbsG} g</strong></span>
                <span>Tłuszcze: <strong className="text-slate-700">{meal.fatG} g</strong></span>
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-slate-400 italic">Brak posiłków dla tego dnia.</p>
        )}
      </div>
    </section>
  );
};
