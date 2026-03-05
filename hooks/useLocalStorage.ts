import { useState, useEffect, Dispatch, SetStateAction } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T): [T, Dispatch<SetStateAction<T>>] {
    const [storedValue, setStoredValue] = useState<T>(() => {
        if (typeof window === "undefined") {
            return initialValue;
        }
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.error(`[useLocalStorage] Error reading localStorage key “${key}”:`, error);
            return initialValue;
        }
    });

    useEffect(() => {
        try {
            if (typeof window !== "undefined") {
                // Previne o salvamento do valor inicial se ele for idêntico ao que já está no localStorage,
                // evitando escritas desnecessárias no primeiro render.
                const itemInStorage = window.localStorage.getItem(key);
                if (JSON.stringify(storedValue) !== itemInStorage) {
                     window.localStorage.setItem(key, JSON.stringify(storedValue));
                }
            }
        } catch (error) {
            console.error(`[useLocalStorage] Error setting localStorage key “${key}”:`, error);
        }
    }, [key, storedValue]);
    
    return [storedValue, setStoredValue];
}