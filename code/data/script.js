document.addEventListener("click", function(e) {
    if (e.target.tagName === "BUTTON") {
        let closest_checkbox_array = e.target.closest(".checkbox-array");
        
        if (closest_checkbox_array) {
            let expanding = e.target.innerHTML === "+";
            resize_checkbox_array(closest_checkbox_array, expanding);
        }
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

function resize_checkbox_array(checkbox_array_node, is_expanding) {
    let button = checkbox_array_node.querySelector("button");
    
    button.innerHTML = is_expanding ? "-" : "+";
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
