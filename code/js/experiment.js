"use strict";
var Experiment = function(container, resources) {
    Object.assign(this, this.loader.load(resources));
    this.trial = null;
    
    this.trial_display = new this.Trial_Display(
        container, this.trial_template, this.trial_types
    );
    
    delete this.trial_template; // not the actual string used, misleading to leave it around
    
    this.data_submission.user = this.user;
    this.validator.validate(this);
    
    this.add_event_listeners();
};

Experiment.prototype = {
    start_current_trial: function() {
        this.trial_display.start(this.get_trial_values(this.proc_index));
    },
    
    get_trial_values: function(proc_index) {
        if (!this.is_valid_proc_index(proc_index)) return false;
        
        let proc_values = this.data.procedure[proc_index];
        let stim_indices = this.get_stimuli_indices(proc_values["Stimuli"]);
        let stim_values = [];
        
        for (let i = 0; i < stim_indices.length; ++i) {
            if (stim_indices[i] in this.data.stimuli) {
                stim_values.push(this.data.stimuli[stim_indices[i]]);
            }
        }
        
        return {
            procedure: proc_values,
            stimuli: stim_values,
        };
    },
    
    get_stimuli_indices: function(stim_range_str) {
        return helper.parse_range_str(stim_range_str)
            .map(item => parseInt(item) - 2)
            .filter(num => !isNaN(num));
    },
    
    is_valid_proc_index: function(proc_index) {
        return proc_index in this.data.procedure;
    },
    
    receive_trial_submission: function(json_responses) {
        const response_set = JSON.parse(json_responses);
        const exp_command = this.get_response_exp_command(response_set);
        const next_proc_index = this.get_next_proc_index(exp_command);
        this.add_info_to_responses(response_set, next_proc_index);
        this.format_responses(response_set);
        this.data_submission.queue_response_submission(response_set);
        this.data.responses.push(response_set);
        this.proc_index = next_proc_index;
        this.trial = null;
        this.start_current_trial();
    },
    
    get_response_exp_command: function(response_set) {
        return "Exp_Command" in response_set[0] ? response_set[0]["Exp_Command"] : "";
    },
    
    get_next_proc_index: function(exp_command) {
        let next_index;
        
        if (exp_command.substring(0, 14) === "mod proc index") {
            next_index = this.get_commanded_proc_index(exp_command);
        } else {
            next_index = this.proc_index + 1;
        }
        
        return Math.max(0, Math.min(this.data.procedure.length, next_index));
    },
    
    get_commanded_proc_index: function(exp_command) {
        let [new_index, is_relative] = this.parse_mod_proc_index(exp_command);
        
        return is_relative ? this.proc_index + new_index : new_index;
    },
    
    parse_mod_proc_index: function(exp_command) {
        let command_split = exp_command.split(":");
        
        if (command_split.length === 1) {
            throw this.error_messages.mod_proc_index_missing_argument
                + "\n" + `(received "${exp_command}")`;
        }
        
        let mod_val = command_split[1].trim();
        let relative = false;
        let new_proc_index;
        
        if (mod_val[0] === "r") {
            relative = true;
            new_proc_index = Number(mod_val.substring(1));
        } else {
            new_proc_index = Number(mod_val);
        }
            
        if (isNaN(new_proc_index)) {
            throw this.error_messages.mod_proc_index_bad_absolute_number
                +  "\n" + `(received "${exp_command}")`;
        }
        
        return [new_proc_index, relative];
    },
    
    get_response_added_info: function(next_proc_index) {
        return {
            "Exp_Username": this.user.name,
            "Exp_ID": this.user.id,
            "Exp_Name": this.user.exp,
            "Exp_Date": helper.get_current_date(),
            "Exp_Timestamp": performance.timeOrigin + performance.now(),
            "Exp_Trial_Number": this.data.responses.length,
            "Exp_Proc_Index": this.proc_index,
            "Exp_Next_Proc_Index": next_proc_index,
        };
    },
    
    add_info_to_responses: function(response_set, next_proc_index) {
        const info = this.get_response_added_info(next_proc_index);
        
        response_set.forEach(row => Object.assign(row, info));
    },
    
    format_responses: function(response_set) {
        response_set.forEach(row => {
            for (let col in row) {
                row[col] = String(row[col]);
            }
        });
    },
    
    fetch_csv: function(filename, shuffle_seed_suffix = "") {
        const seed = this.data.shuffle_seed
                   + "-" + this.trial_number
                   + "." + this.post_trial_level
                   + shuffle_seed_suffix;
        return CSV.fetch(filename, seed);
    },
    
    add_event_listeners: function() {
        document.addEventListener("keydown", event => {
            this.process_keydown(event);
        });
    },
    
    process_keydown: function(event) {
        if (!(event.ctrlKey && event.altKey && this.trial)) return;
        
        if (event.key === "ArrowRight" && this.settings.allow_keyboard_shortcuts_to_change_trial) {
            this.trial.submit({"Exp_Command": "submit trial"});
        }
        
        if (event.key === "ArrowLeft" && this.settings.allow_keyboard_shortcuts_to_change_trial) {
            this.trial.submit({"Exp_Command": "mod proc index: r-1"});
        }
    },
    
    get_last_response_value: function(column_name, first_val_only = true) {
        let last_response = this.data.responses[this.trial_number - 1];
        
        if (column_name in last_response[0]) {
            if (first_val_only) {
                return last_response[0][column_name];
            } else {
                last_response.map(row => row[column_name]);
            }
        } else {
            return "";
        }
    },
    
    wait_for_data_submission_to_complete: function() {
        return new Promise(resolve => {
            this.data_submission.watch_for_empty_queue(() => resolve());
        });
    },
};

