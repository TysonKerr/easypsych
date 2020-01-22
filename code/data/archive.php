<?php

require dirname(__DIR__) . '/php/init-ajax.php';
require __DIR__ . '/definitions.php';

if (!filter_has_var(INPUT_POST, 'r')) exit;
if (!filter_has_var(INPUT_POST, 'u')) exit;

$users = json_decode(filter_input(INPUT_POST, 'u'), true);
$archive = get_user_archive();

if (filter_input(INPUT_POST, 'r') === '0') {
    foreach ($users as $user) {
        $archive[$user] = $user;
    }
} else {
    foreach ($users as $user) {
        unset($archive[$user]);
    }
}

set_user_archive($archive);
