CREATE TABLE `budget_groups` (
	`id` text PRIMARY KEY NOT NULL,
	`parent_budget_id` text NOT NULL,
	`child_budget_id` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `budgets` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text DEFAULT 'guest' NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`collection_id` text,
	`amount` real NOT NULL,
	`currency` text DEFAULT 'EUR' NOT NULL,
	`period` text DEFAULT 'monthly' NOT NULL,
	`start_date` text,
	`is_active` integer DEFAULT true,
	`created_at` integer,
	`updated_at` integer
);
--> statement-breakpoint
CREATE TABLE `expenses` (
	`id` text PRIMARY KEY NOT NULL,
	`budget_id` text NOT NULL,
	`date` text NOT NULL,
	`description` text NOT NULL,
	`category` text DEFAULT 'other' NOT NULL,
	`amount` real NOT NULL,
	`currency` text DEFAULT 'EUR' NOT NULL,
	`pack_count` integer,
	`seller` text,
	`platform` text,
	`notes` text,
	`card_id` text,
	`created_at` integer
);
--> statement-breakpoint
CREATE TABLE `item_tags` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`item_id` text NOT NULL,
	`tag_id` integer NOT NULL,
	FOREIGN KEY (`item_id`) REFERENCES `collection_items`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `tags` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`color` text DEFAULT 'slate'
);
--> statement-breakpoint
CREATE TABLE `wishlist_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`card_id` text NOT NULL,
	`user_id` text DEFAULT 'guest',
	`added_at` integer,
	`priority` text DEFAULT 'normal',
	`notes` text,
	FOREIGN KEY (`card_id`) REFERENCES `cards`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
ALTER TABLE `cards` ADD `attacks` text;--> statement-breakpoint
ALTER TABLE `cards` ADD `abilities` text;--> statement-breakpoint
ALTER TABLE `cards` ADD `weaknesses` text;--> statement-breakpoint
ALTER TABLE `cards` ADD `retreat_cost` text;--> statement-breakpoint
ALTER TABLE `collection_items` ADD `notes` text;--> statement-breakpoint
ALTER TABLE `collections` ADD `description` text;--> statement-breakpoint
ALTER TABLE `collections` ADD `show_prices` integer DEFAULT true;--> statement-breakpoint
ALTER TABLE `collections` ADD `sort_by` text DEFAULT 'number';--> statement-breakpoint
ALTER TABLE `collections` ADD `notes` text;