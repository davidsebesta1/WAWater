document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("upload-btn").addEventListener("click", () => {
        const fileInput = document.getElementById("file-upload");
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
        };
    
        reader.onerror = (err) => {
            console.error("Chyba při čtení souboru:", err);
            alert("Soubor se nepodařilo načíst.");
        };
    
        reader.readAsArrayBuffer(file);
    });
})


