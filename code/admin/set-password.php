<?php

require dirname(__DIR__) . '/php/init.php';

if (is_file(PASSWORD)) exit;

if (!filter_has_var(INPUT_POST, 'p')) exit;

$submitted_password = filter_input(INPUT_POST, 'p');
$hash = password_hash($submitted_password, PASSWORD_DEFAULT);

file_put_contents(PASSWORD, "<?php '$hash';" . PHP_EOL);

header('Location: ../..');
exit;
