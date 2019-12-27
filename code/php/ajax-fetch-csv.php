<?php

define('APP_ROOT', dirname(dirname(__DIR__)));
require APP_ROOT . '/code/php/init-ajax.php';

if (!filter_has_var(INPUT_GET, 'f')) exit();

echo json_encode(get_csv_data(filter_input(INPUT_GET, 'f')));
