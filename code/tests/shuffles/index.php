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

<div id="cell-info-display">
    <div id="cell-info-contents"></div>
    <div id="header-info">
        <div id="shuffle-type"></div>
        <div id="shuffle-targets"></div>
        <div id="shuffle-within"></div>
    </div>
</div>
<div id="cell-overlay"></div>

<div id="shuffle-demo-container"></div>

<input type="color" id="cell-color-input">

<script src="code/tests/shuffles/shuffle-test.js"></script>
<script>
"use strict";

shuffle_demos.init();
cell_colors.init();

shuffle_demos.add([
    ["Cue",       "Answer",    "Shuffle"],
    ["2",         "---",       ""],
    ["3",         "---",       "off"],
    ["1.1-",      "Apple",     "set a"],
    ["1.2--",     "Banana",    "set a"],
    ["1.3---",    "Cucumber",  "set a"],
    ["2.1-",      "Ant",       "group b"],
    ["2.2--",     "Bat",       "group b"],
    ["2.3---",    "Cat",       "group b"],
    ["1.4----",   "Donut",     "set a"],
    ["1.5-----",  "Enchilada", "set a"],
    ["1.6------", "Flapjack",  "set a"],
    ["2.4----",   "Dog",       "group b"],
    ["2.5-----",  "Elephant",  "group b"],
    ["2.6------", "Ferret",    "group b"],
], "Shuffles are specified by any column starting with 'Shuffle'. By default, the type of shuffle will be a simple"
 + " row shuffle. Rows with matching values in the 'Shuffle' column will be swapped around. Rows are moved as a set,"
 + " so the cells within a row will stay together after the shuffle. If the value in the shuffle column is 'off', 'no',"
 + " or the empty string '', this row won't be shuffled. For the shuffled rows, the rows within a group do not need to "
 + "be sequential; any two rows with a matching shuffle value can be swapped."
);

shuffle_demos.add([
    ["Cue", "Answer Stem", "Answer", "Value", "Shuffle; Affects A::C", "Shuffle; Affects Value"],
    ["a", "ap", "apple", "1", "foods", "vals"],
    ["b", "ba", "banana", "2", "foods", "vals"],
    ["c", "cu", "cucumber", "3", "foods", "vals"],
    ["d", "do", "dog", "4", "animals", "vals"],
    ["e", "el", "elephant", "5", "animals", "vals"],
    ["f", "fe", "ferret", "6", "animals", "vals"],
], "Optionally, each shuffle can target specific columns, affecting only the cell within those columns. "
 + "This is done by putting a semicolon after the shuffle name, and then using the format 'Affects X', "
 + "where X can be either a single column, or a list of columns. When specifying a list, columns can "
 + "be listed out individually, like 'A, B, C', or you can specify a range of columns, like "
 + "'A::C'. You can also combine these, like 'A, B, F::H'. Furthermore, rather than typing out the "
 + "column names, you can use numbers or letters (for letters, 'A' is '1', 'B' is '2', 'AA' is '27', and so on)."
);

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
], "Another option is to specific another column that acts as the constraint for the current shuffle. When "
 + "this is used, the shuffle only affects rows with matching values in the constraint column. For the simple "
 + "row shuffle, this isn't always so useful, but it will be more useful with block shuffles, shown later."
 + " To use this option, add another semicolon to the column header, and then use the format 'Within X', where X"
 + " is the column to use as the constraint. This column does not need to be another shuffle column. Also, unlike"
 + " the previous option, the 'Within' option only accepts a single column, not a range."
);

shuffle_demos.add([
    ["Cue",      "Answer",    "Shuffle Block; Within Phase", "Phase"],
    ["0.1",      "---",       "",                            "study"],
    ["0.2",      "---",       "",                            "study"],
    ["1.1-",     "Apple",     "block a",                     "study"],
    ["1.2--",    "Banana",    "block a",                     "study"],
    ["1.3---",   "Cucumber",  "block a",                     "study"],
    ["0.3",      "---",       "",                            "study"],
    ["0.4",      "---",       "",                            "study"],
    ["2.1-",     "Donut",     "block b",                     "study"],
    ["2.2--",    "Enchilada", "block b",                     "study"],
    ["2.3---",   "Flapjack",  "block b",                     "study"],
    ["0.5",      "---",       "",                            "test"],
    ["0.6",      "---",       "",                            "test"],
    ["3.1-",     "Ant",       "block c",                     "test"],
    ["3.2--",    "Bat",       "block c",                     "test"],
    ["3.3---",   "Cat",       "block c",                     "test"],
    ["0.3",      "---",       "",                            "test"],
    ["0.4",      "---",       "",                            "test"],
    ["4.1-",     "Dog",       "block d",                     "test"],
    ["4.2--",    "Elephant",  "block d",                     "test"],
    ["4.3---",   "Ferret",    "block d",                     "test"],
], "The second type of shuffle is the block shuffle, shown here. This shuffle moves blocks of rows, without "
 + "changing the order of the rows inside the blocks. Blocks are determined simply by matching sequential "
 + "values in the shuffle column, so if the column entries were 'a, a, b, b, a, a', this would result in three "
 + "separate blocks (i.e., it wouldn't matter that the first and third blocks had the same value 'a')."
);

