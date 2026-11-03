import React, { useState, useEffect } from 'react';

interface ShoppingItem {
  name: string;
  amount?: number;
  unit?: string;
  estimatedPricePln?: number;
}

interface ShoppingCategory {
  category: string;
  items: ShoppingItem[];
}

interface ShoppingListViewProps {
  shoppingList: ShoppingCategory[] | string[];
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

  const toggleItem = (itemName: string) => {
    setCheckedItems(prev => ({
      ...prev,
      [itemName]: !prev[itemName]
    }));
  };

  const safeList = shoppingList || [];

  return (
    <div className="p-6 max-w-4xl mx-auto bg-white rounded-xl shadow-md space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b pb-4 gap-2">
        <h2 className="text-2xl font-bold text-gray-800">🛒 Lista Zakupów</h2>
        <div className="text-left sm:text-right">
          {totalBudget !== undefined && (
            <p className="text-xs text-gray-400">Twój budżet: {totalBudget} zł</p>
          )}
        </div>
      </div>

      {safeList.length > 0 ? (
        <div className="space-y-6">
          {safeList.map((catOrItem: any, catIdx: number) => {
            // Przypadek 1: Jeśli backend zwrócił listę podzieloną na kategorie
            if (catOrItem && typeof catOrItem === 'object' && catOrItem.category) {
              return (
                <div key={catIdx} className="border rounded-lg p-4 bg-gray-50">
                  <h3 className="text-lg font-semibold text-emerald-700 mb-3">{catOrItem.category}</h3>
                  <ul className="space-y-2">
                    {(catOrItem.items || []).map((item: any, itemIdx: number) => {
                      const itemName = typeof item === 'string' ? item : item.name;
                      const isChecked = !!checkedItems[itemName];

                      return (
                        <li 
                          key={itemIdx} 
                          onClick={() => toggleItem(itemName)}
                          className={`flex items-center justify-between p-3 rounded cursor-pointer transition-colors ${
                            isChecked ? 'bg-emerald-50 line-through text-gray-400' : 'bg-white hover:bg-gray-100 text-gray-700 shadow-sm'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <input 
                              type="checkbox" 
                              checked={isChecked} 
                              onChange={() => {}} 
                              className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
                            />
                            <span className="font-medium">{itemName}</span>
                          </div>
                          {item.amount && item.unit && (
                            <span className="text-sm text-gray-500">{item.amount} {item.unit}</span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            }

            const itemName = typeof catOrItem === 'string' ? catOrItem : catOrItem.name;
            const isChecked = !!checkedItems[itemName];

            return (
              <div key={catIdx} className="border rounded-lg p-3 bg-white shadow-sm flex items-center justify-between cursor-pointer" onClick={() => toggleItem(itemName)}>
                <div className="flex items-center space-x-3">
                  <input type="checkbox" checked={isChecked} onChange={() => {}} className="w-4 h-4 text-emerald-600 rounded cursor-pointer" />
                  <span className={`font-medium ${isChecked ? 'line-through text-gray-400' : 'text-gray-700'}`}>{itemName}</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-gray-500 text-center py-8">Brak wygenerowanej listy zakupów.</p>
      )}
    </div>
  );
};