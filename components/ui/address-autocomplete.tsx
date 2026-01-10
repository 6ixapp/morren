'use client';

import { useState, useEffect, useRef } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { MapPin, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AddressSuggestion {
    place_id: number;
    display_name: string;
    lat: string;
    lon: string;
    address: {
        road?: string;
        suburb?: string;
        city?: string;
        state?: string;
        postcode?: string;
        country?: string;
    };
}

interface AddressAutocompleteProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    disabled?: boolean;
}

export function AddressAutocomplete({
    value,
    onChange,
    placeholder = "Enter pickup address...",
    className,
    disabled = false
}: AddressAutocompleteProps) {
    const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const debounceTimer = useRef<NodeJS.Timeout | null>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Close suggestions when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Fetch address suggestions from OpenStreetMap Nominatim
    const fetchAddressSuggestions = async (query: string) => {
        if (query.length < 3) {
            setSuggestions([]);
            return;
        }

        setIsLoading(true);
        try {
            // Using Nominatim API with country code for India
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?` +
                new URLSearchParams({
                    q: query,
                    format: 'json',
                    addressdetails: '1',
                    countrycodes: 'in', // Restrict to India
                    limit: '5',
                    'accept-language': 'en'
                }),
                {
                    headers: {
                        'User-Agent': 'MorrenApp/1.0' // Required by Nominatim
                    }
                }
            );

            if (response.ok) {
                const data = await response.json();
                setSuggestions(data);
                setShowSuggestions(true);
            }
        } catch (error) {
            console.error('Error fetching address suggestions:', error);
            setSuggestions([]);
        } finally {
            setIsLoading(false);
        }
    };

    // Debounced search
    const handleInputChange = (newValue: string) => {
        onChange(newValue);
        setSelectedIndex(-1);

        // Clear existing timer
        if (debounceTimer.current) {
            clearTimeout(debounceTimer.current);
        }

        // Set new timer
        debounceTimer.current = setTimeout(() => {
            fetchAddressSuggestions(newValue);
        }, 500); // Wait 500ms after user stops typing
    };

    // Handle suggestion selection
    const handleSelectSuggestion = (suggestion: AddressSuggestion) => {
        onChange(suggestion.display_name);
        setSuggestions([]);
        setShowSuggestions(false);
        setSelectedIndex(-1);
    };

    // Handle keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!showSuggestions || suggestions.length === 0) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setSelectedIndex(prev =>
                    prev < suggestions.length - 1 ? prev + 1 : prev
                );
                break;
            case 'ArrowUp':
                e.preventDefault();
                setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
                break;
            case 'Enter':
                e.preventDefault();
                if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
                    handleSelectSuggestion(suggestions[selectedIndex]);
                }
                break;
            case 'Escape':
                setShowSuggestions(false);
                setSelectedIndex(-1);
                break;
        }
    };

    return (
        <div ref={wrapperRef} className="relative w-full">
            <div className="relative">
                <Textarea
                    value={value}
                    onChange={(e) => handleInputChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => {
                        if (suggestions.length > 0) {
                            setShowSuggestions(true);
                        }
                    }}
                    placeholder={placeholder}
                    className={cn("pr-10 resize-none", className)}
                    disabled={disabled}
                    rows={2}
                />
                <div className="absolute right-3 top-3 pointer-events-none">
                    {isLoading ? (
                        <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
                    ) : (
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                    )}
                </div>
            </div>

            {/* Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {suggestions.map((suggestion, index) => (
                        <button
                            key={suggestion.place_id}
                            type="button"
                            onClick={() => handleSelectSuggestion(suggestion)}
                            className={cn(
                                "w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors border-b border-gray-100 dark:border-gray-800 last:border-b-0",
                                selectedIndex === index && "bg-gray-100 dark:bg-gray-800"
                            )}
                        >
                            <div className="flex items-start gap-2">
                                <MapPin className="h-4 w-4 text-emerald-600 mt-1 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                        {suggestion.address?.road || suggestion.address?.suburb || 'Address'}
                                    </p>
                                    <p className="text-xs text-muted-foreground line-clamp-2">
                                        {suggestion.display_name}
                                    </p>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            )}

            {/* No results message */}
            {showSuggestions && !isLoading && suggestions.length === 0 && value.length >= 3 && (
                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4">
                    <p className="text-sm text-muted-foreground text-center">
                        No addresses found. Try a different search term.
                    </p>
                </div>
            )}
        </div>
    );
}
