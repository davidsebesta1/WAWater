document.addEventListener("DOMContentLoaded", () => {
    const label = document.querySelector(".custom-file-upload");
    const fileInput = document.getElementById("file-upload");
    const uploadBtn = document.getElementById("upload-btn");
    const usernameInput = document.getElementById("username");
    const passwordInput = document.getElementById("password");

    let token = localStorage.getItem("authToken");

    uploadBtn.addEventListener("click", () => {
        const file = fileInput.files[0];
        const username = usernameInput.value;
        const password = passwordInput.value;

        if (!file) {
            alert("Vyberte soubor!");
            return;
        }

        if (!file.name.endsWith(".xls") && !file.name.endsWith(".xlsx")) {
            alert("Povolené jsou pouze soubory XLS nebo XLSX.");
            return;
        }

        const ensureAuthentication = () => {
            return new Promise((resolve, reject) => {
                if (token) {
                    // Verify the token by making a quick API request (optional)
                    fetch("http://localhost:8082/verifyToken", {
                        method: "POST",
                        headers: { Authorization: `Bearer ${token}` },
                    })
                        .then((response) => {
                            if (response.ok) {
                                resolve(); // Token is valid
                            } else {
                                localStorage.removeItem("authToken"); // Clear invalid token
                                reject();
                            }
                        })
                        .catch(() => reject());
                } else {
                    reject(); // No token available
                }
            });
        };

        const login = () => {
            if (!username || !password) {
                alert("Zadejte uživatelské jméno a heslo!");
                return Promise.reject("Missing credentials");
            }

            return fetch("http://localhost:8082/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: username, password }),
            })
                .then((response) => {
                    if (response.ok) {
                        return response.json();
                    } else {
                        throw new Error("Invalid credentials");
                    }
                })
                .then((data) => {
                    token = data.token;
                    localStorage.setItem("authToken", token); // Save the token for future requests
                })
                .catch((error) => {
                    console.error("Login failed:", error);
                    alert("Neplatné přihlašovací údaje.");
                });
        };

        const uploadFile = () => {
            const formData = new FormData();
            formData.append("file", file);

            return fetch("http://localhost:8082/upload", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            })
                .then((response) => {
                    if (response.ok) {
                        alert("Soubor byl úspěšně odeslán!");
                    } else if (response.status === 401) {
                        alert("Neplatné přihlašovací údaje.");
                    } else {
                        alert("Nastala chyba při odesílání souboru.");
                    }
                })
                .catch((error) => {
                    console.error("Chyba při odesílání souboru:", error);
                    alert("Nepodařilo se odeslat soubor.");
                });
        };

        ensureAuthentication()
            .catch(login)
            .then(uploadFile)
            .catch((error) => {
                console.error("Error during the process:", error);
            });
    });
});