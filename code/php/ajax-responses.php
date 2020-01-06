<?php

require dirname(dirname(__DIR__)) . '/code/php/init-ajax.php';

$username = get_submitted_username();
$id       = get_submitted_id();

$error = get_login_error([
    'username' => $username,
    'id'       => $id
]);

if ($error !== null) {
    exit("error code: $error");
}

if (!filter_has_var(INPUT_POST, 'responses')) exit('missing responses');

append_to_csv(
    APP_ROOT . "/data/user-$username-data/$id-responses.csv",
    json_decode(filter_input(INPUT_POST, 'responses'), true)
);
