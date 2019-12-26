<?php

header('Content-Type: text/plain');
ini_set('html_errors', false);
require APP_ROOT . '/code/php/init.php';

start_session();

if (!isset($_SESSION['username'], $_SESSION['id'])) exit();
