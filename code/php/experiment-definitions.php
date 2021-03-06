<?php

define('TRIAL_TYPES_DIR', APP_ROOT . '/trial-types');

function get_trial_type_names() {
    $names = [];
    
    foreach (scandir(TRIAL_TYPES_DIR) as $entry) {
        if ($entry === '.' or $entry === '..') continue;
        
        $trial_type_dir = TRIAL_TYPES_DIR . "/$entry";
        
        if (!is_dir($trial_type_dir)) continue;
        if (!is_file("$trial_type_dir/display.html")) continue;
        
        $names[] = $entry;
    }
    
    return $names;
}

function get_trial_types() {
    $trial_type_names = get_trial_type_names();
    $trial_types = [];
    
    $additional_files = [
        'script' => 'script.js',
        'style' => 'style.css'
    ];
    
    foreach ($trial_type_names as $name) {
        $dir = TRIAL_TYPES_DIR . "/$name";
        
        $trial_types[$name] = [
            'display' => file_get_contents("$dir/display.html")
        ];
        
        foreach ($additional_files as $content_name => $filename) {
            if (is_file("$dir/$filename")) {
                $trial_types[$name][$content_name] = file_get_contents("$dir/$filename");
            }
        }
    }
    
    return $trial_types;
}

function get_random_string($len = 8) {
    $chars = 'qwertyuiopasdfghjklzxcvbnm1234567890';
    $str = '';
    
    for ($i = 0; $i < $len; ++$i) {
        $str .= $chars[rand(0, 35)];
    }
    
    return $str;
}

function get_responses($username, $exp, $id_list) {
    $responses = [];
    
    foreach ($id_list as $id) {
        $filename = get_user_responses_filename($username, $exp, $id);
        
        if (is_file($filename)) {
            $responses = array_merge(read_csv($filename), $responses);
        }
    }
    
    return $responses;
}

function get_exp_data($username, $exp, $id) {
    $metadata = get_metadata($username, $exp, $id);
    $conditions = get_conditions($exp);
    $condition = $conditions[$metadata['Condition_Index']];
    
    if (!isset($condition['Stimuli'])) $condition['Stimuli'] = '';
    
    $stim = $condition['Stimuli'] === ''
          ? ['experiment/stimuli/' => []]
          : get_exp_files('experiment/stimuli/' . $condition['Stimuli']);
    
    return [
        'condition' => $condition,
        'procedure' => get_exp_files('experiment/procedures/' . $condition['Procedure']),
        'stimuli'   => $stim,
        'responses' => get_responses($username, $exp, $metadata['ID_list']),
        'shuffle_seed' => $metadata['Shuffle_Seed']
    ];
}

function get_exp_files($filename) {
    return get_csv_data($filename);
}

function get_trial_template() {
    return file_get_contents(APP_ROOT . '/code/html/trial-template.html');
}

function get_user_experiment_resources($username, $exp, $id) {
    return json_encode([
        'trial_template' => get_trial_template(),
        'data' => get_exp_data($username, $exp, $id),
        'trial_types' => get_trial_types(),
        'settings' => get_client_settings(),
        'user' => [
            'name' => $username,
            'id' => $id,
            'exp' => $exp
        ]
    ]);
}

function get_client_settings() {
    return parse_ini_file(APP_ROOT . '/Experiment/settings-client.ini.php', true, INI_SCANNER_TYPED);
}

function get_experiment_resources() {
    $exp = get_current_experiment();
    $login = login($exp);
    
    return get_user_experiment_resources($login['username'], $exp, $login['id']);
}

function login($exp) {
    $login = get_login_inputs();
    validate_login($login);
    
    $username        = $login['username'];
    $id              = $login['id'];
    $condition_index = $login['condition_index'];
    
    if (user_data_exists($username, $exp)) {
        login_returning_user($username, $exp, $id);
    } else {
        login_new_user($username, $exp, $id, $condition_index);
    }
    
    return $login;
}

function get_login_inputs() {
    return [
        'username'        => get_submitted_username(),
        'id'              => get_submitted_id(),
        'condition_index' => get_submitted_condition_index()
    ];
}

function get_submitted_condition_index() {
    return filter_has_var(INPUT_POST, 'c') ? filter_input(INPUT_POST, 'c') : null;
}

function validate_login($login) {
    $error = get_login_error($login);
    
    if ($error !== null) goto_login($error);
}

function goto_login($error_code = false) {
    header('Location: index.php' . ($error_code !== false ? "?m=$error_code" : ''));
    exit;
}

function user_data_exists($username, $exp) {
    return is_file(get_user_metadata_filename($username, $exp));
}

function login_new_user($username, $exp, $id, $condition_index = null) {
    $condition_index = get_and_validate_condition_index($condition_index, $exp);
    record_first_time_login($username, $exp, $id, $condition_index);
}

function get_and_validate_condition_index($submitted_index, $exp) {
    $conditions = get_conditions($exp);
    $condition_index = ($submitted_index === '-1' or $submitted_index === null)
                     ? rand(0, count($conditions) - 1)
                     : $submitted_index;
    
    if (!isset($conditions[$condition_index])) {
        goto_login(4);
    }
    
    return $condition_index;
}

function login_returning_user($username, $exp, $id) {
    $last_id = get_last_id($username, $exp);
    
    // if $last_id === $id, then they just refreshed the page
    if ($last_id !== $id) {
        record_returning_login($username, $exp, $id, $last_id);
    }
}

function get_last_id($username, $exp) {
    return array_key_last(get_metadata($username, $exp));
}

function record_first_time_login($username, $exp, $id, $condition_index) {
    record_metadata($username, $exp, $id, [
        'Condition_Index' => $condition_index,
        'Shuffle_Seed' => get_random_string(8)
    ]);
}

function record_returning_login($username, $exp, $id, $previous_id) {
    record_metadata($username, $exp, $id, ['Previous_ID' => $previous_id]);
}
