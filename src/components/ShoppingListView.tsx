import React, { useState, useEffect } from 'react';
import type { ShoppingCategory } from '@/types/plan';
import { loadChecked, saveChecked } from '@/lib/storage';

interface ShoppingListViewProps {
  shoppingList: ShoppingCategory[];
  totalBudget?: number;
  /** Odhaczenia są zapisywane dla konkretnego planu. */
  planId: string;
}

export const ShoppingListView: React.FC<ShoppingListViewProps> = ({
  shoppingList,
  totalBudget,
  planId,
}) => {
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>(() =>
    loadChecked(planId),
  )

  useEffect(() => {
    saveChecked(planId, checkedItems)
  }, [planId, checkedItems])

  const toggleItem = (key: string) => {
    setCheckedItems((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  const safeList = Array.isArray(shoppingList) ? shoppingList : [];

  const totalCost = safeList.reduce(
    (sum, cat) =>
      sum + (cat.items || []).reduce((s, item) => s + (Number(item.estimatedPricePln) || 0), 0),
    0
  );

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto bg-white rounded-xl shadow-md space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b pb-4 gap-2">
        <h2 className="text-2xl font-bold text-slate-800">🛒 Lista Zakupów</h2>
        <div className="text-left sm:text-right">
          {totalCost > 0 && (
            <p className="text-sm font-semibold text-slate-700">
              Szacowany koszt: {totalCost.toFixed(2)} zł
            </p>
          )}
          {totalBudget !== undefined && (
            <p className="text-xs text-slate-400">Twój budżet: {totalBudget} zł</p>
          )}
          {totalBudget !== undefined && totalCost > 0 && (
            <p
              role="status"
              className={`text-sm font-semibold ${
                totalCost > totalBudget ? 'text-red-600' : 'text-brand-700'
              }`}
            >
              {totalCost > totalBudget
                ? `Przekraczasz budżet o ${(totalCost - totalBudget).toFixed(2)} zł`
                : `Mieścisz się w budżecie (zostaje ${(totalBudget - totalCost).toFixed(2)} zł)`}
            </p>
          )}
        </div>
      </div>

      {safeList.length > 0 ? (
        <div className="space-y-6">
          {safeList.map((cat) => (
            <div key={cat.category} className="border rounded-lg p-3 sm:p-4 bg-slate-50">
              <h3 className="text-lg font-semibold text-brand-700 mb-3">{cat.category}</h3>
              <ul className="space-y-2">
                {(cat.items || []).map((item) => {
                  // Klucz zawiera kategorię i jednostkę, żeby różne pozycje o tej samej nazwie się nie zlewały
                  const key = `${cat.category}:${item.name}:${item.unit}`;
                  const isChecked = !!checkedItems[key];

                  return (
                    <li key={key}>
                      <label
                        className={`flex cursor-pointer flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded p-3 transition-colors ${
                          isChecked
                            ? 'bg-brand-50 line-through text-slate-400'
                            : 'bg-white hover:bg-slate-100 text-slate-700 shadow-sm'
                        }`}
                      >
                        <span className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleItem(key)}
                            className="w-4 h-4 text-brand-600 rounded focus:ring-brand-500 cursor-pointer"
                          />
                          <span className="font-medium">{item.name}</span>
                        </span>
                        <span className="text-sm text-slate-500 text-right">
                          {item.amount ? (
                            <span>{item.amount} {item.unit}</span>
                          ) : null}
                          {item.estimatedPricePln ? (
                            <span className="ml-3">{item.estimatedPricePln} zł</span>
                          ) : null}
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-slate-500 text-center py-8">Brak wygenerowanej listy zakupów.</p>
      )}
    </div>
  );
};