"use strict";

const shuffle_demos = {
    csvs: [],
    container: null,
    files: {},
    
    init: function() {
        this.premade_container = document.getElementById("premade-demo-container");
        this.file_container = document.getElementById("file-demo-container");
        const cell_info_contents = document.getElementById("cell-info-contents");
        
        document.addEventListener("click", e => {
            if (e.target.classList.contains("reshuffle-button")) {
                this.reshuffle_demo(e.target.closest(".shuffle-demo"));
            }
        });
        
        document.addEventListener("mouseover", e => {
            this.hide_header_info();
            
            if (e.target.classList.contains("shuffle-cell")) {
                cell_info_contents.textContent = e.target.textContent;
                
                if (e.target.classList.contains("shuffle-header")) {
                    this.display_header_info(e.target);
                }
            } else if (e.target.closest("table") === null) {
                cell_info_contents.textContent = "";
            }
        });
        
        document.getElementById("hide-demos-btn").addEventListener("click", e => {
            if (e.target.textContent === "Hide Demos") {
                e.target.textContent = "Show Demos";
                
                document.querySelectorAll(".premade-demo").forEach(demo => {
                    demo.classList.add("hidden");
                });
            } else {
                e.target.textContent = "Hide Demos";
                
                document.querySelectorAll(".premade-demo").forEach(demo => {
                    demo.classList.remove("hidden");
                });
            }
        });
        
        document.getElementById("file-select").addEventListener("input", async e => {
            const file = e.target.value;
            
            document.querySelectorAll(".file-demo").forEach(
                demo => demo.classList.add("hidden")
            );
            
            if (file in this.files) {
                const demos = document.querySelectorAll(".shuffle-demo");
                demos[this.files[file]].classList.remove("hidden");
            } else {
                e.target.disabled = true;
                let csv = await CSV.fetch(file);
                e.target.disabled = false;
                
                const csv_index = this.create_shuffle_demo(csv);
                this.files[file] = csv_index;
            }
        });
        
        document.getElementById("file-select").querySelector("option").selected = true;
    },
    
    display_header_info: function(header) {
        document.getElementById("header-info").classList.add("shown");
        const type = document.getElementById("shuffle-type");
        const targets = document.getElementById("shuffle-targets");
        const within = document.getElementById("shuffle-within");
        const shuffle_settings = CSV.get_shuffle_settings(header.textContent);
        
        if (shuffle_settings === false) {
            type.textContent = "not a shuffle column";
            targets.textContent = "";
            within.textContent = "";
        } else {
            const headers = this.get_headers(header);
            type.textContent = shuffle_settings.type;
            targets.innerHTML = CSV.get_target_columns(headers, shuffle_settings.targets)
                                .map(target => "<span class='column-name'>" + target + "</span>")
                                .join(", ");
            within.innerHTML = shuffle_settings.within === null
                               ? "not constrained"
                               : "<span class='column-name'>" + shuffle_settings.within + "</span>";
        }
    },
    
    hide_header_info: function() {
        document.getElementById("header-info").classList.remove("shown");
    },
    
    get_headers: function(header) {
        return Array.from(header.closest("tr").querySelectorAll("th"))
            .map(th => th.textContent);
    },
    
    add: function(csv_lines, added_html = "") {
        this.create_shuffle_demo(this.make_csv(csv_lines), added_html, true);
    },
    
    make_csv: function(csv_lines) {
        const csv = [];
        const headers = csv_lines[0];
        
        for (let i = 1; i < csv_lines.length; ++i) {
            const row = {};
            
            for (let j = 0; j < headers.length; ++j) {
                row[headers[j]] = (j in csv_lines[i]) ? csv_lines[i][j] : "";
            }
            
            csv.push(row);
        }
        
        return csv;
    },
    
    create_shuffle_demo: function(csv, added_html = "", is_premade = false) {
        const csv_index = this.csvs.length;
        const unshuffled_csv = this.get_csv_clone_with_contents_wrapped(csv, csv_index);
        this.csvs.push(unshuffled_csv);
        const shuffled_csv = this.clone_csv(unshuffled_csv);
        CSV.shuffle(shuffled_csv);
        this.add_demo_html(csv_index, unshuffled_csv, shuffled_csv, added_html, is_premade);
        return csv_index;
    },
    
    get_csv_clone_with_contents_wrapped: function(csv, csv_id) {
        const clone = this.clone_csv(csv);
        const headers = Object.keys(clone[0]);
        
        for (let y = 0; y < clone.length; ++y) {
            for (let x = 0; x < headers.length; ++x) {
                clone[y][headers[x]] = new Cell(clone[y][headers[x]], x, y, csv_id);
            }
        }
        
        return clone;
    },
    
    clone_csv: function(csv) {
        const clone = [];
        
        for (let i = 0; i < csv.length; ++i) {
            let row = {};
            
            for (let col in csv[i]) {
                row[col] = csv[i][col].clone ? csv[i][col].clone() : csv[i][col];
            }
            
            clone.push(row);
        }
        
        return clone;
    },
    
    add_demo_html: function(csv_id, unshuffled_csv, shuffled_csv, added_html, is_premade) {
        const container = is_premade ? this.premade_container : this.file_container;
        const demo_class = "shuffle-demo" + (is_premade ? " premade-demo" : " file-demo");
    
        container.insertAdjacentHTML("beforeend", 
            "<div class='" + demo_class + "' data-csv='" + csv_id + "'>"
                + "<div class='shuffle-description'>" + added_html + "</div>"
                + "<div class='csv-pair-container'><div><div>"
                + this.get_csv_html(unshuffled_csv, csv_id)
                + "</div></div><div><div>"
                + this.get_csv_html(shuffled_csv, csv_id)
                + "</div></div></div>"
                + "<div class='reshuffle-button-container'><button class='reshuffle-button' type='button'>Reshuffle</button></div>"
            + "</div>"
        );
    },
    
    get_csv_html: function(csv, csv_id) {
        const headers = Object.keys(csv[0]);
        
        let html = "<table> <thead> <tr>"
            + headers.map((header, i) => 
                `<th><span class="shuffle-cell c-${csv_id}-${i}-h shuffle-header">${header}</span></th>`
            ).join("")
            + "</tr> </thead> <tbody>";
        
        for (let i = 0; i < csv.length; ++i) {
            html += "<tr> <td>" + headers.map(header => csv[i][header].get_wrapped_value()).join("</td> <td>") + "</td> </tr>";
        }
        
        html += "</tbody> </table>";
        return html;
    },
    
    reshuffle_demo: function(demo_element) {
        const csv_index = demo_element.dataset.csv;
        const csv_shuffled = this.clone_csv(this.csvs[csv_index]);
        CSV.shuffle(csv_shuffled);
        const shuffled_container = demo_element.querySelector(".csv-pair-container > div:last-child > div");
        shuffled_container.innerHTML = this.get_csv_html(csv_shuffled, csv_index);
    }
};

