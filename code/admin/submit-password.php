<?php
    /* this file is only meant to be accessed as a
       require from inside the function request_password()
       the variables $title, $prompt, and $action should be defined
     */
    if (!defined('APP_ROOT')) exit();
?><!DOCTYPE html>
<html>
<head>
    <title><?= $title ?? 'Login' ?></title>
    <meta charset="utf-8">
    <style>
        form {
            text-align: center;
        }
        .error {
            color: #880000;
        }
    </style>
</head>
<body>
    <form method="post" <?= $action ?>>
        <?= $prompt ?>
        <br><input type="password" name="password" autofocus>
        <br><button>Submit</button>
    </form>
</body>
</html>
