CREATE TABLE `bids` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`bid_id` integer NOT NULL,
	`request_id` integer NOT NULL,
	`provider_address` text NOT NULL,
	`amount` text NOT NULL,
	`timeline` integer NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `ratings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`provider_address` text NOT NULL,
	`consumer_address` text NOT NULL,
	`request_id` integer NOT NULL,
	`rating` integer NOT NULL,
	`comment` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `requests` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`request_id` integer NOT NULL,
	`consumer_address` text NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`location_lat` real NOT NULL,
	`location_lng` real NOT NULL,
	`budget` text NOT NULL,
	`deadline` integer NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`accepted_bid_id` integer,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`wallet_address` text NOT NULL,
	`user_type` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_wallet_address_unique` ON `users` (`wallet_address`);