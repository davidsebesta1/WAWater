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

        if (req.url == "/houses") {
            authenticate(req, res, () => {
                if (!req.user || !req.user.id) {
                    res.statusCode = 401;
                    res.end("Unauthorized: User information missing.");
                    return;
                }

                const userId = req.user.id;

                const query = "SELECT * FROM House WHERE User_ID = ?";
                con.query(query, [userId], (err, results) => {
                    if (err) {
                        console.error("Error retrieving houses:", err);
                        res.statusCode = 500;
                        res.end("Internal Server Error: Unable to retrieve houses.");
                        return;
                    }

                    res.statusCode = 200;
                    res.setHeader("Content-Type", "application/json");
                    res.end(JSON.stringify(results));
                });
            });

            return;
        }
        else if (req.url === "/form") {
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

            console.log(password);
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

    if (req.method === "POST" && req.url === "/gauge/add") {
        authenticate(req, res, () => {
            console.log("a");
            let body = "";
            req.on("data", (chunk) => {
                body += chunk;
            });
    
            req.on("end", () => {
                try{
                    console.log(body);
                    const { serialNumber, type, houseId } = JSON.parse(body);
        
                    if (!serialNumber || !type || !houseId) {
                        res.statusCode = 400;
                        res.end("Bad Request: Missing serialNumber, type, or houseId.");
                        return;
                    }
        
                    // Make sure the type is valid
                    if (!['Heat', 'ColdWater', 'HotWater'].includes(type)) {
                        res.statusCode = 400;
                        res.end("Bad Request: Invalid type. Must be 'Heat', 'ColdWater', or 'HotWater'.");
                        return;
                    }
        
                    const query = "INSERT INTO Gauge (SerialNumber, Type, House_ID) VALUES (?, ?, ?)";
                    con.query(query, [serialNumber, type, houseId], (err, result) => {
                        if (err) {
                            console.error(err);
                            res.statusCode = 500;
                            res.end("Error adding gauge.");
                            return;
                        }
        
                        res.statusCode = 201;
                        res.end("Gauge added successfully.");
                    });
                }catch(exception){
                    console.log(exception);
                    res.statusCode = 500;
                    res.end("Error adding gauge: " + exception);
                }
            });
    
            return;
        });
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

                let houseId = fields.houseId[0];
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

                    //console.log(parsedData);
                    let year = Object.keys(parsedData)[0];
                    console.log(year)

                    for (let key in months) {
                        console.log(parsedData[key]);

                        let pomJed = parseFloat(parsedData[key][0])
                        let coldWater = parseFloat(parsedData[key][1])
                        let hotWater = parseFloat(parsedData[key][2])

                        if (pomJed == 0 && coldWater == 0 && hotWater == 0) {
                            continue;
                        }

                        con.query("INSERT INTO MonthlyUsage(House_ID,Month,Year,Heat,ColdWater,HotWater) VALUES(?,?,?,?,?,?) ON DUPLICATE KEY UPDATE Heat = VALUES(Heat),ColdWater = VALUES(ColdWater),HotWater = VALUES(HotWater); ", [houseId, months[key], year, pomJed, coldWater, hotWater], (err, results) => {
                            console.log(err);
                        });
                    }

                    res.statusCode = 200;
                    res.end();
                } catch (error) {
                    res.statusCode = 400;
                    res.end("Invalid data " + error);
                    console.log(error);
                }
            });
        });

        return;
    }

    if (req.method === "POST" && req.url === "/house/add") {
        authenticate(req, res, () => {
            let body = "";
            req.on("data", (chunk) => {
                body += chunk;
            });

            req.on("end", () => {
                const { address, userId } = JSON.parse(body);

                if (!address || !userId) {
                    res.statusCode = 400;
                    res.end("Bad Request: Missing address or userId.");
                    return;
                }

                const query = "INSERT INTO House (Address, User_ID) VALUES (?, ?)";
                con.query(query, [address, userId], (err, result) => {
                    if (err) {
                        console.error(err);
                        res.statusCode = 500;
                        res.end("Error adding house.");
                        return;
                    }

                    res.statusCode = 201;
                    res.end("House added successfully.");
                });
            });

            return;
        });
    }

    if (req.method === "PUT" && req.url.startsWith("/house/edit")) {
        authenticate(req, res, () => {
            let body = "";
            req.on("data", (chunk) => {
                body += chunk;
            });

            req.on("end", () => {
                const { id, address, userId } = JSON.parse(body);

                if (!id || !address || !userId) {
                    res.statusCode = 400;
                    res.end("Bad Request: Missing id, address, or userId.");
                    return;
                }

                const query = "UPDATE House SET Address = ?, User_ID = ? WHERE ID = ?";
                con.query(query, [address, userId, id], (err, result) => {
                    if (err) {
                        console.error(err);
                        res.statusCode = 500;
                        res.end("Error updating house.");
                        return;
                    }

                    res.statusCode = 200;
                    res.end("House updated successfully.");
                });
            });

            return;
        });
    }

    if (req.method === "DELETE" && req.url.startsWith("/house/delete")) {
        authenticate(req, res, () => {
            const urlParts = req.url.split("/");
            const houseId = urlParts[urlParts.length - 1];

            if (!houseId) {
                res.statusCode = 400;
                res.end("Bad Request: Missing house ID.");
                return;
            }

            const query = "DELETE FROM House WHERE ID = ?";
            con.query(query, [houseId], (err, result) => {
                if (err) {
                    console.error(err);
                    res.statusCode = 500;
                    res.end("Error deleting house.");
                    return;
                }

                res.statusCode = 200;
                res.end("House deleted successfully.");
            });

            return;
        });
    }

    res.statusCode = 404;
    res.end("Not Found");
});

server.listen(listeningPort, listeningIp, () => {
    console.log(`Server is listening on http://${listeningIp}:${listeningPort}`);
});
