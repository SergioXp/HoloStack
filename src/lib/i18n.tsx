"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import esTranslations from "@/locales/es.json";
import enTranslations from "@/locales/en.json";

export type Locale = "es" | "en";

// Idiomas soportados para las cartas (TCGDex soporta estos)
export type CardLanguage = "en" | "es" | "fr" | "de" | "it" | "pt" | "ja" | "ko" | "zh-tw";

export const CARD_LANGUAGES: { code: CardLanguage; name: string }[] = [
    { code: "en", name: "English" },
    { code: "es", name: "Español" },
    { code: "fr", name: "Français" },
    { code: "de", name: "Deutsch" },
    { code: "it", name: "Italiano" },
    { code: "pt", name: "Português" },
    { code: "ja", name: "日本語" },
    { code: "ko", name: "한국어" },
    { code: "zh-tw", name: "繁體中文" },
];

export const APP_LANGUAGES: { code: Locale; name: string }[] = [
    { code: "es", name: "Español" },
    { code: "en", name: "English" },
];

const translations: Record<Locale, typeof esTranslations> = {
    es: esTranslations,
    en: enTranslations,
};

interface I18nContextType {
    locale: Locale;
    setLocale: (locale: Locale) => void;
    t: (key: string, params?: Record<string, string | number>) => string;
    cardLanguage: CardLanguage;
    setCardLanguage: (lang: CardLanguage) => void;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

function getNestedValue(obj: Record<string, any>, path: string): string {
    const keys = path.split(".");
    let result = obj;

    for (const key of keys) {
        if (result && typeof result === "object" && key in result) {
            result = result[key];
        } else {
            return path; // Return key if not found
        }
    }

    return typeof result === "string" ? result : path;
}

export function I18nProvider({ children }: { children: ReactNode }) {
    const [locale, setLocaleState] = useState<Locale>("es");
    const [cardLanguage, setCardLanguageState] = useState<CardLanguage>("en");
    const [isLoaded, setIsLoaded] = useState(false);

    // Load from localStorage on mount
    useEffect(() => {
        const savedLocale = localStorage.getItem("app_locale") as Locale | null;
        const savedCardLang = localStorage.getItem("card_language") as CardLanguage | null;

        if (savedLocale && (savedLocale === "es" || savedLocale === "en")) {
            setLocaleState(savedLocale);
        }

        if (savedCardLang && CARD_LANGUAGES.some(l => l.code === savedCardLang)) {
            setCardLanguageState(savedCardLang);
        }

        setIsLoaded(true);
    }, []);

    const setLocale = (newLocale: Locale) => {
        setLocaleState(newLocale);
        localStorage.setItem("app_locale", newLocale);
    };

    const setCardLanguage = (lang: CardLanguage) => {
        setCardLanguageState(lang);
        localStorage.setItem("card_language", lang);
    };

    const t = (key: string, params?: Record<string, string | number>): string => {
        let text = getNestedValue(translations[locale], key);
        if (params) {
            Object.entries(params).forEach(([paramKey, value]) => {
                text = text.replace(`{${paramKey}}`, String(value));
            });
        }
        return text;
    };

    // Avoid hydration issues by not rendering until loaded
    if (!isLoaded) {
        return null;
    }

    return (
        <I18nContext.Provider value={{ locale, setLocale, t, cardLanguage, setCardLanguage }}>
            {children}
        </I18nContext.Provider>
    );
}

export function useI18n() {
    const context = useContext(I18nContext);
    if (!context) {
        throw new Error("useI18n must be used within an I18nProvider");
    }
    return context;
}

// Hook simplificado solo para traducciones
export function useTranslation() {
    const { t, locale } = useI18n();
    return { t, locale };
}

// Force rebuild of translations
