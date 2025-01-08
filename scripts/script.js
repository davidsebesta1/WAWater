document.addEventListener("DOMContentLoaded", () => {
    const label = document.querySelector(".custom-file-upload");
    const fileInput = document.getElementById("file-upload");
    const uploadBtn = document.getElementById("upload-btn");

    uploadBtn.addEventListener("click", () => {
        const file = fileInput.files[0];
    
        if (!file) {
            alert("Vyberte soubor!");
            return;
        }
    
        if (!file.name.endsWith(".xls") && !file.name.endsWith(".xlsx")) {
            alert("Povolené jsou pouze soubory XLS nebo XLSX.");
            return;
        }
    
        const formData = new FormData();
        formData.append("file", file);
    
        // Odeslání souboru na server (backend)
        fetch("http://localhost:8082/upload", {
            method: "POST",
            body: formData,
        })
        .then((response) => {
            if (response.ok) {
                alert("Soubor byl úspěšně odeslán!");
            } else {
                alert("Nastala chyba při odesílání souboru.");
            }
        })
        .catch((error) => {
            console.error("Chyba při odesílání souboru:", error);
            alert("Nepodařilo se odeslat soubor.");
        });
    
        label.textContent = "Soubor úspěšně nahrán";
        label.style.color = "green";
    });
});
