<?php
    require __DIR__ . '/code/php/init.php';
    require APP_ROOT . '/code/php/index-definitions.php';
    
    $login_error = process_login_submission(); // if they have submitted a username, move them to experiment.php
    
    $experiment_title = get_experiment_title();
    $condition_choice = get_condition_choice_html();
    $css_link = get_smart_cached_link('code/css/style.css');
?><!DOCTYPE html>
<html>
<head>
    <title><?= $experiment_title ?> Login</title>
    <meta charset="utf-8">
    <link rel="stylesheet" href="<?= $css_link ?>">
</head>
<body>
<div class="center-outer">
    <?= $login_error ?>
    <form method="post" id="welcome-form" class="center-inner">
        <table>
            <tr> <td>username:</td> <td><input type="text" pattern="\S+" required name="u" autofocus></td> </tr>
            <?= $condition_choice ?>
            <tr> <td></td> <td><button type="submit">Submit</button></td> </tr>
        </table>
    </form>
</div>
</body>
</html>
