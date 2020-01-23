<?php

define('DATA_DIR', APP_ROOT . '/data');
define('ARCHIVE', APP_ROOT . '/data/archive.txt');
require APP_ROOT . '/code/php/experiment-definitions.php';

function find_users($dir) {
    $data = [];
    
    foreach (scandir($dir) as $entry) {
        if ($entry === '.' or $entry === '..' or is_file("$dir/$entry")) continue;
        
        if (is_file("$dir/$entry/metadata.csv")) {
            if (!isset($data[$dir])) $data[$dir] = [];
            
            $username = substr($entry, 5, strlen($entry) - 10);
            $data[$dir][] = $username;
        } else {
            $data = array_merge($data, find_users("$dir/$entry"));
        }
    }
    
    return $data;
}

function find_users_in_each_exp() {
    $users = find_users(DATA_DIR);
    $prefix_len = strlen(DATA_DIR) + 1;

    foreach ($users as $path => $exp_user_list) {
        $users[substr($path, $prefix_len)] = $exp_user_list;
        unset($users[$path]);
    }
    
    return $users;
}

function find_headers_for_all_users($users_in_each_exp) {
    $headers = [];
    
    foreach ($users_in_each_exp as $exp => $user_list) {
        foreach ($user_list as $username) {
            $user_dir = DATA_DIR . "/$exp/user-$username-data";
            
            foreach (scandir($user_dir) as $entry) {
                if (substr($entry, -13) === 'responses.csv') {
                    $file_headers = get_headers_in_file("$user_dir/$entry");
                    
                    foreach ($file_headers as $header) {
                        $headers[$header] = true;
                    }
                }
            }
        }
    }
    
    return array_keys($headers);
}

function get_headers_in_file($filename) {
    $handle = fopen($filename, 'r');
    
    if (!$handle) return [];
    
    $headers = fgetcsv($handle);
    fclose($handle);
    return $headers;
}

function get_user_data($username, $exp) {
    $metadata = get_metadata($username, $exp);
    $last_id = array_key_last($metadata);
    $id_data = get_metadata_for_id($metadata, $last_id);
    return get_responses($username, $exp, $id_data['ID_list']);
}

function get_column_options($users_in_each_exp) {
    $columns = find_headers_for_all_users($users_in_each_exp);
    $columns_sorted = sort_columns_into_groups($columns);
    return get_array_as_checkboxes($columns_sorted, 'Columns', 'c');
}

function get_user_options($users_in_each_exp, $from_archive = false) {
    $users_with_exp_prefix = get_users_with_exp_prefix($users_in_each_exp);
    $filtered_users = get_users_filtered_by_archive($users_with_exp_prefix, $from_archive);
    $header = $from_archive ? 'Archived Participants' : 'Participants';
    $button = $from_archive ? 'remove from archive' : 'add to archive';
    $class  = $from_archive ? 'js-de-archive' : 'js-archive';
    $button = "<button type='button' class='$class'>$button</button>";
    return get_array_as_checkboxes($filtered_users, $header, 'p', $from_archive, $button, $from_archive);
}

function sort_columns_into_groups($columns) {
    $columns_sorted = [
        'Exp' => [
            'Exp_Username'   => 'Exp_Username',
            'Exp_ID'         => 'Exp_ID',
            'Trial_Duration' => 'Trial_Duration',
        ]
    ];
    
    $post_columns = [];
    
    foreach ($columns as $col) {
        if ($col === 'Trial_Duration') continue;
        if ($col === 'Exp_Username')   continue;
        if ($col === 'Exp_ID')         continue;
        
        if (substr($col, 0, 4) === 'Exp_') {
            $columns_sorted['Exp'][$col] = $col;
            continue;
        }
        
        $start = substr($col, 0, 5);
        
        if ($start === 'Proc_') {
            $columns_sorted['Procedure'][$col] = $col;
        } elseif ($start === 'Stim_') {
            $columns_sorted['Stimuli'][$col] = $col;
        } elseif ($start === 'Post_') {
            $col_split = explode('_', $col);
            $post_columns[$col_split[1]][$col] = $col;
        } else {
            $columns_sorted['Responses'][$col] = $col;
        }
    }
    
    ksort($post_columns, SORT_NUMERIC);
    
    foreach ($post_columns as $post_level => $columns) {
        $columns_sorted["Post_$post_level"] = $columns;
    }
    
    return $columns_sorted;
}

