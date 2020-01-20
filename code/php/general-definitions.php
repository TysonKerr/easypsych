<?php

define('APP_ROOT', dirname(dirname(__DIR__)));

function get_setting($setting_name) {
    $settings = get_all_settings();
    return $settings[$setting_name];
}

function get_all_settings() {
    static $settings = null;
    
    if ($settings === null) {
        $settings = parse_ini_file(APP_ROOT . '/Experiment/settings-server.ini.php', true, INI_SCANNER_TYPED);
    }
    
    return $settings;
}

function get_experiment_title() {
    return htmlspecialchars(get_setting('page_title'));
}

function get_conditions($exp) {
    static $conditions = [];
    
    if (!isset($conditions[$exp])) {
        $conditions[$exp] = read_csv(get_conditions_filename($exp));
    }
    
    return $conditions[$exp];
}

function get_conditions_filename($exp) {
    return APP_ROOT . "/experiment/conditions/$exp.csv";
}

function get_current_experiment() {
    if (filter_has_var(INPUT_POST, 'e')) {
        $input = INPUT_POST;
    } elseif (filter_has_var(INPUT_GET, 'e')) {
        $input = INPUT_GET;
    }
    
    $exp = isset($input)
         ? get_filtered_experiment_name(filter_input($input, 'e'))
         : get_setting('current_experiment');
    
    if (substr($exp, 0, 5) === 'user-'
        or !is_file(get_conditions_filename($exp))
    ) {
        throw new Exception("invalid experiment requested: $exp");
    }
    
    return $exp;
}

function get_user_metadata_filename($username, $exp) {
    return APP_ROOT . "/data/$exp/user-$username-data/metadata.csv";
}

function get_user_responses_filename($username, $exp, $id) {
    return APP_ROOT . "/data/$exp/user-$username-data/$id-responses.csv";
}

function record_metadata($username, $exp, $id, $metadata) {
    $filename = get_user_metadata_filename($username, $exp);
    $dir = dirname($filename);
    
    if (!is_dir($dir)) mkdir($dir, 0755, true);
    
    $handle = fopen($filename, 'a');
    
    foreach ($metadata as $key => $val) {
        fputcsv($handle, [$id, $key, $val]);
    }
    
    fclose($handle);
}

function get_metadata($username, $exp, $id = false) {
    $filename = get_user_metadata_filename($username, $exp);
    
    if (!is_file($filename)) return [];
    
    $metadata = [];
    $handle = fopen($filename, 'r');
    
    while ($line = fgetcsv($handle)) {
        $row_id = $line[0];
        
        if (!isset($metadata[$row_id])) $metadata[$row_id] = [];
        
        $metadata[$row_id][$line[1]] = $line[2];
    }
    
    return $id ? get_metadata_for_id($metadata, $id) : $metadata;
}

function get_metadata_for_id($metadata, $id) {
    $id_data = $metadata[$id];
    $id_data['ID_list'] = [$id];
    
    while (isset($metadata[$id]['Previous_ID'])) {
        $id = $metadata[$id]['Previous_ID'];
        $id_data['ID_list'][] = $id;
        
        foreach ($metadata[$id] as $key => $val) {
            if (!isset($id_data[$key])) $id_data[$key] = $val;
        }
    }
    
    return $id_data;
}

function get_submitted_username() {
    if (!filter_has_var(INPUT_POST, 'u')) return null;
    
    return get_filtered_username(filter_input(INPUT_POST, 'u'));
}

function get_filtered_username($username_raw) {
    $username = get_str_without_bad_dir_characters($username_raw);
    $username = strtolower(trim($username));
    return $username;
}

function get_submitted_id() {
    if (!filter_has_var(INPUT_POST, 'i')) return null;
    
    return get_filtered_id(filter_input(INPUT_POST, 'i'));
}

function get_filtered_id($id_raw) {
    return preg_replace('/[^a-z0-9]/', '', $id_raw);
}

function get_filtered_experiment_name($exp_raw) {
    return str_replace('..', '', $exp_raw);
}

function get_str_without_bad_dir_characters($str) {
    $str = filter_var($str, FILTER_DEFAULT, FILTER_FLAG_STRIP_LOW | FILTER_FLAG_STRIP_HIGH);
    $str = str_replace(str_split('<>:"/\\|?*' . chr(127)), '', $str);
    return $str;
}

function get_login_error($login) {
    if ($login['username'] === null)    return 0;
    if (strlen($login['username']) < 1) return 1;
    if ($login['id'] === null)          return 2;
    if (strlen($login['id']) !== 10)    return 3;
    
    return null;
}

function get_message_for_error_code($code) {
    switch($code) {
        case 0: return 'Missing username, please login below:';
        case 1: return 'Invalid username, please login below:';
        case 2: return 'Missing session id, please login below:';
        case 3: return 'Invalid session id, please login below:';
        case 4: return 'Selected condition index not available';
    }
}

