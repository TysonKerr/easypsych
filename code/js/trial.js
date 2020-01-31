"use strict";
var trial = {
    values: null,
    experiment: window.parent.experiment,
    start_time: 0,
    
    fetch_csv: function(filename, shuffle_seed_suffix = "") {
        return this.experiment.fetch_csv(filename, shuffle_seed_suffix);
    },
    
    submit: function(additional_output) {
        return this.submitter.submit(additional_output);
    },
    
    // get_responses is never called by the program, but it helps testing trial types
    // when you can put trial.get_responses() in the console and see what would result
    get_responses: function(additional_output) {
        return this.submitter.get_response_rows(additional_output);
    },
    
    init: function() {
        this.start_time = performance.now();
        this.disables.init_min_and_max_time(
            this.get_value("Min Time"),
            this.get_value("Max Time"),
        );
        this.autofocus();
        this.add_event_listeners();
        this.experiment.trial = this;
        
        window.parent.window.trial = this; // for ease of testing
        
        document.body.removeChild(document.getElementById("trial-mask"));
        
        if (typeof this.onload === "function") this.onload();
    },
    
    add_event_listeners: function() {
        document.addEventListener("keydown", event => {
            this.experiment.process_keydown(event);
        });
    },
    
    autofocus: function() {
        // https://gomakethings.com/how-to-get-the-first-and-last-focusable-elements-in-the-dom/
        let focusable = document.querySelector('button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
        
        if (focusable) focusable.focus();
    },
    
    get_value: function(name) {
        let value = helper.get_value(this.values, name);
        
        return typeof value === "undefined" ? "" : value;
    },
    
    get_all_in_column: function(col) {
        let values = [];
        
        if (0 in this.values.stimuli && col in this.values.stimuli[0]) {
            for (let i = 0; i < this.values.stimuli.length; ++i) {
                values.push(this.values.stimuli[i][col]);
            }
        } else if (col in this.values.procedure[0]) {
            values.push(this.values.procedure[0][col]);
        }
        
        return values;
    },
    
    get_last_response_value: function(column_name, first_val_only = true) {
        return this.experiment.get_last_response_value(column_name, first_val_only);
    },
    
    wait_for_data_submission_to_complete: function() {
        return this.experiment.wait_for_data_submission_to_complete();
    },
};

trial.submitter = {
    trial: trial,
    
    submit: function(additional_output) {
        return this.trial.experiment.receive_trial_submission(
            JSON.stringify(this.get_response_rows(additional_output))
        );
    },
    
    // this should return an array of rows, with rows being objects using column names as keys
    get_response_rows: function(additional_output) {
        let default_submission = this.get_default_response_row();
        let submission;
        
        if (typeof this.trial.custom_scoring === "function") {
            submission = this.get_custom_response_rows(default_submission);
        } else {
            submission = [default_submission];
        }
        
        if (additional_output) {
            submission.forEach(row => Object.assign(row, additional_output));
        }
        
        return submission;
    },
    
    get_default_response_row: function() {
        let response_row = this.get_formdata_as_row();
        response_row["Trial_Duration"] = performance.now() - this.trial.start_time;
        this.merge_in_row(response_row, this.get_trial_values_as_output_row());
        return response_row;
    },
    
    get_formdata_as_row: function() {
        let formdata = new FormData(document.getElementById("trial-form"));
        return this.convert_formdata_to_response_row(formdata);
    },
    
    convert_formdata_to_response_row: function(formdata) {
        let response_row = {};
        
        formdata.forEach((val, prop) => {
            response_row[prop] = val;
        });
        
        return response_row;
    },
    
    get_trial_values_as_output_row: function() {
        return Object.assign(
            this.add_prefix_to_keys(this.trial.values.procedure, "Proc"),
            this.add_prefix_to_keys(this.get_stim_values_as_output_row(), "Stim")
        );
    },
    
    add_prefix_to_keys: function(object, prefix) {
        let prefixed_object = {};
        
        for (let key in object) {
            prefixed_object[`${prefix}_${key}`] = object[key];
        }
        
        return prefixed_object;
    },
    
    get_stim_values_as_output_row: function() {
        let row = {};
        
        this.trial.values.stimuli.forEach(stim_row => {
            for (let column_name in stim_row) {
                if (!(column_name in row)) {
                    row[column_name] = [];
                }
                
                row[column_name].push(stim_row[column_name]);
            }
        });
        
        for (let column_name in row) {
            row[column_name] = row[column_name].join("|");
        }
        
        return row; 
    },
    
    // puts key-value pairs from the second row into the first, if that key doesn't already exist in the first
    merge_in_row: function(first_row, second_row) {
        for (let column_name in second_row) {
            if (!(column_name in first_row)) {
                first_row[column_name] = second_row[column_name];
            }
        }
    },
    
    // if custom scoring is available, I want the process to be as forgiving as possible
    // so, users can either:
    // (1) simply modify the row sent to it, and that will be converted upon return
    //    (that is determined by the return value of custom scoring being undefined)
    // (2) or, users can return the rows they want recorded, and in case they left out anything
    //     in the default scoring, we will merge it back in without overwriting anything
    get_custom_response_rows: function(default_response_row) {
        let response_rows = trial.custom_scoring(default_response_row);
        
        if (typeof response_rows === "undefined") return [default_response_row];
        if (!Array.isArray(response_rows)) response_rows = [response_rows];
        
        response_rows.forEach(row => this.merge_in_row(row, default_response_row));
        
        return response_rows;
    },
};

trial.disables = {
    names: [],
    submit_selectors: [
        "button:not([type=button]):not([type=reset])",
        "input[type=submit]",
        "input[type=image]"
    ],

    init_min_and_max_time: function(min_time, max_time) {
        max_time = parseFloat(max_time);
        min_time = parseFloat(min_time);
        
        this.init_min_time(min_time);
        this.init_max_time(max_time, min_time);
    },
    
    init_min_time: function(min_time) {
        if (!isNaN(min_time) && min_time > 0) {
            this.add("min time");
            
            setTimeout(() => {
                this.remove("min time");
            }, min_time * 1000);
        }
    },
    
    init_max_time: function(max_time, min_time) {
        if (max_time > 0) {
            setTimeout(() => { trial.submit(); }, max_time * 1000);
            
            if (isNaN(min_time)) {
                this.hide_submitters();
            }
        }
    },
    
    add: function(disable_name) {
        if (!(disable_name in this.names)) {
            this.names[disable_name] = true;
            this.set_submit_disabled_status(true);
        }
    },
    
    remove: function(disable_name) {
        delete this.names[disable_name];
        
        if (Object.keys(this.names).length === 0) {
            this.set_submit_disabled_status(false);
        }
    },
    
    set_submit_disabled_status: function(status) {
        this.query_submitters().forEach(element => {
            element.disabled = status;
        });
    },
    
    hide_submitters: function() {
        this.query_submitters().forEach(element => {
            element.style.display = "none";
        });
    },
    
    query_submitters: function() {
        return document.querySelectorAll(this.submit_selectors.join(","));
    },
};
