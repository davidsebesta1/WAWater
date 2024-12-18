const http = require("http");
const fs = require("fs");
const crypto = require("crypto");
var mysql = require("mysql2");
const path = require("path");

const listeningIp = "localhost";
const listeningPort = 8082;

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
        let body = "";

        req.on("data", chunk => {
            body += chunk;
        });

        req.on("end", () => {
            try {
                const postData = JSON.parse(body);

                console.log(postData);
                res.statusCode = 200;
                res.end();
                return;
            } catch (error) {
                res.statusCode = 400;
                res.end("Invalid JSON data");
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
