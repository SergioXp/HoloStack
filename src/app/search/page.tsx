import { performGlobalSearch } from "@/lib/global-search";
import { SearchResultsClient } from "@/components/SearchResultsClient";

interface SearchPageProps {
    searchParams: Promise<{ q?: string }>;
}

export default async function SearchPage(props: SearchPageProps) {
    const searchParams = await props.searchParams;
    const query = searchParams.q || "";

    // Fetch data server-side
    const results = query.length >= 2
        ? await performGlobalSearch(query, { cards: 50, sets: 20, others: 20 })
        : [];

    return <SearchResultsClient query={query} results={results} />;
}
