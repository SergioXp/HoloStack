/**
 * Limpia el nombre de un Pokémon para emparejarlo con su especie oficial (Pokédex).
 * Elimina sufijos de TCG (ex, V, VMAX), estilos de combate y normaliza caracteres especiales.
 */
export function cleanNameForSpecies(name: string): string {
    if (!name) return "";

    return name
        .toLowerCase()
        // 1. Eliminar estilos de combate y otras mecánicas
        .replace(/(?:rapid|single|fusion)\s+strike\s+/i, '')
        .replace(/(?:teal|wellspring|hearthflame|cornerstone)\s+mask\s+/i, '')
        .replace(/bloodmoon\s+/i, '')
        .replace(/\s*(?:ex|gx|vmax|vstar|v|break|gmax|tera)$/i, '')
        // 2. Eliminar prefijos regionales y formas (opcional, pero ayuda al matching base)
        .replace(/\s*(?:mega|alolan|galarian|hisuian|paldean|gigantamax)\s+/i, '')
        // 3. Manejar Tag Teams (solo el primer pokémon)
        .split('&')[0]
        .split(' (')[0]
        .split(' [')[0]
        // 4. Normalizar caracteres especiales
        .replace('♂', '-m')
        .replace('♀', '-f')
        .replace(/\'/g, '')
        .replace(/\’/g, '')
        .replace(/\é/g, 'e')
        .replace(/\./g, '')
        // 5. Limpieza final
        .trim()
        .replace(/\s+/g, '-');
}
