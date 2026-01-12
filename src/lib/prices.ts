/**
 * Módulo centralizado de gestión de precios
 * Fase 2.5: Precisión y Datos
 */

export type Currency = "EUR" | "USD" | "GBP";
export type Market = "tcgplayer" | "cardmarket" | "ebay";
export type Variant = "normal" | "holofoil" | "reverseHolofoil" | "1stEditionHolofoil" | "1stEditionNormal";

export interface PriceData {
    low?: number;
    mid?: number;
    high?: number;
    market?: number;
    directLow?: number;
}

export interface TCGPlayerPrices {
    normal?: PriceData;
    holofoil?: PriceData;
    reverseHolofoil?: PriceData;
    "1stEditionHolofoil"?: PriceData;
    "1stEditionNormal"?: PriceData;
}

export interface CardmarketPrices {
    averageSellPrice?: number;
    lowPrice?: number;
    trendPrice?: number;
    germanProLow?: number;
    suggestedPrice?: number;
    reverseHoloSell?: number;
    reverseHoloLow?: number;
    reverseHoloTrend?: number;
    lowPriceExPlus?: number;
    avg1?: number;
    avg7?: number;
    avg30?: number;
}

// Tasas de cambio (actualizables via API externa en el futuro)
const EXCHANGE_RATES: Record<string, number> = {
    "USD_EUR": 0.92,
    "EUR_USD": 1.09,
    "USD_GBP": 0.79,
    "GBP_USD": 1.27,
    "EUR_GBP": 0.86,
    "GBP_EUR": 1.16,
};

/**
 * Convierte una cantidad de una moneda a otra
 */
export function convertCurrency(amount: number, from: Currency, to: Currency): number {
    if (from === to) return amount;

    const key = `${from}_${to}`;
    const rate = EXCHANGE_RATES[key];

    if (!rate) {
        console.warn(`No exchange rate found for ${from} -> ${to}, using 1:1`);
        return amount;
    }

    return Number((amount * rate).toFixed(2));
}

/**
 * Formatea un precio según la moneda
 */
export function formatPrice(amount: number | undefined | null, currency: Currency = "USD"): string {
    if (amount === undefined || amount === null || isNaN(amount)) {
        return "-";
    }

    const locales: Record<Currency, string> = {
        EUR: "es-ES",
        USD: "en-US",
        GBP: "en-GB",
    };

    return new Intl.NumberFormat(locales[currency], {
        style: "currency",
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
}

/**
 * Parsea los precios de TCGPlayer desde el JSON almacenado
 */
export function parseTCGPlayerPrices(jsonString: string | null | undefined): TCGPlayerPrices | null {
    if (!jsonString) return null;
    try {
        return JSON.parse(jsonString) as TCGPlayerPrices;
    } catch {
        return null;
    }
}

/**
 * Parsea los precios de Cardmarket desde el JSON almacenado
 */
export function parseCardmarketPrices(jsonString: string | null | undefined): CardmarketPrices | null {
    if (!jsonString) return null;
    try {
        return JSON.parse(jsonString) as CardmarketPrices;
    } catch {
        return null;
    }
}

/**
 * Obtiene el precio de mercado de una carta según su variante
 * Prioriza: marketPrice > midPrice > lowPrice
 * Maneja variantes con diferentes formatos de la API
 */
export function getMarketPrice(
    tcgPrices: TCGPlayerPrices | null,
    variant: Variant = "normal"
): number | null {
    if (!tcgPrices || Object.keys(tcgPrices).length === 0) return null;

    // Mapear variante interna a posibles claves en la API
    const variantMappings: Record<string, string[]> = {
        "normal": ["normal", "unlimited", "holofoil"],
        "holofoil": ["holofoil", "normal", "unlimited"],
        "reverseHolofoil": ["reverseHolofoil", "reverse-holofoil", "reverseHoloSell"],
        "1stEditionHolofoil": ["1stEditionHolofoil", "1st-edition", "1stEdition"],
        "1stEditionNormal": ["1stEditionNormal", "1st-edition", "1stEdition"],
    };

    const keysToTry = variantMappings[variant] || [variant, "normal", "unlimited", "holofoil"];

    // Función para extraer precio de un objeto de variante
    const extractPrice = (data: any): number | null => {
        if (!data || typeof data !== "object") return null;
        return data.marketPrice ?? data.market ?? data.midPrice ?? data.mid ?? data.lowPrice ?? data.low ?? null;
    };

    // Intentar encontrar precio para cada clave posible
    for (const key of keysToTry) {
        const priceData = (tcgPrices as Record<string, any>)[key];
        const price = extractPrice(priceData);
        if (price !== null && price > 0) {
            return price;
        }
    }

    // Fallback: buscar en cualquier variante que tenga precio
    for (const key of Object.keys(tcgPrices)) {
        if (key === "updated" || key === "unit") continue; // Skip metadata
        const priceData = (tcgPrices as Record<string, any>)[key];
        const price = extractPrice(priceData);
        if (price !== null && price > 0) {
            return price;
        }
    }

    return null;
}

/**
 * Obtiene el precio de Cardmarket (en EUR)
 */
export function getCardmarketPrice(cmPrices: CardmarketPrices | null): number | null {
    if (!cmPrices) return null;
    return cmPrices.trendPrice ?? cmPrices.averageSellPrice ?? cmPrices.lowPrice ?? null;
}

/**
 * Obtiene el mejor precio disponible de cualquier fuente, convertido a la moneda deseada
 */
export function getBestPrice(
    tcgPricesJson: string | null | undefined,
    cardmarketPricesJson: string | null | undefined,
    variant: Variant = "normal",
    targetCurrency: Currency = "EUR"
): { price: number; source: Market; currency: Currency } | null {
    const tcgPrices = parseTCGPlayerPrices(tcgPricesJson);
    const cmPrices = parseCardmarketPrices(cardmarketPricesJson);

    const tcgPrice = getMarketPrice(tcgPrices, variant);
    const cmPrice = getCardmarketPrice(cmPrices);

    // Preferir Cardmarket para Europa (ya está en EUR)
    if (targetCurrency === "EUR" && cmPrice !== null) {
        return { price: cmPrice, source: "cardmarket", currency: "EUR" };
    }

    // Preferir TCGPlayer para USA (ya está en USD)
    if (targetCurrency === "USD" && tcgPrice !== null) {
        return { price: tcgPrice, source: "tcgplayer", currency: "USD" };
    }

    // Fallback: convertir lo que haya disponible
    if (cmPrice !== null) {
        const converted = targetCurrency === "EUR" ? cmPrice : convertCurrency(cmPrice, "EUR", targetCurrency);
        return { price: converted, source: "cardmarket", currency: targetCurrency };
    }

    if (tcgPrice !== null) {
        const converted = targetCurrency === "USD" ? tcgPrice : convertCurrency(tcgPrice, "USD", targetCurrency);
        return { price: converted, source: "tcgplayer", currency: targetCurrency };
    }

    return null;
}

/**
 * Calcula el valor total de un conjunto de cartas
 */
export function calculateTotalValue(
    items: Array<{
        tcgplayerPrices: string | null;
        cardmarketPrices: string | null;
        variant: Variant;
        quantity: number;
    }>,
    targetCurrency: Currency = "EUR"
): number {
    return items.reduce((total, item) => {
        const priceInfo = getBestPrice(
            item.tcgplayerPrices,
            item.cardmarketPrices,
            item.variant,
            targetCurrency
        );
        if (priceInfo) {
            return total + (priceInfo.price * item.quantity);
        }
        return total;
    }, 0);
}
