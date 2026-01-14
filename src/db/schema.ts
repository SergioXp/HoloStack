import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

// ============================================
// ESQUEMA DE USUARIOS
// ============================================
export const users = sqliteTable("users", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("user"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

// ============================================
// ESQUEMA DE PERFIL DE USUARIO
// ============================================
export const userProfiles = sqliteTable("user_profiles", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().default("guest"), // 'guest' para usuario local sin auth
  // Información personal
  displayName: text("display_name"),
  avatarUrl: text("avatar_url"),
  // Idiomas
  appLanguage: text("app_language").notNull().default("es"), // es | en
  cardLanguage: text("card_language").notNull().default("en"), // en | es | fr | de | it | pt | ja | ko | zh-tw
  // Cuentas de marketplaces
  cardmarketUsername: text("cardmarket_username"),
  tcgplayerUsername: text("tcgplayer_username"),
  ebayUsername: text("ebay_username"),
  // Preferencias adicionales
  preferredCurrency: text("preferred_currency").default("EUR"), // EUR | USD
  // Metadatos
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export type UserProfile = typeof userProfiles.$inferSelect;
export type NewUserProfile = typeof userProfiles.$inferInsert;

// ============================================
// ESQUEMA DE SETS (Pokémon TCG)
// ============================================
export const sets = sqliteTable("sets", {
  // ID único del set (ej: "base1", "swsh1")
  id: text("id").primaryKey(),
  // Nombre del set (ej: "Base Set", "Sword & Shield")
  name: text("name").notNull(),
  // Serie a la que pertenece (ej: "Base", "Sword & Shield")
  series: text("series").notNull(),
  // Total de cartas impresas vs total real
  printedTotal: integer("printed_total").notNull(),
  total: integer("total").notNull(),
  // Fecha de lanzamiento (formato ISO)
  releaseDate: text("release_date"),
  // Imágenes (JSON con symbol y logo URLs)
  images: text("images"),
  // Metadatos de sincronización
  syncedAt: integer("synced_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export type Set = typeof sets.$inferSelect;
export type NewSet = typeof sets.$inferInsert;

// ============================================
// ESQUEMA DE CARTAS (Pokémon TCG)
// ============================================
export const cards = sqliteTable("cards", {
  // ID único de la carta (ej: "base1-1")
  id: text("id").primaryKey(),
  // Referencia al set
  setId: text("set_id").notNull().references(() => sets.id),
  // Información básica
  name: text("name").notNull(),
  supertype: text("supertype").notNull(), // "Pokémon", "Trainer", "Energy"
  subtypes: text("subtypes"), // JSON array
  hp: text("hp"),
  types: text("types"), // JSON array
  // Evolución
  evolvesFrom: text("evolves_from"),

  // Número en el set e info de impresión
  number: text("number").notNull(),
  artist: text("artist"),
  rarity: text("rarity"),
  // Imágenes (JSON con small y large URLs)
  images: text("images"),
  // Precios (JSON)
  tcgplayerPrices: text("tcgplayer_prices", { mode: "json" }),
  cardmarketPrices: text("cardmarket_prices", { mode: "json" }),

  // Gameplay Fields for Proxies
  attacks: text("attacks", { mode: "json" }),
  abilities: text("abilities", { mode: "json" }),
  weaknesses: text("weaknesses", { mode: "json" }),
  retreatCost: text("retreat_cost", { mode: "json" }),

  // Metadatos
  isPartial: integer("is_partial", { mode: "boolean" }).default(false),
  syncedAt: integer("synced_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export type Card = typeof cards.$inferSelect;
export type NewCard = typeof cards.$inferInsert;

// ============================================
// ESQUEMA DE COLECCIONES
// ============================================
export const collections = sqliteTable("collections", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull(), // Asumimos soporte multi-usuario futuro o 'guest' por defecto
  name: text("name").notNull(),
  description: text("description"), // Descripción opcional de la colección
  type: text("type").notNull(), // 'manual' | 'auto'
  filters: text("filters"), // JSON: { set: 'base1', rarity: 'Rare' } para colecciones auto
  // Idioma de las cartas para esta colección (null = usar perfil del usuario)
  language: text("language"), // null | en | es | fr | de | it | pt | ja | ko | zh-tw
  // Configuración de visualización
  showPrices: integer("show_prices", { mode: "boolean" }).default(true),
  sortBy: text("sort_by").default("number"), // number | name | rarity | price
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export type Collection = typeof collections.$inferSelect;
export type NewCollection = typeof collections.$inferInsert;

// Tabla para índice global de nombres de Pokémon (desde PokeAPI)
export const pokemonSpecies = sqliteTable("pokemon_species", {
  id: integer("id").primaryKey(), // PokeAPI ID
  name: text("name").notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }),
});

export const collectionItems = sqliteTable("collection_items", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  collectionId: text("collection_id").notNull().references(() => collections.id, { onDelete: 'cascade' }),
  cardId: text("card_id").notNull().references(() => cards.id),
  variant: text("variant").notNull().default("normal"), // 'normal', 'holofoil', 'reverseHolofoil', etc.
  quantity: integer("quantity").default(1),
  addedAt: integer("added_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export type CollectionItem = typeof collectionItems.$inferSelect;
export type NewCollectionItem = typeof collectionItems.$inferInsert;

// ============================================
// ESQUEMA DE HISTORIAL DE PRECIOS
// ============================================
export const priceHistory = sqliteTable("price_history", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  cardId: text("card_id").notNull().references(() => cards.id),
  date: text("date").notNull(), // ISO date string (YYYY-MM-DD)
  marketPrice: real("market_price").notNull(), // Precio en USD
  source: text("source").notNull().default("tcgplayer"), // 'tcgplayer' | 'cardmarket'
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export type PriceHistory = typeof priceHistory.$inferSelect;
export type NewPriceHistory = typeof priceHistory.$inferInsert;

// ============================================
// ESQUEMA DE TRABAJOS DE SINCRONIZACIÓN
// ============================================
export const syncJobs = sqliteTable("sync_jobs", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  type: text("type").notNull(), // 'set' | 'collection' | 'all_sets'
  targetId: text("target_id"), // setId o collectionId (null para all_sets)
  targetName: text("target_name"), // Nombre legible para UI
  status: text("status").notNull().default("pending"), // pending | running | paused | done | error
  priority: integer("priority").default(0), // 0=normal, 10=high (usuario pidió)
  progress: integer("progress").default(0), // 0-100
  totalItems: integer("total_items").default(0),
  processedItems: integer("processed_items").default(0),
  errorMessage: text("error_message"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  startedAt: integer("started_at", { mode: "timestamp" }),
  completedAt: integer("completed_at", { mode: "timestamp" }),
});

export type SyncJob = typeof syncJobs.$inferSelect;
export type NewSyncJob = typeof syncJobs.$inferInsert;

// ============================================
// ESQUEMA DE PRESUPUESTOS
// ============================================
export const budgets = sqliteTable("budgets", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().default("guest"),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'global' | 'collection'
  collectionId: text("collection_id"), // FK opcional a collections (null si global)
  amount: real("amount").notNull(), // Cantidad del presupuesto
  currency: text("currency").notNull().default("EUR"), // EUR | USD
  period: text("period").notNull().default("monthly"), // 'monthly' | 'yearly' | 'one-time'
  startDate: text("start_date"), // Fecha de inicio (ISO)
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export type Budget = typeof budgets.$inferSelect;
export type NewBudget = typeof budgets.$inferInsert;

// Tabla para agrupar presupuestos (hijos bajo un padre global)
export const budgetGroups = sqliteTable("budget_groups", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  parentBudgetId: text("parent_budget_id").notNull(), // FK al presupuesto padre (global)
  childBudgetId: text("child_budget_id").notNull(), // FK al presupuesto hijo
});

export type BudgetGroup = typeof budgetGroups.$inferSelect;
export type NewBudgetGroup = typeof budgetGroups.$inferInsert;

// ============================================
// ESQUEMA DE GASTOS
// ============================================
export const expenses = sqliteTable("expenses", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  budgetId: text("budget_id").notNull(), // FK al presupuesto
  date: text("date").notNull(), // Fecha de la compra (ISO: YYYY-MM-DD)
  description: text("description").notNull(), // Descripción del artículo
  category: text("category").notNull().default("other"), // 'single_card' | 'sealed' | 'etb' | 'booster' | 'accessory' | 'other'
  amount: real("amount").notNull(), // Importe gastado
  currency: text("currency").notNull().default("EUR"), // Moneda del gasto
  packCount: integer("pack_count"), // Número de sobres (opcional, para calcular coste/sobre)
  seller: text("seller"), // Vendedor/tienda (opcional)
  platform: text("platform"), // 'cardmarket' | 'tcgplayer' | 'ebay' | 'tiktokshop' | 'amazon' | 'lgs' | 'other'
  notes: text("notes"), // Notas adicionales
  cardId: text("card_id"), // FK opcional a cards
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export type Expense = typeof expenses.$inferSelect;
export type NewExpense = typeof expenses.$inferInsert;

// ============================================
// ESQUEMA DE ETIQUETAS y WISHLIST (FASE 2)
// ============================================

export const tags = sqliteTable("tags", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  color: text("color").default("slate"),
});

export const itemTags = sqliteTable("item_tags", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  itemId: text("item_id").notNull().references(() => collectionItems.id, { onDelete: 'cascade' }),
  tagId: integer("tag_id").notNull().references(() => tags.id, { onDelete: 'cascade' }),
});

export const wishlistItems = sqliteTable("wishlist_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  cardId: text("card_id").notNull().references(() => cards.id),
  userId: text("user_id").default("guest"),
  addedAt: integer("added_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  priority: text("priority").default("normal"), // low, normal, high
  notes: text("notes"),
});

// ============================================
// RELACIONES
// ============================================
export const collectionsRelations = relations(collections, ({ many }) => ({
  items: many(collectionItems),
  budgets: many(budgets),
}));

export const collectionItemsRelations = relations(collectionItems, ({ one, many }) => ({
  collection: one(collections, {
    fields: [collectionItems.collectionId],
    references: [collections.id],
  }),
  card: one(cards, {
    fields: [collectionItems.cardId],
    references: [cards.id],
  }),
  tags: many(itemTags),
}));

export const cardsRelations = relations(cards, ({ one, many }) => ({
  set: one(sets, {
    fields: [cards.setId],
    references: [sets.id],
  }),
  collectionItems: many(collectionItems),
  expenses: many(expenses),
}));

export const setsRelations = relations(sets, ({ many }) => ({
  cards: many(cards),
}));

export const budgetsRelations = relations(budgets, ({ one, many }) => ({
  collection: one(collections, {
    fields: [budgets.collectionId],
    references: [collections.id],
  }),
  expenses: many(expenses),
  parentGroups: many(budgetGroups, { relationName: "childBudget" }),
  childGroups: many(budgetGroups, { relationName: "parentBudget" }),
}));

export const budgetGroupsRelations = relations(budgetGroups, ({ one }) => ({
  parentBudget: one(budgets, {
    fields: [budgetGroups.parentBudgetId],
    references: [budgets.id],
    relationName: "parentBudget",
  }),
  childBudget: one(budgets, {
    fields: [budgetGroups.childBudgetId],
    references: [budgets.id],
    relationName: "childBudget",
  }),
}));

export const expensesRelations = relations(expenses, ({ one }) => ({
  budget: one(budgets, {
    fields: [expenses.budgetId],
    references: [budgets.id],
  }),
  card: one(cards, {
    fields: [expenses.cardId],
    references: [cards.id],
  }),
}));

export const tagsRelations = relations(tags, ({ many }) => ({
  items: many(itemTags),
}));

export const itemTagsRelations = relations(itemTags, ({ one }) => ({
  item: one(collectionItems, {
    fields: [itemTags.itemId],
    references: [collectionItems.id]
  }),
  tag: one(tags, {
    fields: [itemTags.tagId],
    references: [tags.id]
  }),
}));

export const wishlistItemsRelations = relations(wishlistItems, ({ one }) => ({
  card: one(cards, {
    fields: [wishlistItems.cardId],
    references: [cards.id]
  }),
}));
