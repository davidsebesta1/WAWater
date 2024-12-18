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

            const parsedData = {}; // Objekt pro ukládání dat dle měsíců

            workbook.SheetNames.forEach((sheetName) => {
                const sheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

                const headers = jsonData[0];
                const rows = jsonData.slice(1);

                rows.forEach((row) => {
                    headers.forEach((header, index) => {
                        if (header && row[index] !== undefined) {
                            const key = header.trim();
                            if (!parsedData[key]) {
                                parsedData[key] = [];
                            }
                            parsedData[key].push(row[index]);
                        }
                    });
                });
            });

            console.log("Načtená data dle měsíců:", parsedData);

            
            const dataToInsert = {};
            for (const month in parsedData) {
                const values = parsedData[month];
                if (values.some((value) => value !== 0)) { // Má-li měsíc nenulové hodnoty
                    dataToInsert[month] = {
                        teplo: values[0] || 0,
                        studenaVoda: values[1] || 0,
                        teplaVoda: values[2] || 0,
                    };
                }
            }

            console.log("Data k odeslání do databáze:", dataToInsert);

            // Odeslání dat na server (backendu)
            fetch("http://localhost:8082/upload", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    bytId: 1, // ID bytu (podle potřeby)
                    data: dataToInsert,
                }),
            })
                .then((response) => {
                    if (response.ok) {
                        alert("Data byla úspěšně odeslána!");
                    } else {
                        alert("Nastala chyba při odesílání dat.");
                    }
                })
                .catch((error) => {
                    console.error("Chyba při odesílání dat:", error);
                    alert("Nepodařilo se odeslat data.");
                });

            label.textContent = "Soubor úspěšně nahrán a zpracován";
            label.style.color = "green";
        };

        reader.onerror = (err) => {
            console.error("Chyba při čtení souboru:", err);
            alert("Soubor se nepodařilo načíst.");
        };

        reader.readAsArrayBuffer(file);
    });
});
