CREATE TABLE `provider_profiles` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`provider_address` text NOT NULL,
	`drone_image_url` text,
	`drone_model` text,
	`specialization` text,
	`offers_ground_imaging` integer DEFAULT false,
	`ground_imaging_types` text,
	`bio` text,
	`updated_at` integer NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `provider_profiles_provider_address_unique` ON `provider_profiles` (`provider_address`);