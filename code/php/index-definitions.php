<?php

function get_condition_choice_html() {
    if (get_setting('allow_condition_selection')) {
        return '<tr> <td>condition:</td> <td>' . get_condition_select_html() . '</td> </tr>';
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
        $username = filter_input(INPUT_POST, 'u');
        
        if (user_data_exists($username)) {
            return login_returning_user($username);
        } else {
            $condition_index = filter_has_var(INPUT_POST, 'c') ? filter_input(INPUT_POST, 'c') : '-1';
            return login_new_user($username, $condition_index);
        }
    }
    
    return false;
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
