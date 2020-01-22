<?php
    if (!defined('APP_ROOT')) exit();
?><!DOCTYPE html>
<html>
<head>
    <title>Set Password</title>
    <meta charset="utf-8">
    <style>
        form {
            text-align: center;
        }
    </style>
</head>
<body>
    <form method="post" action="code/admin/set-password.php">
        Please set a password:
        <br><input type="password" name="p" autofocus>
        <br><button>Submit</button>
    </form>
</body>
</html>