shuffle_demos.add([
    ["Cue",        "Answer",    "Shuffle Block"],
    ["0.1",        "block 1",   "off"],
    ["0.2",        "block 1",   "off"],
    ["1.1 X -",    "Apple",     "block a"],
    ["1.2 X --",   "Banana",    "block a"],
    ["1.3 X ---",  "Cucumber",  "block a"],
    ["1.4 X ----", "Donut",     "block a"],
    ["0.3",        "block 3",   "off"],
    ["0.4",        "block 3",   "off"],
    ["2.1 - -",    "Gelatin",   "block b"],
    ["2.2 - --",   "Hummus",    "block b"],
    ["0.5",        "block 5",   "off"],
    ["0.6",        "block 5",   "off"],
], "If blocks are different sizes, they can affect the positioning of nonshuffled rows. For example, "
 + "in the file below, there are essentially 5 blocks, with 3 of them being non-shuffled blocks "
 + "(these would be the blocks formed from the rows with 'off' as their shuffle value). If we were to "
 + "number these blocks as 1,2,3,4,5, then blocks 1, 3, and 5 will always appear as the first, third,"
 + " and fifth block, respectively. But, since the number of rows in block 2 might change from 2 to 4,"
 + " the exact position of the rows in blocks 3 and 5 might change, even if their block order didn't change."
 + " To avoid this behavior, see the next demo."
);

shuffle_demos.add([
    ["Cue",        "Answer",    "Shuffle Block; Within My Constraints", "My Constraints"],
    ["0.1",        "block 1",   "off",                                  ""],
    ["0.2",        "block 1",   "off",                                  ""],
    ["1.1 X -",    "Apple",     "block a",                              "shuffle this"],
    ["1.2 X --",   "Banana",    "block a",                              "shuffle this"],
    ["1.3 X ---",  "Cucumber",  "block a",                              "shuffle this"],
    ["1.4 X ----", "Donut",     "block a",                              "shuffle this"],
    ["0.3",        "block 3",   "off",                                  ""],
    ["0.4",        "block 3",   "off",                                  ""],
    ["2.1 - -",    "Gelatin",   "block b",                              "shuffle this"],
    ["2.2 - --",   "Hummus",    "block b",                              "shuffle this"],
    ["0.5",        "block 5",   "off",                                  ""],
    ["0.6",        "block 5",   "off",                                  ""],
], "By using the 'Within X' option to add some contraints to the block shuffle, you can make blocks"
 + " divide their rows up among the available space. Blocks with different sizes now might not end"
 + " up with all their rows sequential anymore, but non-shuffled rows will no longer be affected."
);

shuffle_demos.add([
    ["Cue",     "Answer",   "Shuffle Column; Affects A,B"],
    ["0.1",     "---",      ""],
    ["0.2",     "---",      ""],
    ["1.1-",    "Apple",    "1"],
    ["1.2--",   "Banana",   "1"],
    ["1.3---",  "Cucumber", "1"],
    ["1.4----", "Donut",    "1"],
    ["0.3",     "---",      ""],
    ["0.4",     "---",      ""],
    ["2.1-",    "Elephant", "2"],
    ["3.1-",    "Ferret",   "3"],
    ["4.1-",    "Giraffe",  "4"],
    ["0.5",     "---",      ""],
    ["0.6",     "---",      ""],
], "The next shuffle type is the column shuffle, which moves cells horizontally rather than vertically."
);

shuffle_demos.add([
    ["Cue",    "Answer",    "Shuffle List"],
    ["0.1",    "---",       ""],
    ["0.2",    "---",       ""],
    ["1.1-",   "apple",     "1"],
    ["2.1-",   "ant",       "2"],
    ["3.1-",   "architect", "3"],
    ["0.3",    "---",       ""],
    ["0.4",    "---",       ""],
    ["1.2--",  "banana",    "1"],
    ["2.2--",  "bat",       "2"],
    ["3.2--",  "builder",   "3"],
    ["0.5",    "---",       ""],
    ["0.6",    "---",       ""],
    ["1.3---", "cucumber",  "1"],
    ["2.3---", "cat",       "2"],
    ["3.3---", "carpenter", "3"],
    ["0.7",    "---",       ""],
    ["0.8",    "---",       ""],
], "Finally, the last shuffle type is the list shuffle. Like the block shuffle, this groups rows together "
 + "based on matching values in the shuffle column, and preserves the row order within each group. "
 + "However, unlike the block shuffle, list rows do not need to be sequential. In the example file, "
 + "the rows from the '1' group might swap with the '2' group, but the first '1' will always have the"
 + " answer 'apple'."
);

shuffle_demos.add([
    ["Cue",    "Answer", "Shuffle List"],
    ["0.1",    "---",    ""],
    ["0.2",    "---",    ""],
    ["1.1-",   "a-",     "1"],
    ["2.1-",   "---b",   "2"],
    ["1.2-",   "a-",     "1"],
    ["2.2-",   "---b",   "2"],
    ["1.3-",   "a-",     "1"],
    ["0.3",    "---",    ""],
    ["0.4",    "---",    ""],
], "Like the block shuffle, the list shuffle has more complicated behavior when the lists are not the same length."
 + " With list shuffles, this may result in one list being truncated, and the entries in another list being duplicated."
);

</script>

</body>
</html>