function validate_ajax_submission() {
    $user_info = [
        'username' => get_submitted_username(),
        'id'       => get_submitted_id(),
        'exp'      => get_current_experiment()
    ];

    $error = get_login_error($user_info);

    if ($error !== null) {
        exit("error code: $error");
    }

    if (!filter_has_var(INPUT_POST, 'responses')) exit('missing responses');
    
    return $user_info;
}

function get_smart_cached_link($link) {
    return "$link?v=" . filemtime($link);
}

function is_valid_csv_filename($filename) {
    $last_4 = strtolower(substr($filename, -4));
    
    return ($last_4 === '.csv') ? true : false;
}

function validate_csv_filename($filename) {
    if (!is_valid_csv_filename($filename)) {
        throw new Exception("Filename missing '.csv' extension: $filename");
    }
}

function fopen_errorful($filename, $mode) {
    if (!is_file($filename) and $mode[0] === 'r') {
        throw new Exception("Cannot read file, does not exist: $filename");
    }
    
    if (is_file($filename) and $mode[0] === 'w') {
        throw new Exception("Cannot write file, already exists: $filename");
    }
    
    $handle = @fopen($filename, $mode);
    
    if (!$handle) throw new Exception("Failed to open file, it is likely being used by another program like Excel: $filename");
    
    return $handle;
}

function read_csv($filename) {
    validate_csv_filename($filename);
    $handle = fopen_errorful($filename, 'r');
    
    $headers = fgetcsv($handle);
    
    foreach ($headers as $i => $header) {
        $headers[$i] = trim($header);
    }
    
    $data = [];
    
    while ($line = fgetcsv($handle)) {
        if ($line[0] === null) continue; // occurs if line is empty
        
        $row = [];
        $has_content = false;
        
        foreach ($headers as $i => $header) {
            $cell = isset($line[$i]) ? trim($line[$i]) : '';
            
            if ($cell !== '') $has_content = true;
            
            $row[$header] = $cell;
        }
        
        if ($has_content) $data[] = $row;
    }
    
    fclose($handle);
    return $data;
}

function write_csv($filename, $data) {
    validate_csv_filename($filename);
    $headers = [];
    
    foreach ($data as $row) {
        foreach ($row as $header => $val) {
            $headers[$header] = true;
        }
    }
    
    $headers = array_keys($headers);
    
    $handle = fopen_errorful($filename, 'w');
    
    fputcsv($handle, $headers);
    
    foreach ($data as $row) {
        $sorted = [];
        
        foreach ($headers as $header) {
            $sorted[$header] = isset($row[$header]) ? $row[$header] : '';
        }
        
        fputcsv($handle, $sorted);
    }
    
    fclose($handle);
}

function append_to_csv($filename, $data) {
    if (!is_file($filename)) return write_csv($filename, $data);
    
    validate_csv_filename($filename);
    $handle = fopen_errorful($filename, 'r+');
    
    $old_headers = fgetcsv($handle);
    $old_headers_flipped = array_flip($old_headers);
    $headers = [];
    
    foreach ($data as $row) {
        foreach ($row as $header => $val) {
            $headers[$header] = true;
        }
    }
    
    $new_headers = [];
    
    foreach ($headers as $header => $_) {
        if (!isset($old_headers_flipped[$header])) {
            $new_headers[] = $header;
        }
    }
    
    if (count($new_headers) === 0) {
        fseek($handle, 0, SEEK_END);
        $all_headers = $old_headers;
    } else {
        $all_headers = array_merge($old_headers, $new_headers);
        $file_previous_contents = stream_get_contents($handle);
        fseek($handle, 0);
        fputcsv($handle, $all_headers);
        fwrite($handle, $file_previous_contents);
    }
        
    foreach ($data as $row) {
        $sorted = [];
        
        foreach ($all_headers as $header) {
            $sorted[$header] = isset($row[$header]) ? $row[$header] : '';
        }
        
        fputcsv($handle, $sorted);
    }
    
    fclose($handle);
}

if (!function_exists('array_key_last')) {
    // polyfill for array_key_last() added in PHP 7.3
    function array_key_last($arr) {
        return key(array_slice($arr, -1, 1, true));
    }
}

function get_csv_data($filename) {
    $data = [$filename => read_csv(APP_ROOT . '/' . $filename)];
    $dir = substr($filename, 0, strrpos($filename, '/'));
    
    if (strlen($dir) > 0) $dir .= '/';
    
    foreach ($data[$filename] as $i => $row) {
        if (!isset($row['Subfile'])) break;
        if ($row['Subfile'] === '') continue;
        
        $nested_file = $dir . $row['Subfile'];
        
        if (!isset($data[$nested_file])) {
            try {
                $nested_data = get_csv_data($nested_file);
            } catch (Exception $e) {
                throw new Exception(
                    "Error when reading subfile '$nested_file' for file '$filename' on row " . ($i + 2) . ":\n  "
                    . $e->getMessage() . "\n"
                );
            }
            
            $data = array_merge($data, $nested_data);
        }
    }
    
    return $data;
}
