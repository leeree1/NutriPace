import React, { useState, useEffect } from 'react';
import type { ShoppingCategory } from '@/types/plan';

interface ShoppingListViewProps {
  shoppingList: ShoppingCategory[];
  totalBudget?: number;
}

export const ShoppingListView: React.FC<ShoppingListViewProps> = ({ shoppingList, totalBudget }) => {
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('nutripace_checked_shopping');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('nutripace_checked_shopping', JSON.stringify(checkedItems));
    } catch (e) {
      console.error('Nie udało się zapisać do localStorage', e);
    }
  }, [checkedItems]);

  const toggleItem = (key: string) => {
    setCheckedItems(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const safeList = Array.isArray(shoppingList) ? shoppingList : [];

  const totalCost = safeList.reduce(
    (sum, cat) =>
      sum + (cat.items || []).reduce((s, item) => s + (Number(item.estimatedPricePln) || 0), 0),
    0
  );

  return (
    <div className="p-6 max-w-4xl mx-auto bg-white rounded-xl shadow-md space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b pb-4 gap-2">
        <h2 className="text-2xl font-bold text-gray-800">🛒 Lista Zakupów</h2>
        <div className="text-left sm:text-right">
          {totalCost > 0 && (
            <p className="text-sm font-semibold text-gray-700">
              Szacowany koszt: {totalCost.toFixed(2)} zł
            </p>
          )}
          {totalBudget !== undefined && (
            <p className="text-xs text-gray-400">Twój budżet: {totalBudget} zł</p>
          )}
        </div>
      </div>

      {safeList.length > 0 ? (
        <div className="space-y-6">
          {safeList.map((cat, catIdx) => (
            <div key={catIdx} className="border rounded-lg p-4 bg-gray-50">
              <h3 className="text-lg font-semibold text-emerald-700 mb-3">{cat.category}</h3>
              <ul className="space-y-2">
                {(cat.items || []).map((item, itemIdx) => {
                  // Klucz zawiera kategorię, żeby identyczne nazwy w różnych kategoriach się nie zlewały
                  const key = `${cat.category}:${item.name}`;
                  const isChecked = !!checkedItems[key];

                  return (
                    <li
                      key={itemIdx}
                      onClick={() => toggleItem(key)}
                      className={`flex items-center justify-between p-3 rounded cursor-pointer transition-colors ${
                        isChecked
                          ? 'bg-emerald-50 line-through text-gray-400'
                          : 'bg-white hover:bg-gray-100 text-gray-700 shadow-sm'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
                        />
                        <span className="font-medium">{item.name}</span>
                      </div>
                      <div className="text-sm text-gray-500 text-right">
                        {item.amount ? (
                          <span>{item.amount} {item.unit}</span>
                        ) : null}
                        {item.estimatedPricePln ? (
                          <span className="ml-3">{item.estimatedPricePln} zł</span>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-center py-8">Brak wygenerowanej listy zakupów.</p>
      )}
    </div>
  );
};