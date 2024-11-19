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

        const reader = new FileReader();
        reader.onload = (e) => {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: "array" });

            workbook.SheetNames.forEach((sheetName) => {
                const sheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(sheet);
                console.log(`Data z listu "${sheetName}":`, jsonData);
            });

            label.textContent = "Soubor úspěšně nahrán";
            label.style.color = "green";
        };

        reader.onerror = (err) => {
            console.error("Chyba při čtení souboru:", err);
            alert("Soubor se nepodařilo načíst.");
        };

        reader.readAsArrayBuffer(file);
    });
});
