<!DOCTYPE html>
<html>
<head>
    <title>Shuffle Tests</title>
    <meta charset="utf-8">
    <base href="../../..">
    <script src="code/vendor/seedrandom.3.0.5.min.js"></script>
    <script src="code/js/helper.js"></script>
    <script src="code/js/CSV.js"></script>
    <link rel="stylesheet" href="code/tests/shuffles/shuffle-test.css">
    <style id="cell-styles"></style>
</head>
<body>

<div id="cell-info-display"></div>
<div id="cell-overlay"></div>

<div id="shuffle-demo-container"></div>

<input type="color" id="cell-color-input">

<script src="code/tests/shuffles/shuffle-test.js"></script>
<script>
"use strict";

shuffle_demos.init();
cell_colors.init();

shuffle_demos.add([
    ["Cue",      "Answer",    "Shuffle"],
    ["2",        "---",       ""],
    ["3",        "---",       "off"],
    ["1.1-",     "Apple",     "set a"],
    ["1.2--",    "Banana",    "set a"],
    ["1.3---",   "Cucumber",  "set a"],
    ["1.4----",  "Donut",     "set a"],
    ["1.5-----", "Enchilada", "set a"],
    ["2.1-",     "Flapjack",  "group b"],
    ["2.2--",    "Gelatin",   "group b"],
    ["2.3---",   "Hummus",    "group b"],
    ["2.4----",  "Ice cream", "group b"],
    ["2.5-----", "Juice",     "group b"],
]);

shuffle_demos.add([
    ["Cue", "Answer Stem", "Answer", "Value", "Shuffle; Affects Cue::Answer", "Shuffle; Affects Value"],
    ["a", "ap", "apple", "1", "foods", "vals"],
    ["b", "ba", "banana", "2", "foods", "vals"],
    ["c", "cu", "cucumber", "3", "foods", "vals"],
    ["d", "do", "dog", "4", "animals", "vals"],
    ["e", "el", "elephant", "5", "animals", "vals"],
    ["f", "fe", "ferret", "6", "animals", "vals"],
]);

shuffle_demos.add([
    ["Cue",      "Answer",    "Shuffle; Within That Column", "That Column"],
    ["2",        "---",       "",    ""],
    ["3",        "---",       "off", ""],
    ["1.1-",     "Apple",     "yep", "first"],
    ["1.2--",    "Banana",    "yep", "first"],
    ["1.3---",   "Cucumber",  "yep", "first"],
    ["1.4----",  "Donut",     "yep", "first"],
    ["1.5-----", "Enchilada", "yep", "first"],
    ["2.1-",     "Flapjack",  "yep", "second"],
    ["2.2--",    "Gelatin",   "yep", "second"],
    ["2.3---",   "Hummus",    "yep", "second"],
    ["2.4----",  "Ice cream", "yep", "second"],
    ["2.5-----", "Juice",     "yep", "second"],
]);

shuffle_demos.add([
    ["Cue",      "Answer",    "Shuffle Block"],
    ["0.1",      "---",       ""],
    ["0.2",      "---",       ""],
    ["1.1-",     "Apple",     "block a"],
    ["1.2--",    "Banana",    "block a"],
    ["1.3---",   "Cucumber",  "block a"],
    ["0.3",      "---",       ""],
    ["0.4",      "---",       ""],
    ["2.1-",     "Flapjack",  "block b"],
    ["2.2--",    "Gelatin",   "block b"],
    ["2.3---",   "Hummus",    "block b"],
    ["0.5",      "---",       ""],
    ["0.6",      "---",       ""],
]);

shuffle_demos.add([
    ["Cue",      "Answer",    "Shuffle Block"],
    ["0.1",      "---",       ""],
    ["0.2",      "---",       ""],
    ["1.1-",     "Apple",     "block a"],
    ["1.2--",    "Banana",    "block a"],
    ["1.3---",   "Cucumber",  "block a"],
    ["1.4----",  "Donut",     "block a"],
    ["0.3",      "---",       ""],
    ["0.4",      "---",       ""],
    ["2.2--",    "Gelatin",   "block b"],
    ["2.3---",   "Hummus",    "block b"],
    ["0.5",      "---",       ""],
    ["0.6",      "---",       ""],
]);

shuffle_demos.add([
    ["Cue",      "Answer",    "Shuffle Block 2; Within Constraints", "Constraints"],
    ["0.1",      "---",       "",      , ""],
    ["0.2",      "---",       "",      , ""],
    ["1.1-",     "Apple",     "block a", "shuffle this"],
    ["1.2--",    "Banana",    "block a", "shuffle this"],
    ["1.3---",   "Cucumber",  "block a", "shuffle this"],
    ["1.4----",  "Donut",     "block a", "shuffle this"],
    ["0.3",      "---",       "",      , ""],
    ["0.4",      "---",       "",      , ""],
    ["2.2--",    "Gelatin",   "block b", "shuffle this"],
    ["2.3---",   "Hummus",    "block b", "shuffle this"],
    ["0.5",      "---",       "",      , ""],
    ["0.6",      "---",       "",      , ""],
]);

</script>

</body>
</html>
