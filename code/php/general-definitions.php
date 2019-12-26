<?php

function get_setting($setting_name) {
    $settings = get_all_settings();
    return $settings[$setting_name];
}

function get_all_settings() {
    static $settings = null;
    
    if ($settings === null) {
        $settings = parse_ini_file(APP_ROOT . '/Experiment/settings.ini.php', true, INI_SCANNER_TYPED);
    }
    
    return $settings;
}

function start_session() {
    $session_dir = APP_ROOT . '/data/sess';
    
    if (!is_dir($session_dir)) mkdir($session_dir, 0755, true);
    
    session_save_path($session_dir);
    
    session_start();
}

function get_experiment_title() {
    return htmlspecialchars(get_setting('experiment_name'));
}

function get_conditions() {
    return read_csv(APP_ROOT . '/experiment/conditions.csv');
}

function get_new_id() {
    return get_random_string(8);
}

function get_random_string($len = 8) {
    $chars = 'qwertyuiopasdfghjklzxcvbnm1234567890';
    $str = '';
    
    for ($i = 0; $i < $len; ++$i) {
        $str .= $chars[rand(0, 35)];
    }
    
    return $str;
}

function record_metadata($username, $id, $metadata) {
    $dir = APP_ROOT . "/data/$username";
    
    if (!is_dir($dir)) mkdir($dir, 0755, true);
    
    $filename = "$dir/metadata.csv";
    $handle = fopen($filename, 'a');
    
    foreach ($metadata as $key => $val) {
        fputcsv($handle, [$id, $key, $val]);
    }
    
    fclose($handle);
}

function get_metadata($username, $id = false) {
    $filename = APP_ROOT . "/data/$username/metadata.csv";
    
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

function user_data_exists($username) {
    return is_file(APP_ROOT . "/data/$username/metadata.csv");
}

function get_smart_cached_link($link) {
    return "$link?v=" . filemtime($link);
}

function read_csv($filename) {
    $handle = fopen($filename, 'r');
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
    $headers = [];
    
    foreach ($data as $row) {
        foreach ($row as $header => $val) {
            $headers[$header] = true;
        }
    }
    
    $headers = array_keys($headers);
    
    $handle = fopen($filename, 'w');
    
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
    
    $handle = fopen($filename, 'r+');
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
