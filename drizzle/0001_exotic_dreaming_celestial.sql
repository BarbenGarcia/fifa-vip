CREATE TABLE `newsCache` (
	`id` int AUTO_INCREMENT NOT NULL,
	`category` varchar(50) NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`url` varchar(512) NOT NULL,
	`imageUrl` varchar(512),
	`source` varchar(255),
	`publishedAt` timestamp,
	`fetchedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `newsCache_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `weatherCache` (
	`id` int AUTO_INCREMENT NOT NULL,
	`location` varchar(100) NOT NULL,
	`temperature` varchar(50),
	`weatherCode` int,
	`windSpeed` varchar(50),
	`humidity` varchar(50),
	`description` varchar(255),
	`fetchedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `weatherCache_id` PRIMARY KEY(`id`)
);
