"use strict";
trial.onload = function() {
    let last_submit_date = trial.get_last_response_value("Exp_Date");
    let last_submit_timestamp = helper.get_timestamp_from_date(last_submit_date);
    let seconds_since_last_submit = (Date.now() - last_submit_timestamp) / 1000;
    let delay_required = trial.get_value("Settings");
    let delay_left = delay_required - seconds_since_last_submit;
    
    if (delay_left <= 0) {
        trial.submit();
    } else {
        let time_left_display = document.querySelector("#time-to-return");
        
        if (time_left_display) time_left_display.textContent = format_time(delay_left);
    }
};

function format_time(seconds) {
    let days = Math.floor(seconds / 86400);
    seconds %= 86400;
    let hours = Math.floor(seconds / 3600);
    seconds %= 3600;
    let minutes = Math.floor(seconds / 60);
    seconds %= 60;
    seconds = Math.min(59, Math.ceil(seconds));
    
    if (days > 0) {
        return format_time_units(days, "day", hours, "hour");
    } else if (hours > 0) {
        return format_time_units(hours, "hour", minutes, "minute");
    } else if (minutes > 0) {
        return format_time_units(minutes, "minute", seconds, "second");
    } else {
        return format_time_units(seconds, "second", 0, "hour");
    }
}

function format_time_units(amount_1, unit_1, amount_2, unit_2) {
    let string = `${amount_1} ${unit_1}`;
    
    if (amount_1 > 1) string += "s";
    
    if (amount_2 > 0) {
        string += ` and ${amount_2} ${unit_2}`;
        
        if (amount_2 > 1) string += "s";
    }
    
    return string;
}
