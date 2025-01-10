const http = require("http");
const fs = require("fs");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
var mysql = require("mysql2");
const path = require("path");
const formidable = require("formidable");
const XLSX = require("xlsx");

const listeningIp = "localhost";
const listeningPort = 8082;
const secretKey = "supersecretkey"; // Used for signing JWTs

//console.log(hashPassword("admin"));

const months = { "led": 1, "úno": 2, "bře": 3, "dub": 4, "kvě": 5, "čer": 6, "čec": 7, "srp": 8, "zář": 9, "říj": 10, "lis": 11, "pro": 12 };

let con = mysql.createConnection({
    host: "localhost",
    user: "apiUser",
    password: "MyPassword123!",
    database: "Vodarenska",
    insecureAuth: true
});

con.connect(function (err) {
    if (err) throw err;
    console.log("Connected to MySQL database.");
});

function hashPassword(password) {
    return crypto.createHash("sha256").update(password).digest("hex");
}

function authenticate(req, res, next) {
    const token = req.headers["authorization"]?.split(" ")[1];

    if (!token) {
        res.statusCode = 401;
        res.end("Unauthorized: No token provided.");
        return;
    }

    jwt.verify(token, secretKey, (err, decoded) => {
        if (err) {
            res.statusCode = 401;
            res.end("Unauthorized: Invalid token.");
            return;
        }

        req.user = decoded;
        next();
    });
}

const server = http.createServer((req, res) => {
    console.log(req.url);

    if (req.method === "GET") {
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

    if (req.method === "POST" && req.url === "/register") {
        let body = "";
        req.on("data", chunk => {
            body += chunk;
        });

        req.on("end", () => {
            const { name, password } = JSON.parse(body);

            if (!name || !password) {
                res.statusCode = 400;
                res.end("Bad Request: Missing name or password.");
                return;
            }

            const hashedPassword = hashPassword(password);
            con.query("INSERT INTO User (Name, HashedPassword) VALUES (?, ?)", [name, hashedPassword], (err) => {
                if (err) {
                    console.error(err);
                    res.statusCode = 500;
                    res.end("Error registering user.");
                    return;
                }

                res.statusCode = 201;
                res.end("User registered successfully.");
            });
        });

        return;
    }

    if (req.method === "POST" && req.url === "/login") {
        let body = "";
        req.on("data", chunk => {
            body += chunk;
        });

        req.on("end", () => {
            const { name, password } = JSON.parse(body);

            if (!name || !password) {
                res.statusCode = 400;
                res.end("Bad Request: Missing name or password.");
                return;
            }

            const hashedPassword = hashPassword(password);
            console.log(hashedPassword);
            con.query("SELECT * FROM User WHERE Name = ? AND HashedPassword = ?", [name, hashedPassword], (err, results) => {
                if (err) {
                    console.error(err);
                    res.statusCode = 500;
                    res.end("Error logging in.");
                    return;
                }

                if (results.length === 0) {
                    res.statusCode = 401;
                    res.end("Invalid credentials.");
                    return;
                }

                const token = jwt.sign({ id: results[0].ID, name: results[0].Name }, secretKey, { expiresIn: "1h" });
                res.statusCode = 200;
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify({ token }));
            });
        });

        return;
    }

    if (req.method === "POST" && req.url === "/upload") {
        authenticate(req, res, () => {
            const form = new formidable.IncomingForm();

            form.parse(req, (err, fields, files) => {
                if (err) {
                    console.error("Error in file upload:", err);
                    res.statusCode = 400;
                    res.end("Error processing the file.");
                    return;
                }

                const file = files.file;

                if (!file) {
                    res.statusCode = 400;
                    res.end("No file uploaded.");
                    return;
                }

                try {
                    const data = new Uint8Array(fs.readFileSync(file[0].filepath));
                    const workbook = XLSX.read(data, { type: "array" });

                    const parsedData = {};
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

                    res.statusCode = 200;
                    console.log(parsedData);
                    res.end(JSON.stringify(parsedData));
                } catch (error) {
                    res.statusCode = 400;
                    res.end("Invalid data " + error);
                    console.log(error);
                }
            });
        });

        return;
    }

    res.statusCode = 404;
    res.end("Not Found");
});

server.listen(listeningPort, listeningIp, () => {
    console.log(`Server is listening on http://${listeningIp}:${listeningPort}`);
});
