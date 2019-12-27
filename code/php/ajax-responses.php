<?php

require dirname(dirname(__DIR__)) . '/code/php/init-ajax.php';

if (!filter_has_var(INPUT_POST, 'responses')) exit();

$username = $_SESSION['username'];
$id       = $_SESSION['id'];

append_to_csv(
    APP_ROOT . "/data/$username/$id-responses.csv",
    json_decode(filter_input(INPUT_POST, 'responses'), true)
);
