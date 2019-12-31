var CSV = {
    build: function(src_files, filename, shuffle_seed) {
        let csv = [];
        let dir = filename.substring(0, filename.lastIndexOf("/"));
        
        if (dir.length > 0) dir += "/";
        
        src_files[filename].forEach(row => {
            if ("Subfile" in row && row["Subfile"] !== "") {
                let sub_csv = this.build(src_files, dir + row["Subfile"], false);
                this.make_csv_inherit_row_values(sub_csv, row);
                
                for (let i = 0; i < sub_csv.length; ++i) csv.push(sub_csv[i]);
            } else {
                csv.push(this.copy_row(row));
            }
        });
        
        this.standardize_csv(csv);
        
        if (shuffle_seed !== false) {
            this.shuffle(csv, shuffle_seed);
        }
        
        return csv;
    },
    
    make_csv_inherit_row_values: function(csv, row) {
        for (let col in row) {
            if (row[col] === "") continue;
            if (col === "Subfile") continue;
            
            let val = row[col];
            
            if (val.substring(0, 7) === "append:") {
                for (let i = 0; i < csv.length; ++i)
                    csv[i][col] += val.substring(7).trim();
            } else if (val.substring(0, 8) === "prepend:") {
                for (let i = 0; i < csv.length; ++i)
                    csv[i][col] = val.substring(8).trim() + csv[i][col];
            } else if (val.substring(0, 4) === "add:") {
                for (let i = 0; i < csv.length; ++i)
                    csv[i][col] = String(Number(val.substring(4)) + Number(csv[i][col]));
            } else {
                for (let i = 0; i < csv.length; ++i)
                    csv[i][col] = val;
            }
        }
    },
    
    standardize_csv: function(csv) {
        let columns = {};
        
        for (let i = 0; i < csv.length; ++i) {
            for (let column in csv[i]) {
                columns[column] = true;
            }
        }
        
        for (let i = 0; i < csv.length; ++i) {
            for (let column in columns) {
                if (!(column in csv[i])) {
                    csv[i][column] = "";
                } else {
                    csv[i][column] = String(csv[i][column]);
                }
            }
        }
        
        return csv;
    },
    
    copy_row: function(row) { return Object.assign({}, row); },
    
    shuffle: function(csv, shuffle_seed) {
        if (!(0 in csv) || !("Shuffle" in csv[0])) return csv; // nothing to shuffle, dont waste time
        
        let seed = typeof shuffle_seed === "undefined" || String(shuffle_seed) === ""
                 ? String(Math.random())
                 : String(shuffle_seed);
        
        let random = new Math.seedrandom(seed);
        
        let shuffles = {};
        
        for (let i = 0; i < csv.length; ++i) {
            let shuffle_val = csv[i]["Shuffle"];
            
            if (shuffle_val === "" || shuffle_val.toLowerCase() === "off") continue;
            
            if (!(csv[i]["Shuffle"] in shuffles)) {
                shuffles[csv[i]["Shuffle"]] = [];
            }
            
            shuffles[shuffle_val].push(i);
        }
        
        for (let shuffle_val in shuffles) {
            for (let i = shuffles[shuffle_val].length - 1; i > 0; --i) {
                let j = Math.floor(random() * (i + 1));
                
                if (i !== j) {
                    let row_i = shuffles[shuffle_val][i];
                    let row_j = shuffles[shuffle_val][j];
                    let temp = csv[row_i];
                    csv[row_i] = csv[row_j];
                    csv[row_j] = temp;
                }
            }
        }
        
        return csv;
    },
};
