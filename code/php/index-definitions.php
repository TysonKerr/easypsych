<?php

function get_condition_choice_html() {
    if (get_setting('allow_condition_selection')) {
        return '<tr> <td>Condition:</td> <td>' . get_condition_select_html() . '</td> </tr>';
    } else {
        return '';
    }
}

function get_condition_select_html() {
    $html = '<select name="c"><option value="-1" selected>Random Assignment</option>';
    $conditions = get_conditions();
    $use_condition_names = get_setting('use_condition_names');
    
    foreach ($conditions as $i => $condition) {
        $name = ($use_condition_names
                and isset($condition['Name'])
                and $condition['Name'] !== '')
              ? $condition['Name']
              : $i;
        $html .= "<option value='$i'>$name</option>";
    }
    
    $html .= '</select>';
    
    return $html;
}

function process_login_submission() {
    if (filter_has_var(INPUT_POST, 'u')) {
        $username = get_filtered_username(filter_input(INPUT_POST, 'u'));
        
        if (strlen($username) < 1) return "Invalid username.";
        
        if (user_data_exists($username)) {
            return login_returning_user($username);
        } else {
            $condition_index = filter_has_var(INPUT_POST, 'c') ? filter_input(INPUT_POST, 'c') : '-1';
            return login_new_user($username, $condition_index);
        }
    }
    
    return false;
}

function get_filtered_username($username_raw) {
    $username = filter_var($username_raw, FILTER_DEFAULT, FILTER_FLAG_STRIP_LOW | FILTER_FLAG_STRIP_HIGH);
    $username = str_replace(str_split('<>:"/\\|?*' . chr(127)), '', $username);
    $username = strtolower(trim($username));
    return $username;
}

function login_returning_user($username) {
    $id = start_new_session($username);
    $last_id = get_last_id($username);
    record_returning_login($username, $id, $last_id);
    go_to_experiment();
}

function get_last_id($username) {
    return array_key_last(get_metadata($username));
}

function login_new_user($username, $condition_index = '-1') {
    $conditions = get_conditions();
    
    if ($condition_index === '-1') {
        $condition_index = rand(0, count($conditions) - 1);
    }
    
    if (!isset($conditions[$condition_index])) {
        return "Error: Cannot find condition with index: $condition_index";
    }
    
    $id = start_new_session($username);
    
    record_first_time_login($username, $id, $condition_index);
    go_to_experiment();
}

function start_new_session($username) {
    start_session();
    
    $_SESSION = [
        'username' => $username,
        'id' => get_new_id()
    ];
    
    return $_SESSION['id'];
}

function go_to_experiment() {
    header('Location: experiment.php');
    exit;
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

function validate_experiment() {
    $conditions = get_conditions();
    validate_conditions($conditions);
    validate_files_in_conditions($conditions);
}

function validate_conditions($conditions) {
    if (count($conditions) < 1) trigger_error("No conditions exist inside conditions file", E_USER_ERROR);
    
    if (!isset($conditions[0]['Procedure'])) trigger_error("Conditions file is missing a 'Procedure' column", E_USER_ERROR);
    
    $errors = [];
    
    foreach($conditions as $i => $condition) {
        $errors = array_merge($errors, validate_condition($condition, $i + 2));
    }
    
    if (count($errors) !== 0) trigger_error("\n" . implode("\n", $errors) . "\n", E_USER_ERROR);
}

function validate_condition($condition, $c_row) {
    $errors = validate_exp_file_name($condition['Procedure'], '/experiment/procedures/', 'procedure', $c_row);
    
    if (isset($condition['Stimuli']) and $condition['Stimuli'] !== '') {
        $errors = array_merge($errors, validate_exp_file_name($condition['Stimuli'], '/experiment/stimuli/', 'stimuli', $c_row));
    }
    
    return $errors;
}

function validate_exp_file_name($filename, $dir, $type, $condition_row) {
    $errors = [];
    
    if (!is_file(APP_ROOT . $dir . $filename)) {
        $errors[] = "In condition row $condition_row, the listed $type file \"$filename\" doesn't exist.";
    }
    
    if (!is_valid_csv_filename($filename)) {
        $errors[] = "In condition row $condition_row, the listed $type file \"$filename\" does not have the \".csv\" extension.";
    }
    
    return $errors;
}

function validate_files_in_conditions($conditions) {
    $errors = [];
    
    foreach ($conditions as $i => $condition) {
        $error = validate_exp_file($condition['Procedure'], 'procedure');
        
        if ($error) $errors[] = $error;
    }
    
    if (count($errors) > 0) trigger_error("\n" . implode("\n", $errors) . "\n", E_USER_ERROR);
}

function validate_exp_file($filename, $type) {
    $dir = 'experiment/' . (($type === 'stimuli') ? 'stimuli/' : 'procedures/');
    
    try {
        $data = get_csv_data($dir . $filename);
    } catch (Exception $e) {
        return $e->getMessage();
    }
    
    return false;
}
