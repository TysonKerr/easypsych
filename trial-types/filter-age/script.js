trial.onload = function() {
    let age = trial.get_last_response_value("Age");
    
    if (age >= 18) trial.submit();
};
