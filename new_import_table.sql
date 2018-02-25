CREATE TABLE `new_import` (
  `medium_image_url` char(250) COLLATE utf8_danish_ci DEFAULT NULL,
  `id` char(150) COLLATE utf8_danish_ci DEFAULT NULL,
  `artist_auth` text COLLATE utf8_danish_ci,
  `artist_name` text COLLATE utf8_danish_ci,
  `artist_name_text` text COLLATE utf8_danish_ci,
  `artist_natio_dk` char(250) COLLATE utf8_danish_ci DEFAULT NULL,
  `category` char(250) COLLATE utf8_danish_ci DEFAULT NULL,
  `comments` text COLLATE utf8_danish_ci,
  `content_notes` text COLLATE utf8_danish_ci,
  `description_note_dk` text COLLATE utf8_danish_ci,
  `materiale_type` text COLLATE utf8_danish_ci,
  `materiale_type_eng` text COLLATE utf8_danish_ci,
  `multi_work_ref` text COLLATE utf8_danish_ci,
  `note_elementer` text COLLATE utf8_danish_ci,
  `proveniens` text COLLATE utf8_danish_ci,
  `related_id` text COLLATE utf8_danish_ci,
  `title_all` text COLLATE utf8_danish_ci,
  `title_dk` text COLLATE utf8_danish_ci,
  `title_eng` text COLLATE utf8_danish_ci,
  `auto_id` int(11) NOT NULL AUTO_INCREMENT,
  PRIMARY KEY (`auto_id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8 COLLATE=utf8_danish_ci;
