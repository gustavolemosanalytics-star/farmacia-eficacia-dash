CREATE TABLE `usuarios`(
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `id_slack` BIGINT NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `avatar_url` VARCHAR(255) NOT NULL,
    `team_id_slack` BIGINT NOT NULL,
    `team_title_slack` VARCHAR(255) NOT NULL,
    `last_login` DATETIME NOT NULL,
    `created_at` TIMESTAMP NOT NULL,
    `updated_at` TIMESTAMP NOT NULL,
    `team_escavador` VARCHAR(255) NOT NULL
);
CREATE TABLE `acesso_dashboard_usuarios`(
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `usuario_id` BIGINT NOT NULL,
    `dashboard_id` BIGINT NOT NULL,
    `granted_by` VARCHAR(255) NOT NULL,
    `granted_at` VARCHAR(255) NOT NULL
);
CREATE TABLE `dashboards`(
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL,
    `description` VARCHAR(255) NOT NULL
);
CREATE TABLE `google_ads_pmax`(
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `customer_id` BIGINT NOT NULL,
    `customer_name` BIGINT NOT NULL,
    `campaign_id` BIGINT NOT NULL,
    `campaign_name` VARCHAR(255) NOT NULL,
    `new_column` BIGINT NOT NULL,
    `date` DATE NOT NULL,
    `impression` BIGINT NOT NULL,
    `clicks` BIGINT NOT NULL,
    `cost` DECIMAL(8, 2) NOT NULL,
    `conversions` DECIMAL(8, 2) NOT NULL,
    `convresion_value` DECIMAL(8, 2) NOT NULL,
    `ctr` FLOAT(53) NOT NULL,
    `cpc` DECIMAL(8, 2) NOT NULL,
    `origem` VARCHAR(255) NOT NULL,
    `row_id` VARCHAR(255) NOT NULL,
    `created_at` DATETIME NOT NULL,
    `updated_at` DATETIME NOT NULL
);
CREATE TABLE `google_ads_pesquisa`(
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `customer_id` BIGINT NOT NULL,
    `customer_name` VARCHAR(255) NOT NULL,
    `campaign_id` VARCHAR(255) NOT NULL,
    `campaign_name` VARCHAR(255) NOT NULL,
    `ad_group_id` VARCHAR(255) NOT NULL,
    `ad_group_name` VARCHAR(255) NOT NULL,
    `date` DATE NOT NULL,
    `impressions` BIGINT NOT NULL,
    `clicks` BIGINT NOT NULL,
    `cost` DECIMAL(8, 2) NOT NULL,
    `conversions` DECIMAL(8, 2) NOT NULL,
    `conversion_value` DECIMAL(8, 2) NOT NULL,
    `ctr` FLOAT(53) NOT NULL,
    `cpc` DECIMAL(8, 2) NOT NULL,
    `origem` VARCHAR(255) NOT NULL,
    `row_id` VARCHAR(255) NOT NULL,
    `created_at` DATETIME NOT NULL,
    `updated_at` DATETIME NOT NULL
);
CREATE TABLE `meta_ads`(
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `account_id` BIGINT NOT NULL,
    `account_name` VARCHAR(255) NOT NULL,
    `campaign_id` VARCHAR(255) NOT NULL,
    `campaign_name` VARCHAR(255) NOT NULL,
    `adset_id` VARCHAR(255) NOT NULL,
    `adset_name` VARCHAR(255) NOT NULL,
    `ad_id` VARCHAR(255) NOT NULL,
    `ad_name` VARCHAR(255) NOT NULL,
    `date` DATE NOT NULL,
    `age` VARCHAR(255) NOT NULL,
    `gender` VARCHAR(255) NOT NULL,
    `impressions` BIGINT NOT NULL,
    `clicks` BIGINT NOT NULL,
    `spend` DECIMAL(8, 2) NOT NULL,
    `reach` BIGINT NOT NULL,
    `conversions` BIGINT NOT NULL,
    `conversion_value` DECIMAL(8, 2) NOT NULL,
    `ctr` FLOAT(53) NOT NULL,
    `cpc` DECIMAL(8, 2) NOT NULL,
    `cpm` DECIMAL(8, 2) NOT NULL,
    `creative_id` VARCHAR(255) NOT NULL,
    `thumbnail_url` TEXT NOT NULL,
    `origem` VARCHAR(255) NOT NULL,
    `created_at` DATETIME NOT NULL,
    `updated_at` DATETIME NOT NULL
);
ALTER TABLE
    `acesso_dashboard_usuarios` ADD CONSTRAINT `acesso_dashboard_usuarios_usuario_id_foreign` FOREIGN KEY(`usuario_id`) REFERENCES `usuarios`(`id`);
ALTER TABLE
    `acesso_dashboard_usuarios` ADD CONSTRAINT `acesso_dashboard_usuarios_dashboard_id_foreign` FOREIGN KEY(`dashboard_id`) REFERENCES `dashboards`(`id`);