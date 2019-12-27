<?php

error_reporting(E_ALL);
ini_set('auto_detect_line_endings', true);
ini_set('zlib.output_compression', -1);
ini_set('open_basedir', dirname(dirname(__DIR__)));
ob_start();
require dirname(dirname(__DIR__)) . '/code/php/general-definitions.php';
