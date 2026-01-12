/**
 * Hook para refrescar precios automáticamente si tienen más de 24h
 * Se ejecuta en background sin bloquear la UI
 */

export async function refreshPricesIfStale(cardIds: string[]): Promise<void> {
    if (!cardIds || cardIds.length === 0) return;

    try {
        // Llamar en background, no esperamos respuesta
        fetch("/api/prices/refresh", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ cardIds }),
        }).catch(console.error);
    } catch (error) {
        console.error("Error triggering price refresh:", error);
    }
}

/**
 * Verifica si un precio está desactualizado (más de 24h)
 */
export function isPriceStale(pricesJson: string | null | undefined): boolean {
    if (!pricesJson) return true;

    try {
        const data = JSON.parse(pricesJson);
        const updatedAt = data.updated ? new Date(data.updated).getTime() : 0;
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours
        return Date.now() - updatedAt > maxAge;
    } catch {
        return true;
    }
}

/**
 * Obtiene la fecha de última actualización de un precio
 */
export function getPriceUpdatedAt(pricesJson: string | null | undefined): Date | null {
    if (!pricesJson) return null;

    try {
        const data = JSON.parse(pricesJson);
        return data.updated ? new Date(data.updated) : null;
    } catch {
        return null;
    }
}

/**
 * Formatea la antigüedad de un precio de forma legible
 */
// t type definition (simplified)
type TranslateFn = (key: string, options?: any) => string;

export function formatPriceAge(pricesJson: string | null | undefined, t?: TranslateFn): string {
    const updatedAt = getPriceUpdatedAt(pricesJson);
    // Fallback strings if t is not provided (for backward compatibility during migration)
    const noData = t ? t("common.noData") : "Sin datos";
    const justNow = t ? t("common.time.justNow") : "reciente";

    if (!updatedAt) return noData;

    const diffMs = Date.now() - updatedAt.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
        return t ? t("common.time.daysAgo", { n: diffDays }) : `hace ${diffDays}d`;
    } else if (diffHours > 0) {
        return t ? t("common.time.hoursAgo", { n: diffHours }) : `hace ${diffHours}h`;
    } else {
        return justNow;
    }
}
