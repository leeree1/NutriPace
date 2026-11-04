import React from 'react';
import type { TrainingDay } from '@/types/plan';

interface TrainingPlanViewProps {
  days: TrainingDay[];
}

export const TrainingPlanView: React.FC<TrainingPlanViewProps> = ({ days }) => {
  const safeDays = Array.isArray(days) ? days : [];

  if (safeDays.length === 0) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-center text-red-700">
        <p className="font-semibold">Brak danych planu treningowego do wyświetlenia.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">💪 Twój plan treningowy</h2>

      {safeDays.map((day, index) => {
        const exercises = Array.isArray(day.exercises) ? day.exercises : [];
        const isRest = day.isRestDay || exercises.length === 0;

        return (
          <div
            key={index}
            className={`rounded-xl shadow-md p-6 border space-y-4 ${
              isRest ? 'bg-gray-50 border-gray-100' : 'bg-white border-gray-100'
            }`}
          >
            <div className="flex justify-between items-start gap-3 border-b pb-3">
              <div>
                <h3 className="text-lg font-semibold text-emerald-700">{day.day}</h3>
                <p className="text-sm text-gray-600">{day.title}</p>
              </div>
              {!isRest && day.durationMin > 0 && (
                <span className="text-sm font-medium text-gray-500 bg-gray-50 px-3 py-1 rounded-full whitespace-nowrap">
                  {day.durationMin} min
                </span>
              )}
            </div>

            {isRest ? (
              <p className="text-sm text-gray-400 italic">Dzień regeneracji.</p>
            ) : (
              <div className="space-y-3">
                {day.warmup && (
                  <p className="text-sm text-gray-600">
                    <span className="font-medium text-gray-700">Rozgrzewka: </span>
                    {day.warmup}
                  </p>
                )}

                <ul className="space-y-2">
                  {exercises.map((ex, exIdx) => (
                    <li
                      key={exIdx}
                      className="bg-gray-50 p-3 rounded-lg border border-gray-100 flex justify-between items-start gap-3"
                    >
                      <div>
                        <p className="font-medium text-gray-800">{ex.name}</p>
                        {ex.notes && <p className="text-xs text-gray-500 mt-0.5">{ex.notes}</p>}
                      </div>
                      <span className="text-xs text-emerald-600 font-semibold bg-emerald-50 px-2 py-1 rounded whitespace-nowrap">
                        {ex.sets} × {ex.reps}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};