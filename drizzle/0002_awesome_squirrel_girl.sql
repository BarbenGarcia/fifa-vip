CREATE TABLE `matchesCache` (
	`id` int AUTO_INCREMENT NOT NULL,
	`matchId` varchar(100) NOT NULL,
	`homeTeam` varchar(255) NOT NULL,
	`awayTeam` varchar(255) NOT NULL,
	`homeScore` int,
	`awayScore` int,
	`league` varchar(255) NOT NULL,
	`leagueCountry` varchar(100),
	`matchDate` timestamp NOT NULL,
	`status` varchar(50) NOT NULL,
	`homeTeamLogo` varchar(512),
	`awayTeamLogo` varchar(512),
	`fetchedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `matchesCache_id` PRIMARY KEY(`id`),
	CONSTRAINT `matchesCache_matchId_unique` UNIQUE(`matchId`)
);
