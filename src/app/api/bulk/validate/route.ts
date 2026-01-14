
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { cards } from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { setId, inputs } = body;

        if (!setId || !inputs || !Array.isArray(inputs)) {
            return NextResponse.json({ error: "Invalid request" }, { status: 400 });
        }

        // inputs is array of { raw: string, number: string, quantity: number }
        // We need to check if these numbers exist in the set
        // Extract numbers to query
        const numbersToCheck = inputs.map((i: any) => i.number);

        // Fetch ALL cards in the set to perform smart matching in memory
        // Sets are usually small (<300 cards) so this is performant.
        const setCards = await db.select({
            id: cards.id,
            number: cards.number,
            name: cards.name,
            images: cards.images,
            rarity: cards.rarity
        })
            .from(cards)
            .where(eq(cards.setId, setId));

        // Helper to normalize numbers for comparison (e.g. "001" -> "1", "05" -> "5")
        const normalize = (num: string) => num.replace(/^0+/, '');

        // Map results back to inputs
        const results = inputs.map((input: any) => {
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

        return NextResponse.json({ results });

    } catch (error) {
        console.error("Bulk Validate Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
