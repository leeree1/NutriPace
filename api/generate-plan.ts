import { OpenAI } from "openai";
import { z } from "zod";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  try {
    const surveyData = req.body;

    if (!surveyData) {
      return res.status(400).json({ success: false, error: "Brak danych ankiety." });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: 
            "Jesteś profesjonalnym dietetykiem klinicznym oraz trenerem personalnym. " +
            "Wygeneruj spersonalizowany 7-dniowy plan na podstawie ankiety. " +
            "Zwróć poprawny obiekt JSON zawierający klucze: summary (obiekt z liczbami dailyKcal, proteinG, carbsG, fatG, estimatedWeeklyCostPln), " +
            "mealPlan (tablica), trainingPlan (tablica), shoppingList (tablica).",
        },
        {
          role: "user",
          content: `Dane ankiety użytkownika: ${JSON.stringify(surveyData)}`,
        },
      ],
      response_format: { type: "json_object" },
    });

    const rawContent = completion.choices[0].message.content;
    if (!rawContent) {
      throw new Error("Model nie zwrócił odpowiedzi.");
    }

    let parsedJson = JSON.parse(rawContent);

    // --- AUTOMATYCZNA NAPRAWA DANYCH OD MODELU ---
    // Jeśli model zwrócił obiekt zamiast tablicy, owijamy go w tablicę
    if (parsedJson.mealPlan && !Array.isArray(parsedJson.mealPlan)) {
      parsedJson.mealPlan = [parsedJson.mealPlan];
    }
    if (parsedJson.trainingPlan && !Array.isArray(parsedJson.trainingPlan)) {
      parsedJson.trainingPlan = [parsedJson.trainingPlan];
    }
    if (parsedJson.shoppingList && !Array.isArray(parsedJson.shoppingList)) {
      parsedJson.shoppingList = [parsedJson.shoppingList];
    }

    // Zabezpieczenie przed NaN w summary
    if (parsedJson.summary) {
      for (const key of ['dailyKcal', 'proteinG', 'carbsG', 'fatG', 'estimatedWeeklyCostPln']) {
        const val = Number(parsedJson.summary[key]);
        parsedJson.summary[key] = isNaN(val) ? 0 : val;
      }
    } else {
      parsedJson.summary = { dailyKcal: 2000, proteinG: 150, carbsG: 200, fatG: 70, estimatedWeeklyCostPln: 200 };
    }
    // ---------------------------------------------

    return res.status(200).json({ success: true, data: parsedJson });
  } catch (error: any) {
    console.error("Błąd podczas generowania planu:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Wystąpił błąd serwera.",
    });
  }
}