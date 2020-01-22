<?php

require dirname(__DIR__) . '/php/init.php';
require __DIR__ . '/definitions.php';
$css_link = get_smart_cached_link('../code/data/style.css');
$js_link = get_smart_cached_link('../code/data/script.js');

?><!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Data</title>
    <link rel="stylesheet" href="<?= $css_link ?>">
    <script src="<?= $js_link ?>"></script>
</head>
<body id="data-menu-body">

<?php
    $users_in_each_exp = find_users_in_each_exp();
?>
<h1 id="data-menu-header">
    <div>Data Menu</div>
    <button name="request" value="download" form="options-container" formtarget=""      >Download</button>
    <button name="request" value="preview"  form="options-container" formtarget="_blank">Preview</button>
    <button name="request" value="download-experiment" form="options-container">Download Experiment</button>
</h1>

<form id="options-container" method="post" action="../code/data/download.php">
    <?= get_column_options($users_in_each_exp) ?>
    <?= get_user_options($users_in_each_exp) ?>
</form>

</body>
</html>
