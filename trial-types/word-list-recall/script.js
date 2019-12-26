trial.custom_scoring = function(response_row) {
    let resp_rows = [];
    let resp_words = response_row["Response"]
        .split(/[\s,;]+/).filter(word => word !== "")
        .map(word => word.toLowerCase());
    
    trial.values.stimuli.forEach(stim_row => {
        let resp_row = {};
        
        for (let column in stim_row) {
            resp_row[`Stim_${column}`] = stim_row[column];
        }
        
        if (resp_words.indexOf(stim_row["Answer"]) !== -1) {
            resp_row["Recalled"] = 1;
            resp_row["Recall_Order"] = resp_words.indexOf(stim_row["Answer"]);
        } else {
            resp_row["Recalled"] = 0;
            resp_row["Recall_Order"] = -1;
        }
        
        resp_rows.push(resp_row);
    });
    
    return resp_rows;
}
