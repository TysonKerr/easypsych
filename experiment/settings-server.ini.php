;<?php exit;
; The page title is used as the webpage title (the name of the tab in your browser).
page_title = Experiment

; The current experiment controls which file in the conditions folder will be used
; at the login page. It is still possible to log into another experiment by
; appending a GET parameter to the url with "?e=...". For example, if you had another
; conditions file called "another-experiment.csv", you could access that by
; adding "?e=another-experiment" to the url.
current_experiment = demo-experiment

; If this is set to "no", the login screen will only contain an input for a 
; username, and a condition will be randomly assigned.
allow_condition_selection = yes

; If enabled, condition names will be listed at the login screen, rather than indexes
; The names from the "Name" column in the condition file. If names are not used,
; the rows will simply be numbered, starting from 0.
use_condition_names = yes
