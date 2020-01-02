"use strict";
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
        if (!(0 in csv)) return csv; // nothing to shuffle, dont waste time
        
        const random = this.get_seeded_random(shuffle_seed);
        
        for (let col in csv[0]) {
            this.shuffle_by_column(csv, col, random);
        }
        
        return csv;
    },
    
    shuffle_by_column: function(csv, shuffle_col, random) {
        const settings = this.get_shuffle_settings(shuffle_col);
        
        if (!settings) return; // in this case, col is not a shuffle column
        
        const partitions = this.get_csv_partitions(csv, settings.within);
        const target_columns = this.get_target_columns(Object.keys(csv[0]), settings.targets);
        const shuffle = settings.type === "block" ? this.shuffle_block : this.shuffle_rows;
        
        // the shuffle column should always include itself
        if (!target_columns.includes(shuffle_col)) target_columns.push(shuffle_col);
        
        Object.values(partitions).forEach(partition => 
            shuffle.call(this, partition, shuffle_col, target_columns, random)
        );
    },
    
    shuffle_block: function(rows) {
        
    },
    
    shuffle_rows: function(rows, shuffle_col, target_columns, random) {
        const row_groups = this.group_row_indices_by_shuffle_val(rows, shuffle_col);
        
        for (let shuffle_val in row_groups) {
            for (let i = row_groups[shuffle_val].length - 1; i > 0; --i) {
                let j = Math.floor(random() * (i + 1));
                
                if (i !== j) {
                    let row_i = row_groups[shuffle_val][i];
                    let row_j = row_groups[shuffle_val][j];
                    
                    for (let k = 0; k < target_columns.length; ++k) {
                        let col = target_columns[k];
                        let temp = rows[row_i][col];
                        rows[row_i][col] = rows[row_j][col];
                        rows[row_j][col] = temp;
                    }
                }
            }
        }
    },
    
    group_row_indices_by_shuffle_val: function(rows, shuffle_col) {
        const index_groups = {};
        
        for (let i = 0; i < rows.length; ++i) {
            const shuffle_val = String(rows[i][shuffle_col]);
            const val_lower = shuffle_val.toLowerCase();
            
            if (val_lower === "" || val_lower === "off" || val_lower === "no") continue;
            
            if (!(shuffle_val in index_groups)) {
                index_groups[shuffle_val] = [];
            }
            
            index_groups[shuffle_val].push(i);
        }
        
        return index_groups;
    },
    
    get_target_columns: function(columns, targets) {
        if (targets === null) return columns.slice();
        
        const target_columns = [];
        
        targets.split(",").forEach(range => {
            if (range.includes("::")) {
                target_columns.push(...this.get_column_range(columns, range));
            } else {
                target_columns.push(this.get_column_by_selector(columns, range));
            }
        });
        
        return target_columns.filter((col, i, arr) => arr.indexOf(col) === i);
    },
    
    get_column_range(columns, range_str) {
        const selected_columns = [];
        let end_points = range_str.split("::");
        let start = this.get_column_by_selector(columns, end_points[0]);
        let end   = this.get_column_by_selector(columns, end_points[1]);
        
        let start_index = columns.indexOf(start);
        let end_index   = columns.indexOf(end);
        
        if (start_index > end_index) {
            let temp = start_index;
            start_index = end_index;
            end_index = temp;
        }
        
        for (let i = start_index; i <= end_index; ++i) {
            selected_columns.push(columns[i]);
        }
        
        return selected_columns;
    },
    
    get_csv_partitions(csv, partition_selector) {
        if (partition_selector === null) return {csv: csv.slice()};
        
        const columns = Object.keys(csv[0]);
        const partition_column = get_column_by_selector(columns, partition_selector);
        const partitions = {};
        
        for (let i = 0; i < csv.length; ++i) {
            let partition_name = csv[i][partition_column];
            let lower_val = partition_name.toLowerCase();
            
            if (lower_val !== "" && lower_val !== "off" && lower_val === "no") { 
                if (typeof partitions[partition_name] === "undefined") {
                    partitions[partition_name] = [];
                }
                
                partitions[partition_name].push(csv[i]);
            }
        }
        
        return partitions;
    },
    
    get_column_by_selector: function(columns, selector) {
        // convert numbers to num - 1, so that human-readable "1" becomes the first column
        // convert letters like Excel columns, so "A" is 0, "B" is 1, "AA" is 27
        // columns can also be written out in full, so column "Trial Type" would work too
        const raw_selector_search = columns.indexOf(selector);
        
        if (raw_selector_search > -1) return columns[raw_selector_search];
        
        let index;
        
        if (helper.is_numeric(selector)) {
            index = selector - 1;
        }
        
        if (/^[a-z]+$/.test(selector)) {
            index = this.get_index_from_column_label(selector);
        }
            
        if (!(index in columns)) {
            throw `Column selector "${selector}" was identified as column `
                + `number "${index}", but there are only ${columns.length}`
                + ` columns to choose from.`;
        } else {
            return columns[index];
        }
    },
    
    get_index_from_column_label: function(label) {
        // converts "a" to 0, "c" to 2, "aa" to 26, "ac" to 28
        let index = -1;
        let place = 26 ** (label.length - 1);
        
        for (let i = 0; i < label.length; ++i) {
            index += (label.charCodeAt(i) - 96) * place;
            place /= 26;
        }
        
        return index;
    },
    
    get_seeded_random: function(shuffle_seed) {
        let seed = typeof shuffle_seed === "undefined" || String(shuffle_seed) === ""
                 ? String(Math.random())
                 : String(shuffle_seed);
        
        return new Math.seedrandom(seed);
    },
    
    get_shuffle_settings: function(header) {
        if (header.substring(0, 7) === "Shuffle") {
            return this.parse_shuffle(header);
        } else {
            return false;
        }
    },
    
    parse_shuffle: function(header) {
        // remove multiple spaces, because that is always a typo and annoyingly hard to see
        header = header.replace(/ +/g, " ");
        const header_split = header.split(";").map(part => part.trim());
        const shuffle_type = this.get_shuffle_type(header_split.shift());
        const [targets, within] = this.get_shuffle_targets_and_within(header_split);
        
        return {type: shuffle_type, targets: targets, within: within};
    },
    
    get_shuffle_type: function(shuffle_header) {
        if (shuffle_header.substring(0, 5).toLowerCase() === "block") {
            return "block";
        } else {
            return "row";
        }
    },
    
    get_shuffle_targets_and_within: function(header_parts) {
        let targets = null,
            within = null;
        
        for (let i = 0; i < header_parts.length; ++i) {
            if (header_parts[i].substring(0, 7).toLowerCase() === "affects") {
                targets = header_parts[i].substring(7).trim();
            } else if (header_parts[i].substring(0, 6).toLowerCase() === "within") {
                within = header_parts[i].substring(6).trim();
            }
        }
        
        return [targets, within];
    },
    
    parse_column_selector: function(selector, headers) {
        let indices = helper.parse_range_str(selector);
        // convert numbers from human to machine (i.e., make the first number 0 instead of 1)
        return indices.map(index => {
            if (helper.is_numeric(index)) return Number(index) - 1;
        });
    }
};
