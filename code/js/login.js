document.querySelector("form").addEventListener("submit", e => {
    const chars = "qwertyuiopasdfghjklzxcvbnm1234567890";
    let rand_id = "";
    
    while (rand_id.length < 10) {
        rand_id += chars[Math.floor(Math.random() * chars.length)];
    }
    
    const id_input = document.createElement("input");
    id_input.name = "i";
    id_input.value = rand_id;
    id_input.style.display = "none";
    
    e.target.appendChild(id_input);
});
