trial.onload = () => 
    trial.wait_for_data_submission_to_complete()
    .then(show_complete_message);

function show_complete_message() {
    document.getElementById("data-submission-pending").style.display = "none";
    document.getElementById("data-submission-complete").style.display = "block";
}
