import React from 'react';
import type { TrainingDay } from '@/types/plan';

interface TrainingPlanViewProps {
  /** Wybrany dzień; `undefined`, gdy plan nie ma danych dla tego dnia. */
  day: TrainingDay | undefined;
  dayNumber: number;
}

export const TrainingPlanView: React.FC<TrainingPlanViewProps> = ({ day, dayNumber }) => {
  if (!day) {
    return (
      <div role="status" className="p-6 bg-red-50 border border-red-200 rounded-xl text-center text-red-700">
        <p className="font-semibold">Brak danych planu treningowego do wyświetlenia.</p>
      </div>
    );
  }

  const exercises = Array.isArray(day.exercises) ? day.exercises : [];
  const isRest = day.isRestDay || exercises.length === 0;

  return (
    <section
      aria-labelledby="training-day-heading"
      className={`rounded-xl shadow-md p-4 sm:p-6 border space-y-4 ${
        isRest ? 'bg-slate-50 border-slate-100' : 'bg-white border-slate-100'
      }`}
    >
      <div className="flex justify-between items-start gap-3 border-b pb-3">
        <div className="min-w-0">
          <h2 id="training-day-heading" className="text-lg font-semibold text-brand-700">
            💪 {day.day || `Dzień ${dayNumber}`}
          </h2>
          <p className="text-sm text-slate-600 break-words">{day.title}</p>
        </div>
        {!isRest && day.durationMin > 0 && (
          <span className="text-sm font-medium text-slate-500 bg-slate-50 px-3 py-1 rounded-full whitespace-nowrap">
            {day.durationMin} min
          </span>
        )}
      </div>

      {isRest ? (
        <p className="text-sm text-slate-400 italic">Dzień regeneracji.</p>
      ) : (
        <div className="space-y-3">
          {day.warmup && (
            <p className="text-sm text-slate-600">
              <span className="font-medium text-slate-700">Rozgrzewka: </span>
              {day.warmup}
            </p>
          )}

          <ul className="space-y-2">
            {exercises.map((ex) => (
              <li
                key={ex.name}
                className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex justify-between items-start gap-3"
              >
                <div className="min-w-0">
                  <p className="font-medium text-slate-800 break-words">{ex.name}</p>
                  {ex.notes && <p className="text-xs text-slate-500 mt-0.5">{ex.notes}</p>}
                </div>
                <span className="text-xs text-brand-600 font-semibold bg-brand-50 px-2 py-1 rounded whitespace-nowrap">
                  {ex.sets} × {ex.reps}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
};
