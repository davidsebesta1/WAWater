const http = require("http");
const fs = require("fs");
const crypto = require("crypto");
var mysql = require("mysql2");
const path = require("path");
const multer = require('multer');
const XLSX = require('xlsx');
const formidable = require('formidable');

const listeningIp = "localhost";
const listeningPort = 8082;

const months = { "led": 1, "úno": 2, "bře": 3, "dub": 4, "kvě": 5, "čer": 6, "čec": 7, "srp": 8, "zář": 9, "říj": 10, "lis": 11, "pro": 12 }

let con = mysql.createConnection({
    host: "localhost",
    user: "apiUser",
    password: "MyPassword123!",
    insecureAuth: true
});

/*
con.connect(function (err) {
    if (err) throw err;
    console.log("Connected!");

    con.query("USE Vodarenska;", function (err, result, fields) {
        if (err) throw err;
    });
});
*/

const server = http.createServer((req, res) => {
    console.log(req.url);
    if (req.method === "GET") {
        console.log("get")
        if (req.url === "/form") {
            const filePath = path.join(__dirname, "..", "public", "form.html");
            console.log(filePath)
            fs.readFile(filePath, "utf-8", (err, data) => {
                if (err) {
                    console.log(err)
                    res.statusCode = 500;
                    res.end("Error reading form.html file.");
                    return;
                } else {
                    res.statusCode = 200;
                    res.setHeader("Content-Type", "text/html");
                    res.end(data);
                    return;
                }
            });

            return;
        } else if (req.url === "/style.css") {
            const filePath = path.join(__dirname, "..", "public", "style.css");
            fs.readFile(filePath, "utf-8", (err, data) => {
                if (err) {
                    console.log(err)
                    res.statusCode = 500;
                    res.end("Error reading style.css file.");
                    return;
                } else {
                    res.statusCode = 200;
                    res.setHeader("Content-Type", "text/css");
                    res.end(data);
                    return;
                }
            });

            return;
        } else if (req.url === "/script.js") {
            const filePath = path.join(__dirname, "..", "scripts", "script.js");
            fs.readFile(filePath, "utf-8", (err, data) => {
                if (err) {
                    console.log(err)
                    res.statusCode = 500;
                    res.end("Error reading script.js file.");
                    return;
                } else {
                    res.statusCode = 200;
                    res.setHeader("Content-Type", "application/javascript");
                    res.end(data);
                    return;
                }
            });

            return;
        } else {
            res.statusCode = 404;
            res.end("Not Found");
            return;
        }
    }

    if (req.method === "POST" && req.url === "/upload") {
        // Create a new form and handle file upload
        const form = new formidable.IncomingForm(); // Corrected to use 'new'

        form.parse(req, (err, fields, files) => {
            if (err) {
                console.error("Error in file upload:", err);
                res.end("Invalid data " + err);
                res.end('Error processing the file.');
                return;
            }

            // Ensure the file exists in the uploaded files
            const file = files.file;

            if (!file) {
                res.end("Invalid data " + err);
                res.end('No file uploaded.');
                return;
            }

            try {
                // Parse the file (assuming it's an Excel file)
                const data = new Uint8Array(fs.readFileSync(file[0].filepath));
                const workbook = XLSX.read(data, { type: 'array' });

                const parsedData = {}; // Object to store parsed data by months

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

                let dataJson = parsedData;

                let year = parseInt(Object.keys(dataJson)[0]);
                let monthData = {};

                Object.entries(months).map(entry => {
                    let key = entry[0];
                    let value = entry[1];

                    monthData[value] = dataJson[key];
                });

                console.log(year);
                console.log(monthData);
                res.statusCode = 200;
                res.end();
                return;
            } catch (error) {
                res.statusCode = 400;
                res.end("Invalid data " + error);
                console.log(error)
                return;
            }
        });
    } else {
        res.statusCode = 404;
        res.end("Not Found");
    }
});

// Start the server
server.listen(listeningPort, listeningIp, () => {
    console.log(`Server is listening on http://${listeningIp}:${listeningPort}`);
});
