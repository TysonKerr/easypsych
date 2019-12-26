function get_header_row(possible_values) {
    let first_row =  "<tr> <td></td>";

    for (let i = 1; i <= cues.length; ++i) {
        first_row += "<td>" + i + "</td>";
    }

    return first_row += "</tr>";
}

function get_input_rows(cues) {
    let rows = "";
    
    cues.forEach((cue, cue_index) => {
        rows += "<tr>"
                + "<td>" + cue + "</td>"
                + get_input_cells_html(cues.length, cue_index)
            + "</tr>";
    });
    
    return rows;
}

function get_input_cells_html(number_of_inputs, current_index) {
    let name = "Cue_" + current_index + "_Rank";
    let html = "";
    
    for (let i = 1; i <= number_of_inputs; ++i) {
        html += `<td><label><input name='${name}' value='${i}' type='radio' required></label></td>`;
    }
    
    return html;
}

var cues = trial.get_all_in_column("Cue");

var table_html = "<table id='ranking-table'>"
    + get_header_row(cues.length)
    + get_input_rows(cues)
    + "</table>";

document.getElementById("ranking-container").innerHTML = table_html;

document.getElementById("ranking-table").addEventListener("input", function(input_event) {
    let clicked_radio_button = input_event.target;
    
    this.querySelectorAll("input").forEach(input => {
        if (input !== clicked_radio_button
            && input.value === clicked_radio_button.value
            && input.checked
        ) {
            input.checked = false;
        }
    });
});
