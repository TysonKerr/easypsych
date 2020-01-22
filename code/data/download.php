<?php

if (!filter_has_var(INPUT_POST, 'request')) exit('request type not specified');

require dirname(__DIR__) . '/php/init.php';
require __DIR__ . '/definitions.php';

$request = filter_input(INPUT_POST, 'request');

if ($request === 'download-experiment') {
    send_experiment();
    exit;
}

$users_in_each_exp = parse_input_user_list(filter_input(INPUT_POST, 'p', FILTER_UNSAFE_RAW, FILTER_REQUIRE_ARRAY));
$headers = filter_input(INPUT_POST, 'c', FILTER_UNSAFE_RAW, FILTER_REQUIRE_ARRAY);

// send headers
if ($request === 'preview'):
    $data_css_link = get_smart_cached_link('style.css');
    $line_count = 0;
    
?><!DOCTYPE html>
<html id="preview-page">
<head>
    <meta charset="utf-8">
    <title>Download Preview</title>
    <link rel="stylesheet" href="<?= $css_link ?>">
    <link rel="stylesheet" href="<?= $data_css_link ?>">
</head>
<body>
<table id="preview-table">
    <thead> <tr><th><div><?= implode('</div></th><th><div>', array_map('htmlspecialchars', $headers)) ?></div></th></tr> </thead>
    <tbody>
<?php

else:
    ini_set('html_errors', false);
    
    $filename = join('-', array_keys($users_in_each_exp));
    $filename = strtr($filename, '/', '-');
    $filename = strtr($filename, '"', "'");
    $filename .= '-' . date('Y-m-d') . '.csv';
    
    header('Content-Type: application/csv');
    header('Content-Disposition: attachment; filename="'.$filename.'";');
    
    $output = fopen('php://output', 'w');
    
    fputcsv($output, $headers);
endif;

// send actual data
foreach ($users_in_each_exp as $exp => $user_list) {
    foreach ($user_list as $username) {
        foreach (get_user_data($username, $exp) as $row) {
            $sorted = [];
            
            foreach ($headers as $header) {
                $sorted[$header] = $row[$header] ?? '';
            }
            
            if ($request === 'preview'):
                ++$line_count;
                
                if ($line_count > 1000) {
                    echo '<tr><td colspan="100">data continues<br>.<br>.<br>.</td></tr>';
                    break 3;
                } else {
                    echo '<tr><td><div>' . implode('</div></td><td><div>', array_map('htmlspecialchars', $sorted)) . '</div></td></tr>';
                }
            else:
                fputcsv($output, $sorted);
            endif;
        }
    }
}

// close everything
if ($request === 'preview'):

?>
    </tbody>
</table>
</body>
</html>
<?php

else:
    fclose($output);
endif;
