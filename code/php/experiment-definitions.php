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

function get_responses($username, $id_list) {
    $responses = [];
    
    foreach ($id_list as $id) {
        $filename = APP_ROOT . "/data/user-$username-data/$id-responses.csv";
        
        if (is_file($filename)) {
            $responses = array_merge(read_csv($filename), $responses);
        }
    }
    
    return $responses;
}

function get_exp_data($username, $id) {
    $metadata = get_metadata($username, $id);
    $conditions = get_conditions();
    $condition = $conditions[$metadata['Condition_Index']];
    
    if (!isset($condition['Stimuli'])) $condition['Stimuli'] = '';
    
    $stim = $condition['Stimuli'] === ''
          ? ['experiment/stimuli/' => []]
          : get_exp_files('experiment/stimuli/' . $condition['Stimuli']);
    
    return [
        'condition' => $condition,
        'procedure' => get_exp_files('experiment/procedures/' . $condition['Procedure']),
        'stimuli'   => $stim,
        'responses' => get_responses($username, $metadata['ID_list']),
        'shuffle_seed' => $metadata['Shuffle_Seed']
    ];
}

function get_exp_files($filename) {
    return get_csv_data($filename);
}

function get_trial_template() {
    return file_get_contents(APP_ROOT . '/code/html/trial-template.html');
}

function get_user_experiment_resources($username, $id) {
    return json_encode([
        'trial_template' => get_trial_template(),
        'exp_data' => get_exp_data($username, $id),
        'trial_types' => get_trial_types(),
        'settings' => get_client_settings()
    ]);
}

function get_client_settings() {
    return parse_ini_file(APP_ROOT . '/Experiment/settings-client.ini.php', true, INI_SCANNER_TYPED);
}

function get_experiment_resources() {
	$login = login();
	
	return get_user_experiment_resources($login['username'], $login['id']);
}

function login() {
	$login = get_login_inputs();
	validate_login($login);
	extract($login);
    
    if (user_data_exists($username)) {
        login_returning_user($username, $id);
    } else {
        login_new_user($username, $id, $condition_index);
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

function get_submitted_username() {
	if (!filter_has_var(INPUT_POST, 'u')) return null;
	
	return get_filtered_username(filter_input(INPUT_POST, 'u'));
}

function get_submitted_id() {
	if (!filter_has_var(INPUT_POST, 'i')) return null;
	
	return get_filtered_id(filter_input(INPUT_POST, 'i'));
}

function get_submitted_condition_index() {
	return filter_has_var(INPUT_POST, 'c') ? filter_input(INPUT_POST, 'c') : null;
}

function get_filtered_username($username_raw) {
    $username = filter_var($username_raw, FILTER_DEFAULT, FILTER_FLAG_STRIP_LOW | FILTER_FLAG_STRIP_HIGH);
    $username = str_replace(str_split('<>:"/\\|?*' . chr(127)), '', $username);
    $username = strtolower(trim($username));
    return $username;
}

function get_filtered_id($id_raw) {
	return preg_replace('/[^a-z0-9]/', '', $id_raw);
}

function validate_login($login) {
	if ($login['username'] === null)    goto_login(0);
	if (strlen($login['username']) < 1) goto_login(1);
	if ($login['id'] === null)          goto_login(2);
	if (strlen($login['id']) !== 10)    goto_login(3);
}

function goto_login($error_code = false) {
	header('Location: index.php' . ($error_code === false ? "?m=$error_code" : ''));
	exit;
}

function user_data_exists($username) {
    return is_file(get_user_metadata_file($username));
}

function login_new_user($username, $id, $condition_index = null) {
    $condition_index = get_and_validate_condition_index($condition_index);
    record_first_time_login($username, $id, $condition_index);
}

function get_and_validate_condition_index($submitted_index) {
    $conditions = get_conditions();
    
    if ($submitted_index === '-1' or $submitted_index === null) {
        $condition_index = rand(0, count($conditions) - 1);
    }
    
    if (!isset($conditions[$condition_index])) {
        goto_login(4);
    }
	
	return $condition_index;
}

function login_returning_user($username, $id) {
    $last_id = get_last_id($username);
	
	// if $last_id === $id, then they just refreshed the page
	if ($last_id !== $id) {
		record_returning_login($username, $id, $last_id);
	}
}

function get_last_id($username) {
    return array_key_last(get_metadata($username));
}

function record_first_time_login($username, $id, $condition_index) {
    record_metadata($username, $id, [
        'Condition_Index' => $condition_index,
        'Shuffle_Seed' => get_random_string(8)
    ]);
}

function record_returning_login($username, $id, $previous_id) {
    record_metadata($username, $id, ['Previous_ID' => $previous_id]);
}
