import React from 'react';
import type { DayPlan } from '@/types/plan';

interface MealPlanViewProps {
  days: DayPlan[];
}

export const MealPlanView: React.FC<MealPlanViewProps> = ({ days }) => {
  const safeDays = Array.isArray(days) ? days : [];

  if (safeDays.length === 0) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-center text-red-700">
        <p className="font-semibold">Brak danych jadłospisu do wyświetlenia.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">🍽️ Twój 7-dniowy Jadłospis</h2>

      {safeDays.map((dayItem, index) => {
        const meals = Array.isArray(dayItem.meals) ? dayItem.meals : [];

        return (
          <div key={index} className="bg-white rounded-xl shadow-md p-6 border border-gray-100 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-lg font-semibold text-emerald-700">
                {dayItem.day || `Dzień ${index + 1}`}
              </h3>
              <span className="text-sm font-medium text-gray-500 bg-gray-50 px-3 py-1 rounded-full">
                {dayItem.totalKcal} kcal
              </span>
            </div>

            <div className="space-y-4">
              {meals.length > 0 ? (
                meals.map((meal, mealIdx) => (
                  <div key={mealIdx} className="bg-gray-50 p-4 rounded-lg border border-gray-100 space-y-2">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <p className="text-xs text-gray-400">{meal.mealType}</p>
                        <h4 className="font-semibold text-gray-800 text-base">{meal.name}</h4>
                      </div>
                      <span className="text-xs text-emerald-600 font-semibold bg-emerald-50 px-2 py-1 rounded whitespace-nowrap">
                        {meal.kcal} kcal
                      </span>
                    </div>

                    {meal.description && (
                      <p className="text-sm text-gray-600 leading-relaxed">{meal.description}</p>
                    )}

                    {meal.ingredients?.length > 0 && (
                      <p className="text-xs text-gray-500">
                        <span className="font-medium text-gray-600">Składniki: </span>
                        {meal.ingredients
                          .map((ing) => `${ing.name} (${ing.amount} ${ing.unit})`)
                          .join(', ')}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 pt-2 font-medium border-t border-gray-200/60 mt-2">
                      <span>Białko: <strong className="text-gray-700">{meal.proteinG} g</strong></span>
                      <span>Węglowodany: <strong className="text-gray-700">{meal.carbsG} g</strong></span>
                      <span>Tłuszcze: <strong className="text-gray-700">{meal.fatG} g</strong></span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-400 italic">Brak posiłków dla tego dnia.</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};