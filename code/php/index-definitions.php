<?php

function get_condition_choice_html($exp) {
    if (get_setting('allow_condition_selection')) {
        return '<tr> <td>Condition:</td> <td>' . get_condition_select_html($exp) . '</td> </tr>';
    } else {
        return '';
    }
}

function get_condition_select_html($exp) {
    $html = '<select name="c"><option value="-1" selected>Random Assignment</option>';
    $conditions = get_conditions($exp);
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

function validate_experiment($exp) {
    $conditions = get_conditions($exp);
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

function get_error_message() {
    return filter_has_var(INPUT_GET, 'm') 
         ? get_message_for_error_code(filter_input(INPUT_GET, 'm'))
         : '';
}

function get_exp_input($exp) {
    $exp_name = htmlspecialchars($exp, ENT_QUOTES);
    return "<input type='hidden' style='display: none' name='e' value='$exp_name'>";
}
