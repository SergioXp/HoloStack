export type ChangelogEntry = {
    version: string;
    date: string;
    // Keys for i18n lookup: changelog.{version}.title, changelog.{version}.features[]
};

export const changelogData: ChangelogEntry[] = [
    {
        version: "1.0.3",
        date: "2026-01-26"
    },
    {
        version: "1.0.2",
        date: "2026-01-22"
    },
    {
        version: "1.0.1",
        date: "2026-01-21"
    },
    {
        version: "1.0.0",
        date: "2026-01-20"
    },
    {
        version: "0.9.1",
        date: "2026-01-20"
    },
    {
        version: "0.9.0",
        date: "2026-01-20"
    },
    {
        version: "0.8.3",
        date: "2026-01-15"
    },
    {
        version: "0.8.2",
        date: "2026-01-15"
    },
    {
        version: "0.8.1",
        date: "2026-01-15"
    },
    {
        version: "0.7.0",
        date: "2026-01-14"
    }
];