Experiment.prototype.Trial_Display = function(container, trial_template, trial_types) {
    this.container = container;
    this.trial_template = trial_template.replace(/@{base_url}/, window.location);
    this.trial_types = trial_types;
};

Experiment.prototype.Trial_Display.prototype = {
    start: function(values) {
        let trial = this.get_trial_page(values);
        let blob = new Blob([trial], {type: "text/html"});
        let url = URL.createObjectURL(blob);
        
        this.container.removeChild(document.getElementById("exp-frame"));
        
        let iframe = document.createElement("iframe");
        iframe.id = "exp-frame";
        iframe.src = url;
        
        this.container.appendChild(iframe);
    },
    
    get_trial_page: function(trial_values) {
        if (!trial_values) {
            trial_values = {stimuli: [], procedure: {"Trial Type": "end-of-experiment"}};
        }
        
        let trial_type = this.trial_types[trial_values.procedure["Trial Type"]];
        let trial = this.trial_template;
        
        trial = this.move_links_to_head(trial);
        
        if ("style" in trial_type) {
            trial = trial.replace(/<\/head>/, "<style>" + trial_type.style + "</style></head>");
        }
        
        if ("script" in trial_type) {
            trial = trial.replace(/<\/body>/, "<script>" + trial_type.script + "</script></body>");
        }
        
        trial = trial.replace(/@{trial_contents}/, trial_type.display);
        trial = trial.replace(/"@{trial_values}"/, JSON.stringify(trial_values));
        trial = this.interpolate_trial_values(trial, trial_values);
        
        return trial;
    },
    
    move_links_to_head: function(doc) {
        let links = [];
        
        doc = doc.replace(/<link[^>]*>/g, function(match) {
            links.push(match);
            return "";
        });
        
        return doc.replace(/<\/head>/, links.join("") + "</head>");
    },
    
    interpolate_trial_values: function(template, values) {
        return template.replace(/@{([^}]+)}/g, function(match, column) {
            let value = helper.get_value(values, column);
            
            if (typeof value === "undefined") {
                console.error(`Missing column: ${column}`);
                return `@{Missing column: ${column}}`;
            } else {
                return value;
            }
        });
    },
};

