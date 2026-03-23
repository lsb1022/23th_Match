ALTER TABLE `members` ADD `approvalStatus` enum('pending','approved','rejected') NOT NULL DEFAULT 'approved';
