import { useState } from "react";
import type { NutriPlan } from "../types/plan"; // używając aliasu projektu

interface PlanGeneratorProps {
  surveyData: any; // Dane ankiety (SurveyData)
  onPlanGenerated: (plan: NutriPlan) => void;
}

export default function PlanGenerator({ surveyData, onPlanGenerated }: PlanGeneratorProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleGenerate = async () => {
    setStatus("loading");
    setErrorMessage(null);

    try {
      const response = await fetch("/api/generate-plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(surveyData),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Nie udało się wygenerować planu.");
      }

      setStatus("idle");
      onPlanGenerated(result.data);
    } catch (err: any) {
      console.error(err);
      setStatus("error");
      setErrorMessage(err.message || "Wystąpił problem z połączeniem z serwerem.");
    }
  };

  // Ekran ładowania
  if (status === "loading") {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-700 font-medium animate-pulse">
          Generujemy Twój spersonalizowany plan... To może potrwać kilkanaście sekund.
        </p>
      </div>
    );
  }

  // Komunikat o błędzie z przyciskiem "Spróbuj ponownie"
  if (status === "error") {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-center space-y-4">
        <p className="text-red-600 font-medium">
          Wystąpił błąd: {errorMessage}
        </p>
        <button
          onClick={handleGenerate}
          className="px-5 py-2.5 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition shadow-sm"
        >
          Spróbuj ponownie
        </button>
      </div>
    );
  }

  // Widok domyślny (przycisk "Generuj plan")
  return (
    <button
      onClick={handleGenerate}
      className="w-full py-3 px-6 bg-emerald-600 text-white font-semibold rounded-xl shadow-md hover:bg-emerald-700 transition duration-200"
    >
      Generuj plan
    </button>
  );
}