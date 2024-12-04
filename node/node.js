const fs = require("fs");
const XLSX = require("xlsx");
const fetch = require("node-fetch"); // Pro HTTP požadavky


// Funkce pro načtení Excel souboru a extrakci dat
function readExcelFile(filePath) {
    const workbook = XLSX.readFile(filePath);
    const sheetNames = workbook.SheetNames;

    const parsedData = {};
    sheetNames.forEach((sheetName) => {
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

    return parsedData;
}

// Funkce pro získání existujících měsíců z databáze přes backend API
async function getExistingMonths() {
    try {
        const response = await fetch("http://localhost:3000/api/get-existing-months");
        if (response.ok) {
            const existingMonths = await response.json();
            console.log("Existující měsíce:", existingMonths);
            return existingMonths;
        } else {
            console.error("Nepodařilo se získat existující měsíce.");
            return [];
        }
    } catch (error) {
        console.error("Chyba při načítání existujících měsíců:", error);
        return [];
    }
}

async function sendDataToBackend(dataToInsert) {
    try {
        const response = await fetch("http://localhost:3000/api/save-data", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(dataToInsert),
        });

        if (response.ok) {
            console.log("Data byla úspěšně odeslána na server.");
        } else {
            console.error("Chyba při odesílání dat na server.");
        }
    } catch (error) {
        console.error("Chyba při odesílání dat:", error);
    }
}

async function main() {
    const parsedData = readExcelFile(filePath);
    console.log("Načtená data:", parsedData);

    const existingMonths = await getExistingMonths();

    const dataToInsert = {};
    for (const month in parsedData) {
        if (!existingMonths.includes(month)) {
            dataToInsert[month] = parsedData[month];
        }
    }

    console.log("Data k odeslání:", dataToInsert);

    if (Object.keys(dataToInsert).length > 0) {
        await sendDataToBackend(dataToInsert);
    } else {
        console.log("Všechna data již existují v databázi, není co odeslat.");
    }
}

main();
