import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { I18nProvider, useI18n } from './i18n';
import React from 'react';

// Mock localStorage
const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
        getItem: (key: string) => store[key] || null,
        setItem: (key: string, value: string) => {
            store[key] = value.toString();
        },
        clear: () => {
            store = {};
        },
    };
})();

Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
});

// Componente de prueba
const TestComponent = () => {
    const { t, locale, setLocale } = useI18n();
    return (
        <div>
            <span data-testid="current-locale">{locale}</span>
            <span data-testid="translated-text">{t('common.greeting') || 'greeting'}</span>
            <button onClick={() => setLocale('en')}>Switch to English</button>
            <button onClick={() => setLocale('es')}>Cambiar a Español</button>
        </div>
    );
};

// Necesito saber qué claves existen en los JSON reales, pero asumiré algunas o añadiré mock de traducciones.
// Para hacer el test independiente de los archivos JSON reales, lo ideal sería mockear `translations` en i18n, pero están importados directamente.
// En un test unitario real mejor usaríamos los JSON reales para verificar que cargan, o mockear el modulo entero si solo probamos la lógica.
// Probaremos la lógica de cambio de idioma y persistencia.

describe('I18nProvider', () => {
    beforeEach(() => {
        localStorageMock.clear();
        vi.clearAllMocks();
    });

    it('provides default locale (es)', () => {
        render(
            <I18nProvider>
                <TestComponent />
            </I18nProvider>
        );
        expect(screen.getByTestId('current-locale')).toHaveTextContent('es');
    });

    it('persists locale change to localStorage', () => {
        render(
            <I18nProvider>
                <TestComponent />
            </I18nProvider>
        );

        const buttonEn = screen.getByText('Switch to English');
        act(() => {
            buttonEn.click();
        });

        expect(screen.getByTestId('current-locale')).toHaveTextContent('en');
        expect(window.localStorage.getItem('app_locale')).toBe('en');
    });

    it('loads locale from localStorage on mount', () => {
        window.localStorage.setItem('app_locale', 'en');

        render(
            <I18nProvider>
                <TestComponent />
            </I18nProvider>
        );

        expect(screen.getByTestId('current-locale')).toHaveTextContent('en');
    });
});
