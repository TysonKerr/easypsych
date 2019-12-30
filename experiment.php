<?php
    require __DIR__ . '/code/php/init.php';
    require APP_ROOT . '/code/php/experiment-definitions.php';
    start_session();
    $exp_resources = get_experiment_resources($_SESSION['username'], $_SESSION['id']);
    $css_link = get_smart_cached_link('code/css/style.css');
    $exp_js_link = get_smart_cached_link('code/js/experiment.js');
    $helper_js_link = get_smart_cached_link('code/js/helper.js');
?><!DOCTYPE html>
<html>
<head>
    <title><?= get_experiment_title() ?> Experiment</title>
    <meta charset="utf-8">
    <link rel="stylesheet" href="<?= $css_link ?>">
    <script src="code/vendor/seedrandom.3.0.5.min.js"></script>
    <script src="<?= $helper_js_link ?>"></script>
    <script src="<?= $exp_js_link ?>"></script>
    <script>
        document.addEventListener("DOMContentLoaded", function() {
            window.experiment = new Experiment(
                document.getElementById("exp-container"),
                <?= $exp_resources ?>
            );
            
            window.experiment.start_current_trial();
        });
    </script>
</head>
<body>
    <div id="exp-container"><iframe id="exp-frame"></iframe></div>
</body>
</html>
