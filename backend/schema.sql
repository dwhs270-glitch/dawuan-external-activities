CREATE TABLE `attendees` (
	`id` text PRIMARY KEY NOT NULL,
	`event_id` text NOT NULL,
	`name` text NOT NULL,
	`diet` text NOT NULL,
	`note` text NOT NULL,
	FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON UPDATE no action ON DELETE no action
);

CREATE UNIQUE INDEX `idx_attendees_event_name` ON `attendees` (`event_id`,`name`);
CREATE TABLE `events` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`organizer` text NOT NULL,
	`date` text NOT NULL,
	`time` text NOT NULL,
	`venue` text NOT NULL,
	`capacity` integer NOT NULL,
	`note` text NOT NULL,
	`closed` integer DEFAULT 0 NOT NULL
);

CREATE TABLE `imports` (
	`id` text PRIMARY KEY NOT NULL
);

ALTER TABLE `events` ADD `type` text DEFAULT '餐會' NOT NULL;
ALTER TABLE `events` ADD `other_type` text DEFAULT '' NOT NULL;
ALTER TABLE `events` ADD `deadline` text;