Experiment.prototype.loader = {
    load: function(resources) {
        resources.data = this.load_exp_data(resources.data);
        
        this.set_loaded_trial_and_proc_index(resources);
        
        return resources;
    },
    
    set_loaded_trial_and_proc_index: function(loaded) {
        if (loaded.data.responses.length === 0) {
            loaded.trial_number = 0;
            loaded.proc_index = 0;
        } else {
            const last_response_set = loaded.data.responses[loaded.data.responses.length - 1];
            console.log(last_response_set);
            loaded.trial_number = Number(last_response_set[0]["Exp_Trial_Number"]) + 1;
            loaded.proc_index = Number(last_response_set[0]["Exp_Next_Proc_Index"]);
        }
    },

    load_exp_data: function(raw_data) {
        let data = {
            condition: raw_data.condition,
            shuffle_seed: raw_data.shuffle_seed,
        };
        
        data.csvs = {};
        Object.assign(data.csvs, raw_data.procedure);
        Object.assign(data.csvs, raw_data.stimuli);
        
        data.stimuli   = CSV.build(data.csvs, 'experiment/stimuli/' + data.condition['Stimuli'],      data.shuffle_seed + "-stim");
        data.procedure = CSV.build(data.csvs, 'experiment/procedures/' + data.condition['Procedure'], data.shuffle_seed + "-proc");
        
        data.responses = this.read_responses(raw_data.responses);
        
        this.freeze_data(data);
        
        return data;
    },

    freeze_data: function(data) {
        Object.freeze(data.condition);
        data.stimuli.forEach(row => Object.freeze(row));
        data.procedure.forEach(row => Object.freeze(row));
        
        data.responses.forEach(set => {
            set.forEach(row => Object.freeze(row));
            Object.freeze(set);
        });
        
        for (let filename in data.cvs) {
            Object.freeze(data.csvs[filename]);
            data.csvs[filename].forEach(row => Object.freeze(row));
        }
    },

    read_responses: function(csv_responses) {
        let responses = [];
        
        for (let i = 0; i < csv_responses.length; ++i) {
            let row = csv_responses[i];
            let trial_number = row["Exp_Trial_Number"];
            console.log(trial_number);
            
            if (!(trial_number in responses)) {
                responses[trial_number] = [];
            }
            
            responses[trial_number].push(row);
        }
        
        return responses;
    },
};

