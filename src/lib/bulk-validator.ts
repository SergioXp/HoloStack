
export interface ValidateInput {
    raw: string;
    number: string;
    quantity: number;
}

export interface SetCardBrief {
    id: string;
    number: string;
    name: string;
    images: string | null;
    rarity: string | null;
}

export function validateBulkInputs(inputs: ValidateInput[], setCards: SetCardBrief[]) {
    // Helper to normalize numbers for comparison (e.g. "001" -> "1", "05" -> "5")
    const normalize = (num: string) => num.replace(/^0+/, '');

    // Map results back to inputs
    return inputs.map((input) => {
        const inputNum = input.number.trim();
        const normalizedInput = normalize(inputNum);

        // Find match: exact match OR normalized match
        const match = setCards.find(c => {
            const dbNum = c.number;
            return dbNum === inputNum || normalize(dbNum) === normalizedInput;
        });

        if (match) {
            // Parse images
            let images = null;
            try { images = JSON.parse(match.images || '{}'); } catch { }

            return {
                ...input,
                status: 'valid',
                card: {
                    id: match.id,
                    name: match.name,
                    image: images?.small || images?.large,
                    rarity: match.rarity
                }
            };
        } else {
            return {
                ...input,
                status: 'invalid', // Not found in DB (maybe needs sync?)
                error: "Not found in local DB"
            };
        }
    });
}
