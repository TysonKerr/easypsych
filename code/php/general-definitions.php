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
    return htmlspecialchars(get_setting('experiment_name'));
}

function get_conditions() {
    static $conditions = null;
    
    if ($conditions === null) {
        $conditions = read_csv(APP_ROOT . '/experiment/conditions.csv');
    }
    
    return $conditions;
}

function get_user_metadata_file($username) {
	return APP_ROOT . "/data/user-$username-data/metadata.csv";
}

function record_metadata($username, $id, $metadata) {
    $filename = get_user_metadata_file($username);
    $dir = dirname($filename);
    
    if (!is_dir($dir)) mkdir($dir, 0755, true);
    
    $handle = fopen($filename, 'a');
    
    foreach ($metadata as $key => $val) {
        fputcsv($handle, [$id, $key, $val]);
    }
    
    fclose($handle);
}

function get_metadata($username, $id = false) {
    $filename = get_user_metadata_file($username);
    
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
