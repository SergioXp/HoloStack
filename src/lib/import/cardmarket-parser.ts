import { v4 as uuidv4 } from 'uuid';

export interface CardmarketItem {
    id: string; // Temporary ID for the UI
    quantity: number;
    name: string;
    setName: string;
    rarity: string | null;
    language: string | null;
    condition: string | null;
    price: number;
    isShipping: boolean;
    originalText: string;
    // Matching fields
    cardId?: string;
    dbImage?: string;
    // Overrides
    collectionId?: string;
    budgetId?: string;
    variant?: string;
    userNotes?: string;
    seller?: string;
    orderDate?: string;
}

export interface CardmarketOrder {
    orderId: string | null;
    seller: string | null;
    total: number;
    items: CardmarketItem[];
}

export function parseCardmarketText(text: string): CardmarketOrder {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l);
    const items: CardmarketItem[] = [];

    let orderId: string | null = null;
    let seller: string | null = null;
    let orderDate: string | undefined = undefined;
    let total = 0;

    // Regex for Line Item
    // Example: 1x Zacian (Phantasmal Flames) - ART - Español - NM 4,00 EUR
    // Groups: 
    // 1: Quantity
    // 2: Name
    // 3: Set Name (inside parens)
    // 4: Extra Info (Rarity/Code - Language - Condition)
    // 5: Price
    const itemRegex = /^(\d+)x\s+(.+)\s+\((.+?)\)\s+-\s+(.+?)\s+(\d+(?:,\d{2})?)\s+EUR$/i;

    // Regex for Shipping
    // Supports: ES, EN, DE, FR, IT
    const shippingRegex = /^(?:Costos de envío|Shipping costs|Versandkosten|Frais de port|Spese di spedizione)\s+(\d+(?:,\d{2})?)\s+EUR/i;

    // Regex for Order ID
    // Supports: ES, EN, DE, FR, IT
    const orderRegex = /^(?:Pedido|Order|Bestellung|Commande|Ordine)\s+(\d+)$/i;

    // Regex for Seller
    // Supports: ES, EN, DE, FR, IT
    const sellerRegex = /^(?:Vendedor|Seller|Verkäufer|Vendeur|Venditore):\s+(.+)$/i;

    // Regex for Date (DD.MM.YYYY or DD/MM/YYYY or DD-MM-YYYY)
    const dateRegex = /(\d{2})[\/\.-](\d{2})[\/\.-](\d{4})/;



    for (const line of lines) {
        // Check Order ID
        const orderMatch = line.match(orderRegex);
        if (orderMatch) {
            orderId = orderMatch[1];
            continue;
        }



        // Check Date (heuristic: look for date pattern in early lines if not found yet)
        // Usually "Paid: 19.01.2025"
        if (!orderDate) { // Only look if not found yet
            const dateMatch = line.match(dateRegex);
            if (dateMatch) {
                // dateMatch[1] = DD, dateMatch[2] = MM, dateMatch[3] = YYYY
                const day = dateMatch[1];
                const month = dateMatch[2];
                const year = dateMatch[3];
                // naive check
                if (parseInt(year) > 2000) {
                    orderDate = `${year}-${month}-${day}`;
                }
            }
        }


        // Check Seller
        const sellerMatch = line.match(sellerRegex);
        if (sellerMatch) {
            seller = sellerMatch[1];
            continue;
        }

        // Check Shipping
        const shippingMatch = line.match(shippingRegex);
        if (shippingMatch) {
            const price = parseFloat(shippingMatch[1].replace(',', '.'));
            items.push({
                id: uuidv4(),
                quantity: 1,
                name: "Envío / Shipping",
                setName: "Shipping",
                rarity: null,
                language: null,
                condition: null,
                price: price,
                isShipping: true,
                originalText: line
            });
            continue;
        }

        // Check Item
        const itemMatch = line.match(itemRegex);
        if (itemMatch) {
            const quantity = parseInt(itemMatch[1]);
            const name = itemMatch[2];
            const setName = itemMatch[3];
            const metaString = itemMatch[4]; // "ART - Español - NM" or "C - Español - NM"
            const price = parseFloat(itemMatch[5].replace(',', '.'));

            // Parse Meta String
            // Usually: [Rarity] - [Language] - [Condition]
            // But sometimes Rarity might be missing or different?
            const metaParts = metaString.split('-').map(s => s.trim());

            // Heuristic: Last part is usually Condition, Second to last is Language
            let condition = null;
            let language = null;
            let rarity = null;

            if (metaParts.length >= 1) condition = metaParts[metaParts.length - 1]; // NM
            if (metaParts.length >= 2) language = metaParts[metaParts.length - 2]; // Español
            if (metaParts.length >= 3) {
                rarity = metaParts.slice(0, metaParts.length - 2).join(' - ').trim(); // "ART" or "UR" or "C"
            }

            // Extract Variant from Name (e.g. "Zacian (Reverse Holo)")
            let cleanName = name;
            let variant = "normal";

            if (cleanName.toLowerCase().includes("(reverse holo)")) {
                variant = "reverse holo";
                cleanName = cleanName.replace(/\(reverse holo\)/i, "").trim();
            } else if (cleanName.toLowerCase().includes("(holo)")) {
                variant = "holo";
                cleanName = cleanName.replace(/\(holo\)/i, "").trim();
            }

            items.push({
                id: uuidv4(),
                quantity,
                name: cleanName,
                setName,
                rarity,
                language,
                condition,
                price,
                isShipping: false,
                originalText: line,
                variant
            });
            continue;
        }

        // Check Total line just to verify or skip
        if (line.startsWith("Total") && line.endsWith("EUR")) {
            // Maybe parse total just to check?
            // Not strictly needed if we calculate it from items
        }
    }



    // Post-process items to apply global metadata
    const finalDate = orderDate || new Date().toISOString().split('T')[0];

    const finalItems = items.map(item => ({
        ...item,
        seller: seller || undefined,
        orderDate: finalDate,
        userNotes: `Cardmarket - ${seller || '?'} - ${finalDate} - ${item.price.toFixed(2)}€`
    }));

    return {
        orderId,
        seller,
        total: finalItems.reduce((acc, item) => acc + item.price, 0),
        items: finalItems
    };
}