Experiment.prototype.data_submission = {
    response_submission_queue: [],
    is_ready_to_submit_responses: true,
    error_counter: 0,
    observers_for_empty_queue: [],
    
    queue_response_submission: function(response_set) {
        response_set.forEach(row => Object.freeze(row));
        Object.freeze(response_set); // cant change responses once they have been submitted to the server
        this.response_submission_queue.push(response_set);
        
        if (this.is_ready_to_submit_responses) {
            this.submit_responses();
        }
    },
    
    submit_responses: function() {
        if (this.response_submission_queue.length < 1) {
            console.error("attempted to submit responses with empty queue");
            return;
        }
        
        this.is_ready_to_submit_responses = false;
        let responses = this.response_submission_queue;
        let request = new XMLHttpRequest();
        request.onreadystatechange = this.get_http_event_handler(request, responses);
        request.open("POST", "code/php/ajax-responses.php");
        request.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        request.send(this.get_query_string(responses));
    },
    
    get_http_event_handler: function(request, responses) {
        return () => {
            if (request.readyState === XMLHttpRequest.DONE) {
                if (request.responseText !== '' || request.status !== 200) {
                    console.error(request.responseText);
                    console.error(request);
                    ++this.error_counter;
                    let wait_time = Math.min(2 * 60, 2 ** this.error_counter);
                    console.log(`waiting ${wait_time} seconds to try again`);
                    
                    setTimeout(() => {
                        console.log("attempting to submit responses again");
                        this.submit_responses();
                    }, wait_time * 1000);
                } else {
                    this.error_counter = 0;
                    this.clear_responses_from_queue(responses);
                }
            }
        }
    },
    
    get_query_string: function(responses) {
        return "u=" + encodeURIComponent(this.user.name)
            + "&i=" + encodeURIComponent(this.user.id)
            + "&e=" + encodeURIComponent(this.user.exp)
            + "&responses=" + encodeURIComponent(JSON.stringify(
            responses.reduce((rows, row_set) => rows.concat(row_set), [])
        ));
    },
    
    clear_responses_from_queue: function(responses) {
        for (let i = 0; i < responses.length; ++i) {
            let index = this.response_submission_queue.indexOf(responses[i]);
            this.response_submission_queue.splice(index, 1);
        }
        
        this.is_ready_to_submit_responses = true;
        
        if (this.response_submission_queue.length > 0) {
            this.submit_responses();
        } else {
            this.notify_observers_for_empty_queue();
        }
    },
    
    watch_for_empty_queue: function(callback) {
        if (this.response_submission_queue.length === 0) {
            callback();
        } else {
            this.observers_for_empty_queue.push(callback);
        }
    },
    
    notify_observers_for_empty_queue: function() {
        const observers = this.observers_for_empty_queue;
        observers.forEach(callback => callback());
        observers.splice(0, observers.length);
    },
};

Experiment.prototype.error_messages = {
    mod_proc_index_missing_argument:
        "When using Exp_Command 'mod proc index', it must be in the format "
      + "'mod proc index: X', where X is the value to use, such as 'r-1'", 
    mod_proc_index_bad_input:
        "the Exp_Command 'mod proc index' was given an invalid input, and "
      + "was unable to set the proc index correctly. When defining the input, "
      + "it can optionally start with 'r', but then should only contain a number, "
      + "which may start with a negative sign. Examples of inputs: "
      + "'2', '-1', 'r4', 'r-1'",
};

Experiment.prototype.validator = {
    validate: function(experiment) {
        let proc_errors = this.get_procedure_errors(experiment);
        
        if (proc_errors.length > 0) {
            console.error(
                `Errors found in the procedure file "${experiment.data.condition.Procedure}":`
                + "\n\n" +
                proc_errors.join("\n")
            );
        }
    },
    
    get_procedure_errors: function(experiment) {
        const proc = experiment.data.procedure;
        const stim = experiment.data.stimuli;
        const trial_types = experiment.trial_types;
        const errors = [];
        
        if (proc.length === 0) return; // nothing to validate
        
        if (typeof proc[0]["Trial Type"] === "undefined") {
            errors.push('Missing the required "Trial Type" column');
            return errors;
        }
        
        for (let i = 0; i < proc.length; ++i) {
            if (!(proc[i]["Trial Type"] in trial_types)) {
                errors.push(`In row ${i + 2}, under column "Trial Type", the type "${proc[i]["Trial Type"]}" does not exist.`);
            }
            
            if ("Stimuli" in proc[i]) {
                errors.push(...this.get_proc_stim_errors(proc[i]["Stimuli"], i, stim));
            }
        }
        
        return errors;
    },
    
    get_proc_stim_errors: function(stim_range_str, proc_index, stimuli) {
        const errors = [];
        const stim_indices = helper.parse_range_str(stim_range_str);
        
        for (let i = 0; i < stim_indices.length; ++i) {
            if (stim_indices[i] === 0 || stim_indices[i] === "") continue;
            
            if (!((stim_indices[i] - 2) in stimuli)) {
                errors.push(`In row ${proc_index + 2}, in the "Stimuli" column, the stimuli row ${stim_indices[i]} does not exist.`);
            }
        }
        
        return errors;
    }
};
