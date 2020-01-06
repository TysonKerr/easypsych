<?php

require dirname(dirname(__DIR__)) . '/code/php/init-ajax.php';

$user_info = validate_ajax_submission();

append_to_csv(
    get_user_responses_filename($user_info['username'], $user_info['id']),
    json_decode(filter_input(INPUT_POST, 'responses'), true)
);