function get_array_as_checkboxes($arr, $header, $name, $unchecked = false, $extra_html = '', $collapsed = false) {
    $header_display = htmlspecialchars($header, ENT_QUOTES);
    $checked = $unchecked ? '' : 'checked';
    $html_name = htmlspecialchars($name, ENT_QUOTES) . '[]';
    $class = 'checkbox-array' . ($collapsed ? ' collapsed' : '');
    $button_html = $collapsed ? '+' : '-';
    $html = "<div class='$class'>";
    $html .= '<div class="checkbox-array-header">'
          .    "<label class='checkbox-array-name'><input type='checkbox' $checked>$header_display</label>"
          .    "<span>$extra_html</span>"
          .    "<label class='checkbox-array-expand'><button type='button' class='expansion-button'>$button_html</button></label>"
          . '</div>';
    
    foreach ($arr as $key => $val) {
        if (is_array($val)) {
            $html .= get_array_as_checkboxes($val, $key, $name, $unchecked);
        } else {
            $html_val = htmlspecialchars($key, ENT_QUOTES);
            $html_display = htmlspecialchars($val, ENT_QUOTES);
            $html .= '<label class="checkbox-array-option">'
                  .  "<input type='checkbox' name='$html_name' value='$html_val' $checked>$html_display"
                  .  '</label>';
        }
    }
    
    $html .= '</div>';
    
    return $html;
}

function get_users_with_exp_prefix($users_in_each_exp) {
    $users_with_exp_prefix = [];
    
    foreach ($users_in_each_exp as $exp => $user_list) {
        foreach ($user_list as $username) {
            $users_with_exp_prefix[$exp]["$exp/$username"] = $username;
        }
    }
    
    return $users_with_exp_prefix;
}

function parse_input_user_list($user_list_prefixed) {
    $users_in_each_exp = [];
    
    foreach ($user_list_prefixed as $user_with_exp_prefix) {
        $user_split = explode('/', $user_with_exp_prefix);
        $username = array_pop($user_split);
        $exp = implode('/', $user_split);
        $users_in_each_exp[$exp][] = $username;
    }
    
    return $users_in_each_exp;
}

function send_experiment() {
    $filename = zip_experiment();
    
    header('Content-Description: File Transfer');
    header('Content-Type: application/octet-stream');
    header('Content-Disposition: attachment; filename="'.basename($filename).'"');
    header('Expires: 0');
    header('Cache-Control: must-revalidate');
    header('Pragma: public');
    header('Content-Length: ' . filesize($filename));
    readfile($filename);
    unlink($filename);
    exit;
}

function zip_experiment() {
    $zip = new ZipArchive;
    $dirname = explode('/', strtr(APP_ROOT, '\\', '/'));
    $dirname = end($dirname);
    $zip_filename = APP_ROOT . "/data/$dirname.zip";
    
    if (is_file($zip_filename)) unlink($zip_filename);
    
    $creation_result = $zip->open($zip_filename, ZipArchive::CREATE);
    
    if ($creation_result !== true) {
        exit('failed to zip experiment, couldn\'t open new archive, ' . $creation_result);
    }
    
    $files = get_files_in_dir_recursively(APP_ROOT);
    $app_root_len = strlen(APP_ROOT) + 1; // +1 to include the trailing slash
    $skip_patterns = ['.git', 'code/git', 'experiment/password.php', 'data/sess/'];
    
    foreach ($files as $filename) {
        foreach ($skip_patterns as $substring) {
            if (strpos($filename, $substring) !== false) continue 2;
        }
        
        $zip->addFile($filename, substr($filename, $app_root_len));
    }
    
    if (!$zip->close()) exit('failed to write experiment zip');
    
    return $zip_filename;
}

function get_files_in_dir_recursively($dir) {
    $files = [];
    
    foreach (scandir($dir) as $entry) {
        if ($entry === '.' or $entry === '..') continue;
        
        $path = "$dir/$entry";
        
        if (is_dir($path)) {
            $files = array_merge($files, get_files_in_dir_recursively($path));
        } else {
            $files[] = $path;
        }
    }
    
    return $files;
}

function get_users_filtered_by_archive($users_with_exp_prefix, $from_archive) {
    $filtered_users = [];
    $archive = get_user_archive();
    
    foreach ($users_with_exp_prefix as $exp => $user_list) {
        foreach ($user_list as $username_with_exp_prefix => $username) {
            if (isset($archive[$username_with_exp_prefix]) === $from_archive) {
                $filtered_users[$exp][$username_with_exp_prefix] = $username;
            }
        }
    }
    
    return $filtered_users;
}

function get_user_archive() {
    if (is_file(ARCHIVE)) {
        $list = explode("\n", file_get_contents(ARCHIVE));
        $archive = [];
        
        foreach ($list as $user) {
            $archive[$user] = $user;
        }
        
        return $archive;
    } else {
        return [];
    }
}

function set_user_archive($archive) {
    file_put_contents(ARCHIVE, implode("\n", array_keys($archive)));
}
