CREATE TABLE `provider_coverage_areas` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`provider_address` text NOT NULL,
	`location_lat` real NOT NULL,
	`location_lng` real NOT NULL,
	`radius` real NOT NULL,
	`updated_at` integer NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `provider_coverage_areas_provider_address_unique` ON `provider_coverage_areas` (`provider_address`);