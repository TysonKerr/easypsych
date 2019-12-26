function start_question(question_container) {
    question_container.style.display = "block";
    document.querySelector("form").noValidate = true;
    
    question_container.querySelectorAll(".temp-disabled").forEach(req => {
        req.classList.remove("temp-disabled");
        req.disabled = false;
    });
}

document.querySelector("form").addEventListener("submit", function(event) {
    let form = document.querySelector("form");
    
    if (!form.checkValidity()) {
        event.preventDefault();
        form.noValidate = false;
        form.reportValidity();
        return;
    }
    
    let remaining_questions = document.querySelectorAll(".question-container:not(.answered)");
    
    if (remaining_questions.length > 1) {
        remaining_questions[0].style.display = "none";
        remaining_questions[0].classList.add("answered");
        setTimeout(() => start_question(remaining_questions[1]), 100);
        event.preventDefault();
    }
});

document.querySelectorAll(":required:not(:disabled").forEach(req => {
    req.classList.add("temp-disabled");
    req.disabled = true;
});

start_question(document.querySelector(".question-container"));
