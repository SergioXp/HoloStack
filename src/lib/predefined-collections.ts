import { Album, Flame, GalleryHorizontal, Gem, Layers, Sparkles, Star, Zap, Crown, Ghost } from "lucide-react";
import { EEVEELUTIONS_NAMES, KANTO_151_NAMES, STARTER_FAMILIES_NAMES } from "./constants/pokemon-lists";

export interface CollectionFilter {
    set?: string;
    series?: string | string[];
    name?: string;
    names?: string[];
    rarity?: string | string[];
    supertype?: string;
    subtypes?: string | string[];
}

export interface CollectionVariant {
    id: string;
    nameKey: string; // Translation key
    filterGenerator: () => CollectionFilter;
}

export interface PredefinedCollection {
    id: string;
    nameKey: string; // Translation key
    descriptionKey: string; // Translation key
    icon: any;
    variants: CollectionVariant[];
}

export const PREDEFINED_COLLECTIONS: PredefinedCollection[] = [
    {
        id: "original-151",
        nameKey: "predefined.original151.title",
        descriptionKey: "predefined.original151.description",
        icon: Album,
        variants: [
            {
                id: "all",
                nameKey: "predefined.variants.all",
                filterGenerator: () => ({ names: KANTO_151_NAMES })
            },
            {
                id: "vintage",
                nameKey: "predefined.variants.vintage",
                filterGenerator: () => ({ names: KANTO_151_NAMES, series: ["Base", "Gym", "Neo"] })
            },
            {
                id: "modern-151",
                nameKey: "predefined.variants.modern151",
                filterGenerator: () => ({ set: "sv3pt5" }) // Scarlet & Violet 151
            },
            {
                id: "full-art",
                nameKey: "predefined.variants.fullArt",
                filterGenerator: () => ({
                    names: KANTO_151_NAMES,
                    rarity: ["Illustration Rare", "Special Illustration Rare", "Rare Ultra", "Hyper Rare", "Rare Secret"]
                })
            }
        ]
    },
    {
        id: "starters",
        nameKey: "predefined.starters.title",
        descriptionKey: "predefined.starters.description",
        icon: Flame,
        variants: [
            {
                id: "all",
                nameKey: "predefined.variants.all",
                filterGenerator: () => ({ names: STARTER_FAMILIES_NAMES })
            },
            {
                id: "kanto",
                nameKey: "predefined.variants.kantoOnly",
                filterGenerator: () => ({
                    names: ["Bulbasaur", "Ivysaur", "Venusaur", "Charmander", "Charmeleon", "Charizard", "Squirtle", "Wartortle", "Blastoise"]
                })
            },
            {
                id: "full-art",
                nameKey: "predefined.variants.fullArt",
                filterGenerator: () => ({
                    names: STARTER_FAMILIES_NAMES,
                    rarity: ["Illustration Rare", "Special Illustration Rare", "Rare Ultra", "Hyper Rare", "Rare Secret"]
                })
            }
        ]
    },
    {
        id: "pikachu",
        nameKey: "predefined.pikachu.title",
        descriptionKey: "predefined.pikachu.description",
        icon: Zap,
        variants: [
            {
                id: "all",
                nameKey: "predefined.variants.all",
                filterGenerator: () => ({ name: "Pikachu" }) // TCGDex search handles variants usually, or we can use LIKE logic in backend
            },
            {
                id: "promos",
                nameKey: "predefined.variants.promos",
                filterGenerator: () => ({ name: "Pikachu", series: ["POP", "Promos", "Black Star Promos"] })
            },
            {
                id: "rare",
                nameKey: "predefined.variants.rareOnly",
                filterGenerator: () => ({ name: "Pikachu", rarity: ["Rare", "Rare Holo", "Rare Ultra", "Rare Secret", "Promo"] })
            }
        ]
    },
    {
        id: "eeveelutions",
        nameKey: "predefined.eeveelutions.title",
        descriptionKey: "predefined.eeveelutions.description",
        icon: Layers,
        variants: [
            {
                id: "all",
                nameKey: "predefined.variants.all",
                filterGenerator: () => ({ names: EEVEELUTIONS_NAMES })
            },
            {
                id: "v-mechanic",
                nameKey: "predefined.variants.mechanics",
                filterGenerator: () => ({ names: EEVEELUTIONS_NAMES, rarity: ["Rare Ultra", "Rare Secret", "Double Rare"] }) // Simplified logic
            },
            {
                id: "trainer-gallery",
                nameKey: "predefined.variants.trainerGallery",
                filterGenerator: () => ({ names: EEVEELUTIONS_NAMES, rarity: ["Trainer Gallery Rare Holo", "Illustration Rare"] })
            }
        ]
    },
    {
        id: "charizard",
        nameKey: "predefined.charizard.title",
        descriptionKey: "predefined.charizard.description",
        icon: Crown,
        variants: [
            {
                id: "all",
                nameKey: "predefined.variants.all",
                filterGenerator: () => ({ name: "Charizard" })
            },
            {
                id: "shiny",
                nameKey: "predefined.variants.shiny",
                filterGenerator: () => ({ name: "Charizard", rarity: ["Shiny Rare", "Shiny Ultra Rare", "Radiant Rare"] })
            },
            {
                id: "vintage",
                nameKey: "predefined.variants.vintage",
                filterGenerator: () => ({ name: "Charizard", series: ["Base", "Neo", "E-Card", "EX"] })
            }
        ]
    },
    {
        id: "illustration-rares",
        nameKey: "predefined.illustration.title",
        descriptionKey: "predefined.illustration.description",
        icon: GalleryHorizontal,
        variants: [
            {
                id: "sv-era",
                nameKey: "predefined.variants.svEra",
                filterGenerator: () => ({ series: "Scarlet & Violet", rarity: ["Illustration Rare", "Special Illustration Rare"] })
            },
            {
                id: "swsh-era",
                nameKey: "predefined.variants.swshEra",
                filterGenerator: () => ({ series: "Sword & Shield", rarity: ["Trainer Gallery Rare Holo"] })
            }
        ]
    },
    {
        id: "full-art-trainers",
        nameKey: "predefined.trainers.title",
        descriptionKey: "predefined.trainers.description",
        icon: Star,
        variants: [
            {
                id: "all",
                nameKey: "predefined.variants.all",
                filterGenerator: () => ({ supertype: "Trainer", subtypes: "Supporter", rarity: ["Ultra Rare", "Rare Ultra", "Hyper Rare", "Special Illustration Rare"] })
            }
        ]
    },
    {
        id: "shiny-vault",
        nameKey: "predefined.shiny.title",
        descriptionKey: "predefined.shiny.description",
        icon: Sparkles,
        variants: [
            {
                id: "paldean-fates",
                nameKey: "predefined.variants.paldeanFates",
                filterGenerator: () => ({ set: "paf" })
            },
            {
                id: "shining-fates",
                nameKey: "predefined.variants.shiningFates",
                filterGenerator: () => ({ set: "shf" })
            },
            {
                id: "hidden-fates",
                nameKey: "predefined.variants.hiddenFates",
                filterGenerator: () => ({ set: "hf" })
            },
            {
                id: "all",
                nameKey: "predefined.variants.allShiny",
                filterGenerator: () => ({ rarity: ["Shiny Rare", "Shiny Ultra Rare", "Radiant Rare"] })
            }
        ]
    },
    {
        id: "promos",
        nameKey: "predefined.promos.title",
        descriptionKey: "predefined.promos.description",
        icon: Gem,
        variants: [
            {
                id: "svp",
                nameKey: "predefined.variants.svp",
                filterGenerator: () => ({ set: "svp" })
            },
            {
                id: "swsh",
                nameKey: "predefined.variants.swsh",
                filterGenerator: () => ({ set: "swsh" })
            },
            {
                id: "smp",
                nameKey: "predefined.variants.smp",
                filterGenerator: () => ({ set: "smp" })
            },
            {
                id: "wizards",
                nameKey: "predefined.variants.wizards",
                filterGenerator: () => ({ set: "bsp" })
            }
        ]
    },
    {
        id: "team-rocket",
        nameKey: "predefined.rocket.title",
        descriptionKey: "predefined.rocket.description",
        icon: Ghost,
        variants: [
            {
                id: "vintage",
                nameKey: "predefined.variants.vintage",
                filterGenerator: () => ({ series: ["Base", "Gym"] }) // This is loose, maybe strict set IDs is better: base5 (Team Rocket), gym1, gym2
            },
            {
                id: "returns",
                nameKey: "predefined.variants.rocketReturns",
                filterGenerator: () => ({ set: "ex7" })
            }
        ]
    }
];
