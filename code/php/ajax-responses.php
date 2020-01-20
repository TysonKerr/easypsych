<?php

require dirname(dirname(__DIR__)) . '/code/php/init-ajax.php';

$user = validate_ajax_submission();

append_to_csv(
    get_user_responses_filename($user['username'], $user['exp'], $user['id']),
    json_decode(filter_input(INPUT_POST, 'responses'), true)
);
