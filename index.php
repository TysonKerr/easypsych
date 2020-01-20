<?php
    require __DIR__ . '/code/php/init.php';
    require APP_ROOT . '/code/php/index-definitions.php';
    
    $experiment = get_current_experiment();
    $experiment_title = get_experiment_title();
    $condition_choice = get_condition_choice_html($experiment);
    $css_link = get_smart_cached_link('code/css/style.css');
    $login_script_link = get_smart_cached_link('code/js/login.js');
    $login_error = get_error_message();
    $exp_input = get_exp_input($experiment);
?><!DOCTYPE html>
<html>
<head>
    <title><?= $experiment_title ?> Login</title>
    <meta charset="utf-8">
    <link rel="stylesheet" href="<?= $css_link ?>">
</head>
<body>
<div class="center-outer"><div class="center-inner">
    <div class="validation-errors"><?= validate_experiment($experiment) ?></div>
    <form method="post" id="welcome-form" action="experiment.php">
        <div class="error-message"><?= $login_error ?></div>
        <table>
            <tr> <td>Username:</td> <td><input type="text" pattern=".+" required name="u" autofocus></td> </tr>
            <?= $condition_choice ?>
            <tr> <td></td> <td><button type="submit">Submit</button></td> </tr>
        </table>
        <?= $exp_input ?>
    </form>
</div></div>
<script src="<?= $login_script_link ?>"></script>
</body>
</html>
