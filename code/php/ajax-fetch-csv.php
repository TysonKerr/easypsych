<?php

define('APP_ROOT', dirname(dirname(__DIR__)));
require APP_ROOT . '/code/php/init-ajax.php';

if (!filter_has_var(INPUT_GET, 'f')) exit();

echo json_encode(read_csv(APP_ROOT . '/' . filter_input(INPUT_GET, 'f')));
