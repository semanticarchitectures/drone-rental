CREATE TABLE `consumer_areas_of_interest` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`consumer_address` text NOT NULL,
	`location_lat` real NOT NULL,
	`location_lng` real NOT NULL,
	`radius` real NOT NULL,
	`updated_at` integer NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `consumer_areas_of_interest_consumer_address_unique` ON `consumer_areas_of_interest` (`consumer_address`);