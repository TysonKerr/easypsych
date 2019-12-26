var settings = trial.get_value("Settings").split(",");

settings.forEach(setting => {
    setting = setting.trim().toLowerCase();
    
    if (setting === "show answer") {
        show_answer();
    }
    
    if (setting.substring(0, 5) === "width") {
        set_img_width(setting);
    }
    
    if (setting.substring(0, 6) === "height") {
        set_img_height(setting);
    }
});

function show_answer() {
    document.getElementById("answer").innerHTML = trial.get_value("Answer");
}

function set_img_width(setting) {
    const width = get_setting_value(setting);
    document.querySelector("img").style.width = width;
}

function set_img_height(setting) {
    const height = get_setting_value(setting);
    document.querySelector("img").style.height = height;
}

function get_setting_value(setting) {
    const key_val_pair = setting.split("=");
    return key_val_pair.length === 1
         ? ""
         : key_val_pair[1].trim();
}
