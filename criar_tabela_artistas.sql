-- ====================================================================
-- CRIAÇÃO DA TABELA DE ARTISTAS COM SUPORTE A FOTOS DO GOOGLE DRIVE
-- E CONTROLE DE ATUALIZAÇÃO (foto_atualizada)
-- ====================================================================

CREATE TABLE IF NOT EXISTS `artistas` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `nome` VARCHAR(255) NOT NULL,
  `genero` VARCHAR(100) DEFAULT NULL,
  `drive_file_id` VARCHAR(255) DEFAULT NULL COMMENT 'ID do arquivo de imagem no Google Drive',
  `drive_url` VARCHAR(500) DEFAULT NULL COMMENT 'Link de visualização no Google Drive',
  `foto_perfil_url` VARCHAR(500) DEFAULT NULL COMMENT 'URL direta da imagem ou thumbnail do Google Drive',
  `foto_atualizada` TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Controle: 1 se a foto já foi atualizada via Google Drive, 0 se pendente',
  `foto_atualizada_em` TIMESTAMP NULL DEFAULT NULL COMMENT 'Data e hora da última atualização da foto',
  `bio` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `artistas_nome_unique` (`nome`),
  KEY `artistas_genero_index` (`genero`),
  KEY `artistas_foto_atualizada_index` (`foto_atualizada`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================================================
-- POVOAMENTO INICIAL AUTOMÁTICO A PARTIR DAS MÚSICAS JÁ CADASTRADAS
-- (Cadastra todos os artistas com foto_atualizada = 0 para controle)
-- ====================================================================

INSERT IGNORE INTO `artistas` (`nome`, `genero`, `foto_atualizada`, `created_at`, `updated_at`)
SELECT 
    TRIM(m.artista) AS nome,
    SUBSTRING_INDEX(GROUP_CONCAT(DISTINCT m.genero ORDER BY m.id DESC SEPARATOR ','), ',', 1) AS genero,
    0 AS foto_atualizada,
    NOW(),
    NOW()
FROM `musicas` m
WHERE m.artista IS NOT NULL 
  AND TRIM(m.artista) != '' 
  AND TRIM(m.artista) != 'Desconhecido'
GROUP BY TRIM(m.artista);

-- ====================================================================
-- CONSULTA DE CONTROLE / MONITORAMENTO
-- ====================================================================
-- Total de artistas cadastrados, com foto atualizada e pendentes:
-- SELECT 
--     COUNT(*) AS total_artistas,
--     SUM(CASE WHEN foto_atualizada = 1 THEN 1 ELSE 0 END) AS fotos_atualizadas,
--     SUM(CASE WHEN foto_atualizada = 0 THEN 1 ELSE 0 END) AS fotos_pendentes
-- FROM artistas;
