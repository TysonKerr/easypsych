"use strict";
var Experiment = function(container, resources) {
    let loaded_resources = this.loader.load(resources);
    this.settings = loaded_resources.settings;
    this.data = loaded_resources.data;
    this.proc_index = loaded_resources.proc_index;
    this.trial_number = loaded_resources.trial_number;
    this.post_trial_level = 0;
    this.trial = null;
    
    this.trial_display = new this.Trial_Display(
        container,
        loaded_resources.trial_template,
        loaded_resources.trial_types
    );
    
    this.validator.validate(this);
    
    this.add_event_listeners();
};

Experiment.prototype = {
    /* below are examples of the properties an experiment would have
    data: {
        condition: [],
        procedure: [],
        stimuli: [],
        responses: [],
        shuffle_seed: "rand_string"
    },
    trial: null,
    trial_number: 0,
    proc_index: 0,
    post_trial_level: 0,
    trial_display: {},
    validator: {},
    settings: {}
    */
    
    start_current_trial: function() {
        this.trial_display.start(this.get_trial_values(this.proc_index, this.post_trial_level));
    },
    
    get_trial_values: function(proc_index, post_trial_level) {
        if (!this.position_exists_in_proc(proc_index, post_trial_level)) return false;
        
        let proc_values = this.data.procedure[proc_index][post_trial_level];
        let stim_indices = this.get_stimuli_indices(proc_values["Stimuli"]);
        let stim_values = [];
        
        for (let i = 0; i < stim_indices.length; ++i) {
            if (stim_indices[i] in this.data.stimuli) {
                stim_values.push(this.data.stimuli[stim_indices[i]]);
            }
        }
        
        return {
            procedure: [proc_values],
            stimuli: stim_values,
        };
    },
    
    get_stimuli_indices: function(stimuli_range) {
        return helper.parse_range_str(stimuli_range)
            .map(item => parseInt(item) - 2)
            .filter(num => !isNaN(num));
    },
    
    position_exists_in_proc: function(proc_index, post_trial_level) {
        return proc_index in this.data.procedure
            && post_trial_level in this.data.procedure[proc_index];
    },
    
    receive_trial_submission: function(json_responses) {
        let exp_command = this.data_submission.receive(json_responses, this.data.responses, this);
        
        this.trial = null;
        this.set_index_to_next_trial(exp_command);
        this.start_current_trial();
    },
    
    set_index_to_next_trial: function(exp_command) {
        if (exp_command.substring(0, 14) === "mod proc index") {
            this.use_exp_command_to_set_next_proc_index(exp_command);
        } else {
            this.set_proc_index_to_next_available_trial();
        }
    },
    
    use_exp_command_to_set_next_proc_index: function(exp_command) {
        let [new_index, is_relative] = this.parse_mod_proc_index(exp_command);
        
        let new_proc_index = is_relative ? this.proc_index + new_index : new_index;
        
        this.change_trial(new_proc_index);
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
    
    change_trial: function(new_proc_index) {
        this.data_submission.queue_response_submission(this.data.responses[this.trial_number], new_proc_index);
        this.post_trial_level = 0;
        this.proc_index = Math.min(Math.max(new_proc_index, 0), this.data.procedure.length);
        ++this.trial_number;
    },
    
    set_proc_index_to_next_available_trial: function() {
        ++this.post_trial_level;
        
        if (!(this.post_trial_level in this.data.procedure[this.proc_index])
            || this.data.procedure[this.proc_index][this.post_trial_level]["Trial Type"] === ""
        ) {
            this.change_trial(this.proc_index + 1);
        }
    },
    
    fetch_csv: function(filename) {
        return fetch("code/php/ajax-fetch-csv.php?f=" + encodeURIComponent(filename))
            .then(resp => resp.text()).then(text => {
                let json_data;
                
                try {
                    json_data = JSON.parse(text);
                } catch(error) {
                    console.error(
                        error
                        + "\ncannot parse JSON data when fetching csv, received following from server:\n"
                        + text
                    );
                }
                
                return json_data;
            })
            .then(csv_data => CSV.build(csv_data, filename));
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
            trial_values = {stimuli: [], procedure: [{"Trial Type": "end-of-experiment"}]};
        }
        
        let trial_type = this.trial_types[trial_values.procedure[0]["Trial Type"]];
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
    load: function(exp_resources) {
        const loaded = {
            trial_template: exp_resources.trial_template,
            trial_types: exp_resources.trial_types,
            data: this.load_exp_data(exp_resources.exp_data),
            settings: exp_resources.settings
        };
        
        this.set_loaded_trial_and_proc_index(loaded);
        
        return loaded;
    },
    
    set_loaded_trial_and_proc_index: function(loaded) {
        if (loaded.data.responses.length === 0) {
            loaded.trial_number = 0;
            loaded.proc_index = 0;
        } else {
            const last_response_set = loaded.data.responses[loaded.data.responses.length - 1];
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
        
        data.stimuli  = CSV.build(data.csvs, 'experiment/stimuli/' + data.condition['Stimuli'],      data.shuffle_seed + "-stim");
        let proc_file = CSV.build(data.csvs, 'experiment/procedures/' + data.condition['Procedure'], data.shuffle_seed + "-proc");
        
        data.procedure = this.make_procedure(proc_file);
        data.responses = this.read_responses(raw_data.responses);
        
        this.freeze_data(data);
        
        return data;
    },
    
    make_procedure: function(proc_csv) {
        let procedure = [];
        
        for (let i = 0; i < proc_csv.length; ++i) {
            let trials = this.split_proc_row_into_trials(proc_csv[i]);
            this.make_post_trials_inherit_earlier_trial_values(trials);
            procedure.push(trials);
        }
        
        return procedure;
    },
    
    split_proc_row_into_trials: function(proc_row) {
        let trials = [];
        
        for (let col in proc_row) {
            let post = col.match(/^Post ([0-9]+)/);
            let index = post ? Number(post[1]) : 0;
            let header = post ? col.substring(5 + post[1].length).trim() : col;
            
            if (!(index in trials)) trials[index] = {};
            
            trials[index][header] = proc_row[col];
        }
        
        return trials;
    },
    
    make_post_trials_inherit_earlier_trial_values: function(trials) {
        let levels = Object.keys(trials);
        
        for (let i = 0; i < levels.length - 1; ++i) {
            for (let col in trials[levels[i]]) {
                if (!(col in trials[levels[i + 1]])) trials[levels[i + 1]][col] = trials[levels[i]][col];
            }
        }
    },

    freeze_data: function(data) {
        Object.freeze(data.condition);
        data.stimuli.forEach(row => Object.freeze(row));
        
        data.procedure.forEach(set => {
            set.forEach(row => Object.freeze(row));
            Object.freeze(set);
        });
        
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
    
    receive: function(json_responses, exp_responses, {trial_number, proc_index, post_trial_level}) {
        let response_set = this.get_response_set(exp_responses, trial_number);
        let responses = JSON.parse(json_responses);
        let exp_command = "Exp_Command" in responses[0] ? responses[0]["Exp_Command"] : "";
        
        this.add_info_to_responses(responses, proc_index, trial_number);
        this.format_responses(responses, post_trial_level);
        this.merge_responses(response_set, responses);
        
        return exp_command;
    },
    
    get_response_set: function(exp_responses, trial_number) {
        if (!(trial_number in exp_responses)) {
            exp_responses[trial_number] = [];
        }
        
        return exp_responses[trial_number];
    },
    
    merge_responses: function(response_set, responses) {
        responses.forEach((row, i) => {
            if (i in response_set) {
                Object.assign(response_set[i], row);
            } else {
                response_set.push(row);
            }
        });
    },
    
    add_info_to_responses: function(responses, proc_index, trial_number) {
        let date = helper.get_current_date();
        
        responses.forEach(row => {
            row["Exp_Proc_Index"] = proc_index;
            row["Exp_Date"] = date;
            row["Exp_Trial_Number"] = trial_number;
        });
    },
    
    format_responses: function(responses, post_level) {
        if (post_level > 0) {
            responses.forEach(row => Object.keys(row).forEach(col => {
                row[`Post_${post_level}_${col}`] = row[col];
                delete row[col];
            }));
        }
        
        responses.forEach(row => {
            for (let col in row) {
                row[col] = String(row[col]);
            }
        });
    },
    
    queue_response_submission: function(response_set, next_proc_index) {
        response_set.forEach(row => {
            row["Exp_Next_Proc_Index"] = next_proc_index;
            Object.freeze(row);
        });
        
        Object.freeze(response_set); // cant change responses once they have been submitted to the server
        this.response_submission_queue.push(response_set);
        
        if (this.is_ready_to_submit_responses) {
            this.submit_responses();
        }
    },
    
    submit_responses: function() {
        this.is_ready_to_submit_responses = false;
        
        let responses = [];
        
        for (let i = 0; i < this.response_submission_queue.length; ++i) {
            responses.push(this.response_submission_queue[i]);
        }
        
        let request = new XMLHttpRequest();
        
        request.onreadystatechange = () => {
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
        };
        
        request.open("POST", "code/php/ajax-responses.php");
        request.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        request.send('responses=' + encodeURIComponent(JSON.stringify(
            responses.reduce((rows, row_set) => rows.concat(row_set), [])
        )));
    },
    
    clear_responses_from_queue: function(responses) {
        for (let i = 0; i < responses.length; ++i) {
            let index = this.response_submission_queue.indexOf(responses[i]);
            this.response_submission_queue.splice(index, 1);
        }
        
        this.is_ready_to_submit_responses = true;
        
        if (this.response_submission_queue.length > 0) {
            this.submit_responses();
        }
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
        const trial_types = experiment.trial_display.trial_types;
        const errors = [];
        
        if (proc.length === 0) return; // nothing to validate
        
        if (!(0 in proc[0]) || typeof proc[0][0]["Trial Type"] === "undefined") {
            errors.push('Missing the required "Trial Type" column');
        }
        
        let next_post_level = 1;
        
        proc[0].forEach((trial, post_trial_level) => {
            if (post_trial_level === 0) return;
            
            if (post_trial_level !== next_post_level) {
                let msg = "Post trials are not sequential. They must start at 1, and have at least 1 column at each level.\nMissing columns:";
                
                for (let i = next_post_level; i < post_trial_level; ++i) {
                    msg += "\n  Post " + i + " (something)";
                }
                
                errors.push(msg);
            }
            
            next_post_level = post_trial_level + 1;
        });
        
        for (let i = 0; i < proc.length; ++i) {
            proc[i].forEach((trial, post_level) => {
                if (post_level > 0 && trial["Trial Type"] === "") return;
                if (!("Trial Type" in trial)) return; // we validated for this earlier, so no need to spam the error messages
                
                let orig_column = post_level === 0 ? "Trial Type" : `Post ${post_level} Trial Type`;
                let error_start = `In row ${i + 2}, under column "${orig_column}"`;
                
                if (!(trial["Trial Type"] in trial_types)) {
                    errors.push(`${error_start}, the type "${trial["Trial Type"]}" does not exist.`);
                }
                
                if ("Stimuli" in trial) {
                    let stim_indices = helper.parse_range_str(trial["Stimuli"]);
                    
                    for (let j = 0; j < stim_indices.length; ++j) {
                        if (stim_indices[j] === 0) continue;
                        
                        let index = stim_indices[j] - 2;
                        
                        if (!(index in stim)) {
                            let msg = post_level === 0 ? 'in the "Stimuli" column' : `for post trial ${post_level}`;
                            errors.push(`In row ${i + 2}, ${msg}, the stimuli row ${stim_indices[j]} does not exist.`);
                        }
                    }
                }
            });
        }
        
        return errors;
    }
};

var CSV = {
    build: function(src_files, filename, shuffle_seed) {
        let csv = [];
        let dir = filename.substring(0, filename.lastIndexOf("/"));
        
        if (dir.length > 0) dir += "/";
        
        src_files[filename].forEach(row => {
            if ("Subfile" in row && row["Subfile"] !== "") {
                let sub_csv = this.build(src_files, dir + row["Subfile"], false);
                this.make_csv_inherit_row_values(sub_csv, row);
                
                for (let i = 0; i < sub_csv.length; ++i) csv.push(sub_csv[i]);
            } else {
                csv.push(this.copy_row(row));
            }
        });
        
        this.standardize_csv(csv);
        
        if (shuffle_seed !== false) {
            this.shuffle(csv, shuffle_seed);
        }
        
        return csv;
    },
    
    make_csv_inherit_row_values: function(csv, row) {
        for (let col in row) {
            if (row[col] === "") continue;
            if (col === "Subfile") continue;
            
            let val = row[col];
            
            if (val.substring(0, 7) === "append:") {
                for (let i = 0; i < csv.length; ++i)
                    csv[i][col] += val.substring(7).trim();
            } else if (val.substring(0, 8) === "prepend:") {
                for (let i = 0; i < csv.length; ++i)
                    csv[i][col] = val.substring(8).trim() + csv[i][col];
            } else if (val.substring(0, 4) === "add:") {
                for (let i = 0; i < csv.length; ++i)
                    csv[i][col] = String(Number(val.substring(4)) + Number(csv[i][col]));
            } else {
                for (let i = 0; i < csv.length; ++i)
                    csv[i][col] = val;
            }
        }
    },
    
    standardize_csv: function(csv) {
        let columns = {};
        
        for (let i = 0; i < csv.length; ++i) {
            for (let column in csv[i]) {
                columns[column] = true;
            }
        }
        
        for (let i = 0; i < csv.length; ++i) {
            for (let column in columns) {
                if (!(column in csv[i])) {
                    csv[i][column] = "";
                } else {
                    csv[i][column] = String(csv[i][column]);
                }
            }
        }
        
        return csv;
    },
    
    copy_row: function(row) { return Object.assign({}, row); },
    
    shuffle: function(csv, shuffle_seed) {
        if (!(0 in csv) || !("Shuffle" in csv[0])) return csv; // nothing to shuffle, dont waste time
        
        let seed = typeof shuffle_seed === "undefined" || String(shuffle_seed) === ""
                 ? String(Math.random())
                 : String(shuffle_seed);
        
        let random = new Math.seedrandom(seed);
        
        let shuffles = {};
        
        for (let i = 0; i < csv.length; ++i) {
            let shuffle_val = csv[i]["Shuffle"];
            
            if (shuffle_val === "" || shuffle_val.toLowerCase() === "off") continue;
            
            if (!(csv[i]["Shuffle"] in shuffles)) {
                shuffles[csv[i]["Shuffle"]] = [];
            }
            
            shuffles[shuffle_val].push(i);
        }
        
        for (let shuffle_val in shuffles) {
            for (let i = shuffles[shuffle_val].length - 1; i > 0; --i) {
                let j = Math.floor(random() * (i + 1));
                
                if (i !== j) {
                    let row_i = shuffles[shuffle_val][i];
                    let row_j = shuffles[shuffle_val][j];
                    let temp = csv[row_i];
                    csv[row_i] = csv[row_j];
                    csv[row_j] = temp;
                }
            }
        }
        
        return csv;
    },
};
