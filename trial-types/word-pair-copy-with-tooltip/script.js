function validate_input() {
    let what_they_typed = document.querySelector("input[name='Response']").value;
    let submit_button = document.querySelector("button");
    let what_they_should_have_typed = trial.get_value("Answer", 'stimuli');
    
    if (what_they_typed !== what_they_should_have_typed) {
        trial.disables.add("incorrect copy");
        submit_button.classList.add("incorrect-input");
    } else {
        trial.disables.remove("incorrect copy");
        submit_button.classList.remove("incorrect-input");
    }
}

document.querySelector("input[name='Response']").addEventListener("input", validate_input);

validate_input();
