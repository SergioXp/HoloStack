
export function getAvailableVariants(rarity: string = "Unknown", supertype?: string): Set<string> {
    const r = rarity.toLowerCase();
    const available = new Set<string>();

    // PRIMERO: Rarezas premium (solo holofoil)
    if (r.includes("ultra") ||
        r.includes("secret") ||
        r.includes("special art") ||
        r.includes("illustration") ||
        r.includes("hyper") ||
        r.includes("crown") ||
        r.includes("art rare") ||
        r.includes("double") ||
        r.includes("amazing") ||
        r.includes("shiny") ||
        r.includes("rainbow") ||
        r.includes("gold") ||
        r.includes("full art") ||
        r.includes("character") ||
        r.includes("vmax") ||
        r.includes("vstar") ||
        r.includes("ace spec") ||
        (r.includes("ex") && !r.includes("uncommon"))) {
        available.add("holofoil");
        return available;
    }

    // Energías básicas - solo normal
    if (supertype?.toLowerCase() === "energy" && !r.includes("special")) {
        available.add("normal");
        return available;
    }

    // Rare Holo - holofoil + reverse
    if (r.includes("holo") && r.includes("rare")) {
        available.add("holofoil");
        available.add("reverseHolofoil");
        return available;
    }

    // Rare normal / Common / Uncommon / Trainer - normal + reverse
    // (Incluye 'rare' estandard y cualquier otra cosa no capturada arriba)
    available.add("normal");
    available.add("reverseHolofoil");

    return available;
}
