trial.fetch_csv("media/surveys/" + trial.get_value("Cue"))
     .then(survey => display_survey(survey));

function display_survey(survey) {
    let html = "";
    
    for (let i = 0; i < survey.length;) {
        let question_set = [];
        let type = survey[i]["Type"];
        
        for (; i < survey.length && survey[i]["Type"] === type; ++i) {
            question_set.push(survey[i]);
        }
        
        html += question_types[type](question_set);
    }
    
    document.getElementById("survey-container").innerHTML = html;
}

function create_standard_question(question, input) {
    return `<div class="standard-question-row"><span>${question}</span><span>${input}</span></div>`;
}

function get_input_name(name) {
    return name.trim()
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;")
         .replace(/\[/g, "")
         .replace(/]/g, "")
         .replace(/\./g, "_")
         .replace(/ /g, "_");
}

var question_types = {};

question_types["textbox"] = function(question_set) {
    return question_set.map(q => {
        let name = get_input_name(q["Name"]);
        
        return create_standard_question(q["Question"], `<input name="${name}" type="text">`);
    }).join("");
};

question_types["likert"] = function(question_set) {
    return question_set.map(q => {
        let name = get_input_name(q["Name"]);
        
        let values = helper.parse_range_str(q["Values"]);
        let inputs = `<div class='likert-container' style='--values: ${values.length};'>` 
            + values.map(value =>
                `<label><input type='radio' name='${name}' value='${value}'><span>${value}</span></label>`
            ).join("")
            + "</div>";
        
        return create_standard_question(q["Question"], inputs);
    }).join("");
};
