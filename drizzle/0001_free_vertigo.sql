CREATE TABLE `cards` (
	`id` text PRIMARY KEY NOT NULL,
	`set_id` text NOT NULL,
	`name` text NOT NULL,
	`supertype` text NOT NULL,
	`subtypes` text,
	`hp` text,
	`types` text,
	`evolves_from` text,
	`number` text NOT NULL,
	`artist` text,
	`rarity` text,
	`images` text,
	`tcgplayer_prices` text,
	`cardmarket_prices` text,
	`is_partial` integer DEFAULT false,
	`synced_at` integer,
	FOREIGN KEY (`set_id`) REFERENCES `sets`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `collection_items` (
	`id` text PRIMARY KEY NOT NULL,
	`collection_id` text NOT NULL,
	`card_id` text NOT NULL,
	`variant` text DEFAULT 'normal' NOT NULL,
	`quantity` integer DEFAULT 1,
	`added_at` integer,
	FOREIGN KEY (`collection_id`) REFERENCES `collections`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`card_id`) REFERENCES `cards`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `collections` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`filters` text,
	`language` text,
	`created_at` integer,
	`updated_at` integer
);
--> statement-breakpoint
CREATE TABLE `pokemon_species` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`updated_at` integer
);
--> statement-breakpoint
CREATE TABLE `price_history` (
	`id` text PRIMARY KEY NOT NULL,
	`card_id` text NOT NULL,
	`date` text NOT NULL,
	`market_price` real NOT NULL,
	`source` text DEFAULT 'tcgplayer' NOT NULL,
	`created_at` integer,
	FOREIGN KEY (`card_id`) REFERENCES `cards`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `sets` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`series` text NOT NULL,
	`printed_total` integer NOT NULL,
	`total` integer NOT NULL,
	`release_date` text,
	`images` text,
	`synced_at` integer
);
--> statement-breakpoint
CREATE TABLE `sync_jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`target_id` text,
	`target_name` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`priority` integer DEFAULT 0,
	`progress` integer DEFAULT 0,
	`total_items` integer DEFAULT 0,
	`processed_items` integer DEFAULT 0,
	`error_message` text,
	`created_at` integer,
	`started_at` integer,
	`completed_at` integer
);
--> statement-breakpoint
CREATE TABLE `user_profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text DEFAULT 'guest' NOT NULL,
	`display_name` text,
	`avatar_url` text,
	`app_language` text DEFAULT 'es' NOT NULL,
	`card_language` text DEFAULT 'en' NOT NULL,
	`cardmarket_username` text,
	`tcgplayer_username` text,
	`ebay_username` text,
	`preferred_currency` text DEFAULT 'EUR',
	`created_at` integer,
	`updated_at` integer
);
