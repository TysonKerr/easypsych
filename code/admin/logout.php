<?php

require dirname(__DIR__) . '/php/init.php';
start_session();
$_SESSION = [];
header('Location: ../..', true, 303);
exit;
