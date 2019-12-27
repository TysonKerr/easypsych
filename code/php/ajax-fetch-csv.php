<?php

require dirname(dirname(__DIR__)) . '/code/php/init-ajax.php';

if (!filter_has_var(INPUT_GET, 'f')) exit();

validate_csv_filename(filter_input(INPUT_GET, 'f'));

echo json_encode(get_csv_data(filter_input(INPUT_GET, 'f')));
