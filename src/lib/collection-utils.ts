export type OwnershipData = Record<string, Record<string, { quantity: number; id: string }>>;

/**
 * Obtiene la cantidad que se tiene de una variante específica de una carta.
 */
export function getVariantCount(ownershipData: OwnershipData, cardId: string, variant: string): number {
    return ownershipData[cardId]?.[variant]?.quantity || 0;
}

/**
 * Obtiene el total de copias de una carta sumando todas sus variantes.
 */
export function getTotalOwned(ownershipData: OwnershipData, cardId: string): number {
    const data = ownershipData[cardId];
    if (!data) return 0;
    return Object.values(data).reduce((a, b) => a + b.quantity, 0);
}

/**
 * Verifica si se posee al menos una copia de la carta (disponibilidad).
 */
export function isCardOwned(ownershipData: OwnershipData, cardId: string): boolean {
    return getTotalOwned(ownershipData, cardId) > 0;
}

