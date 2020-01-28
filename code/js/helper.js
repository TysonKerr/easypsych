"use strict";
var helper = {
    // expects an input like "2", "2,3", "0::10", or "2,3,4::8,5"
    // commas are simply separators, so "2,4" becomes [2, 4]
    // "::" is a range indicator, so "2::4" becomes [2, 3, 4]
    // "::" is used because Excel is annoying and auto converts cells
    // with "2:4" or "2-4" into other numbers to format as times or dates
    parse_range_str: function(range_str) {
        if (typeof range_str === "undefined") return [];
        
        return range_str
            .split(",")
            .map(range => range.split("::").map(str => str.trim()))
            .map(range_ends => {
                return range_ends.length === 1
                    ? (this.is_numeric(range_ends[0]) ? Number(range_ends[0]) : range_ends[0])
                    : this.range(range_ends[0], range_ends[1]);
            }).reduce((items, set) => items.concat(set), []);
    },
    
    range: function(start, end) {
        if (this.is_numeric(start) && this.is_numeric(end)) {
            return this.numeric_range(Number(start), Number(end));
        } else if (this.is_letter(start) && this.is_letter(end)) {
            return this.character_range(start, end);
        } else {
            return [start, end];
        }
    },
    
    is_numeric: function(input) {
        return (input !== "") && !isNaN(Number(input));
    },
    
    is_letter: function(input) {
        return input.length === 1 && input.match(/[a-z]/i);
    },
    
    numeric_range: function(start, end) {
        let step = end >= start ? 1 : -1;
        let numbers = [];
        
        for (let i = start; i * step <= end * step; i += step) {
            numbers.push(i);
        }
        
        return numbers;
    },
    
    character_range: function(start, end) {
        return this.numeric_range(start.charCodeAt(0), end.charCodeAt(0))
            .map(char_code => String.fromCharCode(char_code));
    },
    
    get_value(values, name) {
        if (0 in values.stimuli
            && name in values.stimuli[0]
        ) {
            if (values.stimuli[0][name] === ""
                && name in values.procedure
            ) {
                return values.procedure[name];
            } else {
                return values.stimuli[0][name];
            }
        } else if (name in values.procedure) {
            return values.procedure[name]
        }
    },
    
    get_current_date: function() {
        return new Date().toString();
    },
    
    get_timestamp_from_date: function(date) {
        return new Date(date).valueOf();
    },
};
