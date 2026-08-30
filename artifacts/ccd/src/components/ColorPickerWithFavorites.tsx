import React from 'react';
import { Plus, X, Star } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContextNew';

interface ColorPickerWithFavoritesProps {
  value: string;
  onChange: (color: string) => void;
  id?: string;
  className?: string;
  swatchClassName?: string;
}

export function ColorPickerWithFavorites({
  value,
  onChange,
  id,
  className = 'h-10 w-10 rounded-lg border border-gray-300 cursor-pointer',
  swatchClassName = 'w-7 h-7 rounded-md border border-gray-200 cursor-pointer transition-transform hover:scale-105',
}: ColorPickerWithFavoritesProps) {
  const { favoriteColors, addFavoriteColor, removeFavoriteColor } = useSettings();
  const isFavorite = favoriteColors.includes(value.toUpperCase()) || favoriteColors.includes(value);

  const normalizedFavorites = favoriteColors.map((c) => c.toLowerCase());

  const handleFavoriteToggle = () => {
    const color = value.toUpperCase();
    if (normalizedFavorites.includes(color.toLowerCase())) {
      removeFavoriteColor(color);
    } else {
      addFavoriteColor(color);
    }
  };

  return (
    <div className="space-y-2">
      {favoriteColors.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-400" />
            <span className="text-xs font-medium text-gray-600">Favourite colours</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {favoriteColors.map((color) => (
              <div key={color} className="relative group">
                <button
                  type="button"
                  onClick={() => onChange(color)}
                  className={`${swatchClassName} ${value.toLowerCase() === color.toLowerCase() ? 'ring-2 ring-teal-500 ring-offset-1' : ''}`}
                  style={{ backgroundColor: color }}
                  title={`Use ${color}`}
                  aria-label={`Use colour ${color}`}
                />
                <button
                  type="button"
                  onClick={() => removeFavoriteColor(color)}
                  className="absolute -top-1 -right-1 hidden group-hover:flex h-4 w-4 items-center justify-center rounded-full bg-gray-800 text-white"
                  title="Remove from favourites"
                  aria-label={`Remove ${color} from favourites`}
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="flex items-center gap-2">
        <label
          htmlFor={id}
          className={`relative inline-block shrink-0 overflow-hidden ${className}`}
          style={{ backgroundColor: value }}
          title={value}
        >
          <input
            id={id}
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            aria-label="Pick colour"
          />
        </label>
        <button
          type="button"
          onClick={handleFavoriteToggle}
          className={`inline-flex h-10 items-center gap-1 px-3 text-xs rounded-lg border transition-colors ${
            isFavorite
              ? 'border-amber-300 bg-amber-50 text-amber-800'
              : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100'
          }`}
          title={isFavorite ? 'Remove from favourites' : 'Save to favourites'}
        >
          {isFavorite ? <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" /> : <Plus className="h-3.5 w-3.5" />}
          <span>{isFavorite ? 'Saved' : 'Save'}</span>
        </button>
      </div>
    </div>
  );
}
