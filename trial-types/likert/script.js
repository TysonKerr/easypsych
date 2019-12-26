var descriptions_node = document.getElementById("description-container");
var inputs_node = document.getElementById("likert-input-container");

descriptions_node.innerHTML = get_descriptions_html();
inputs_node.innerHTML = get_likert_inputs_html();

function get_descriptions_html() {
    return parse_input_as_range("Descriptions", desc => `<span>${desc}</span>`);
}

function get_likert_inputs_html() {
    return parse_input_as_range("Choices", choice => {
        return `<label><input type="radio" name="Response" value="${choice}" required><span>${choice}</span></label>`
    });
}

function parse_input_as_range(input_name, callback_for_range_map) {
    return helper.parse_range_str(
            trial.get_value(input_name)
        ).map(callback_for_range_map)
        .join("");
}
