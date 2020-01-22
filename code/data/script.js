document.addEventListener("click", function(e) {
    if (e.target.classList.contains("expansion-button")) {
        trigger_checkbox_array_expansion(e.target);
    }
    
    if (e.target.classList.contains("js-archive")) {
        add_selected_to_archive();
    }
    
    if (e.target.classList.contains("js-de-archive")) {
        remove_selected_from_archive();
    }
});

document.addEventListener("change", function(e) {
    if (e.target.tagName === "INPUT" && e.target.type === "checkbox") {
        let closest_header = e.target.closest(".checkbox-array-header");
        let closest_array = e.target.closest(".checkbox-array");
        
        if (closest_header) {
            set_checkbox_array_values(closest_array, e.target.checked);
        }
        
        set_group_checkbox(closest_array);
    }
});

window.addEventListener("DOMContentLoaded", function() {
    document.querySelectorAll(".checkbox-array").forEach(checkbox_array_node => {
        set_group_checkbox(checkbox_array_node, false);
    });
});

function trigger_checkbox_array_expansion(expand_button) {
    let is_expanding = expand_button.innerHTML === "+";
    let checkbox_array_node = expand_button.closest(".checkbox-array");
    expand_button.innerHTML = is_expanding ? "-" : "+";
    checkbox_array_node.classList.toggle("collapsed", !is_expanding);
}

function set_checkbox_array_values(checkbox_array_node, value) {
    checkbox_array_node.querySelectorAll("input").forEach(checkbox => {
        checkbox.checked = value;
    });
}

function set_group_checkbox(checkbox_array_node, set_parents = true) {
    let checkboxes = checkbox_array_node.querySelectorAll("input[type='checkbox'][name]");
    let group_checkbox = checkbox_array_node.querySelector(".checkbox-array-header input");
    let checked = checkbox_array_node.querySelectorAll(":checked[name]");
    group_checkbox.indeterminate = false;
    
    if (checked.length === 0) {
        group_checkbox.checked = false;
    } else if (checked.length === checkboxes.length) {
        group_checkbox.checked = true;
    } else {
        group_checkbox.indeterminate = true;
    }
    
    if (set_parents) {
        let parent_checkbox_array_node = checkbox_array_node.parentElement.closest(".checkbox-array");
        
        if (parent_checkbox_array_node) set_group_checkbox(parent_checkbox_array_node);
    }
}

function add_selected_to_archive() {
    update_archive();
}

function remove_selected_from_archive() {
    update_archive(true);
}

function get_selected_users(archive = false) {
    let btn_selector = archive ? ".js-de-archive" : ".js-archive";
    let archive_btn = document.querySelector(btn_selector);
    let checkbox_array_node = archive_btn.closest(".checkbox-array");
    let selected_users = get_selected_in_checkbox_array(checkbox_array_node);
    return selected_users;
}

function get_selected_in_checkbox_array(checkbox_array_node) {
    let checked = checkbox_array_node.querySelectorAll(":checked[name]");
    return Array.from(checked).map(node => node.value);
}

function update_archive(removing = false) {
    let selected_users = get_selected_users(removing);
    if (selected_users.length < 1) return;
    
    disable_archive_buttons();
    
    send_archive_update(selected_users, removing, refresh_page);
}

function disable_archive_buttons() {
    set_archive_button_disabled_status(true);
}

function enable_archive_buttons() {
    set_archive_button_disabled_status(false);
}

function set_archive_button_disabled_status(status) {
    document.querySelectorAll(".js-archive, .js-de-archive").forEach(button => {
        button.disabled = status;
    });
}

function refresh_page() {
    window.location.reload(true);
}

function send_archive_update(users, removing, callback) {
    const http_request = new XMLHttpRequest();
    
    http_request.onreadystatechange = function() {
        if (http_request.readyState === XMLHttpRequest.DONE) {
            callback();
        }
    };
    
    http_request.open("POST", "../code/data/archive.php");
    http_request.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    http_request.send("r=" + (removing ? 1 : 0) + "&u=" + encodeURIComponent(JSON.stringify(users)));
}