function Cell(value, x, y, class_prefix) {
    this.value = value;
    this.x = x;
    this.y = y;
    this.class_prefix = class_prefix;
}

Cell.prototype = {
    toString: function() { return this.value; },
    get_wrapped_value: function() {
        return `<span class='shuffle-cell c-${this.class_prefix}-${this.x}-${this.y}'>`
                + this.value.replace(/&/g, "&amp;").replace(/</g, "&lt;")
                + "</span>";
    },
    clone: function() {
        return new Cell(this.value, this.x, this.y, this.class_prefix);
    }
};

const cell_colors = {
    selected_cell_classes: [],
    cell_class_lookup: {},
    input: null,
    selecting: 0, // 1 for selecting, -1 for deselecting
    selecting_bgc: "rgb(126, 190, 254)",
    selecting_outline: "2px solid #be0000",
    hover_class: null,
    hovering_color: "rgb(53, 225, 104)",
    cell_overlay: null,
    
    init: function() {
        this.input = document.getElementById("cell-color-input");
        this.sheet = document.getElementById("cell-styles").sheet;
        this.rules = this.sheet.cssRules || this.sheet.rules;
        this.cell_overlay = document.getElementById("cell-overlay");
        
        this.input.addEventListener("input", e => this.set_color(e.target.value));

        document.addEventListener("mousedown", e => {
            if (e.target.classList.contains("shuffle-cell")) {
                // they clicked a cell
                this.process_cell_mousedown(e.target, e.ctrlKey);
                this.set_cell_overlay(e.target);
            } else if (e.ctrlKey) {
                // they didnt click a cell, but they were holding ctrl
                this.selecting = 1;
            } else if (e.target.closest("table") !== null) {
                // they didnt click a cell and they weren't holding ctrl, but they
                // clicked on the border in between cells
                this.clear_selected_cell_classes();
                this.selecting = 1;
            } else if (e.target !== this.input
                && !e.target.classList.contains("reshuffle-button")
                && e.target.closest(".csv-pair-container > div > div") === null
            ) {
                // they didnt click on either the shuffle button, the scrollbar, or the color picker
                this.selecting = 0;
                this.end_input();
            }
        });
        
        document.addEventListener("mouseup", e => {
            this.selecting = 0;
        });
        
        document.addEventListener("mouseover", e => {
            if (e.target.classList.contains("shuffle-cell")) {
                this.set_hover_status(e.target);
                this.set_cell_overlay(e.target);
                
                if (this.selecting !== 0) {
                    this.select_cell(e.target);
                }
            } else if (e.target.closest("table") === null) {
                this.cell_overlay.className = "";
                this.cell_overlay.style = "";
                this.set_hover_status(null);
            }
        });
    },
    
    set_cell_overlay: function(cell) {
        const overlay = this.cell_overlay;
        overlay.textContent = cell.textContent;
        overlay.className = "shown";
        const bounds = cell.getBoundingClientRect();
        overlay.style.top  = (window.pageYOffset + bounds.top  - 1) + "px";
        overlay.style.left = (window.pageXOffset + bounds.left - 1) + "px";
        overlay.style.minWidth = (bounds.right - bounds.left + 2) + "px";
        
        if (1 in cell.classList) {
            overlay.classList.add(cell.classList[1]);
        }
        
        overlay.style.backgroundColor = "";
        
        if (getComputedStyle(overlay).backgroundColor === "rgba(0, 0, 0, 0)") {
            overlay.style.backgroundColor = this.hovering_color;
        }
    },
    
    set_hover_status: function(cell) {
        if (this.hover_class !== null) {
            this.remove_hover_styling();
        }
        
        if (cell === null) {
            this.hover_class = null;
            return;
        }
        
        const cell_class = cell.classList[1];
        this.hover_class = cell_class;
        const rule = this.get_rule(cell_class);
        
        rule.style.fontWeight = "bold";
        
        if (rule.style.backgroundColor === "") {
            rule.style.backgroundColor = this.hovering_color;
        }
    },
    
    remove_hover_styling: function() {
        const rule = this.get_rule(this.hover_class);
        
        rule.style.fontWeight = "unset";
        
        if (rule.style.backgroundColor === this.hovering_color) {
            rule.style.backgroundColor = "";
        }
    },
    
    process_cell_mousedown: function(cell, ctrl_key) {
        if (ctrl_key) {
            if (this.is_selected(cell.classList[1])) {
                this.selecting = -1;
            } else {
                this.selecting = 1;
            }
            
            this.select_cell(cell);
        } else {
            this.selecting = 1;
            this.start_input(event.target);
        }
    },
    
    is_selected: function(cell_class) {
        return this.selected_cell_classes.indexOf(cell_class) > -1;
    },
    
    set_color: function(color) {
        let rgb = color.match(/#(..)(..)(..)/).slice(1).map(val => parseInt(val, 16));
        
        const text_color = this.get_contrast_color(rgb);
        
        this.selected_cell_classes.forEach(cell_class => {
            const rule = this.get_rule(cell_class);
            rule.style.backgroundColor = color;
            rule.style.color = text_color;
        });
    },
    
    get_contrast_color: function(rgb) {
        // https://www.w3.org/TR/WCAG20-TECHS/G18.html
        const weights = [0.2126, 0.7152, 0.0722];
        const luminance = rgb
            .map(v => v/255)
            .map(v => v <= 0.3928 
                    ? v / 12.92 
                    : ((v + 0.055)/1.055)**2.4)
            .map((v, i) => v * weights[i])
            .reduce((sum, v) => sum + v);
        return luminance < 0.48 ? "white" : "black";
    },
    
    get_rule: function(cell_class) {
        if (!(cell_class in this.cell_class_lookup)) {
            this.cell_class_lookup[cell_class] = this.rules.length;
            this.sheet.insertRule(`.${cell_class} {}`, this.rules.length);
        }
        
        return this.rules[this.cell_class_lookup[cell_class]];
    },
    
    start_input: function(selected_cell) {
        this.clear_selected_cell_classes();
        this.select_cell(selected_cell);
        const current_color = this.get_rgb_of_background_color(selected_cell);
        this.input.value = current_color === "#ffffff" ? "#00ff00" : current_color;
        this.input.classList.add("shown");
    },
    
    select_cell: function(cell) {
        const deselecting = this.selecting === -1;
        const cell_class = cell.classList[1];
        
        if (deselecting) {
            this.selected_cell_classes.splice(this.selected_cell_classes.indexOf(cell_class), 1);
            this.remove_cell_selecting_style(cell_class);
        } else {
            this.selected_cell_classes.push(cell_class);
            this.add_cell_selecting_style(cell_class);
        }
    },
    
    add_cell_selecting_style: function(cell_class) {
        const rule = this.get_rule(cell_class);
        rule.style.outline = this.selecting_outline;
        
        if (rule.style.backgroundColor === ""
            || rule.style.backgroundColor === "rgb(255, 255, 255)"
            || rule.style.backgroundColor === this.hovering_color
        ) {
            rule.style.backgroundColor = this.selecting_bgc;
        }
    },
    
    remove_cell_selecting_style: function(cell_class) {
        const rule = this.get_rule(cell_class);
        rule.style.outline = "";
        
        if (rule.style.backgroundColor === this.selecting_bgc) {
            rule.style.backgroundColor = "";
            rule.style.color = "";
        }
    },

    end_input: function () {
        this.clear_selected_cell_classes();
        document.getElementById("cell-color-input").classList.remove("shown");
    },
    
    clear_selected_cell_classes: function() {
        this.selected_cell_classes.forEach(cell_class => {
            this.remove_cell_selecting_style(cell_class);
        });
        
        this.selected_cell_classes.splice(0, this.selected_cell_classes.length);
    },
    
    get_rgb_of_background_color: function(element) {
        // credit Danilo Valente @ https://stackoverflow.com/questions/11670019/does-object-style-color-only-return-rgb
        let rgb = getComputedStyle(element).backgroundColor.match(/\d+/g);
        
        if (rgb.length > 3) {
            if (rgb[3] === "0") {
                return "#ffffff";
            } else {
                rgb.splice(3, rgb.length - 3);
            }
        }
        
        return "#" + rgb.map(val => parseInt(val).toString(16).padStart(2, "0")).join("");
    }
}
