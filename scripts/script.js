document.addEventListener("DOMContentLoaded", () => {
    const label = document.querySelector(".custom-file-upload");
    const fileInput = document.getElementById("file-upload");
    const uploadBtn = document.getElementById("upload-btn");
    const usernameInput = document.getElementById("username");
    const passwordInput = document.getElementById("password");
    const housePicker = document.getElementById("house-picker");

    let token = localStorage.getItem("authToken");

    const fetchHouses = () => {
        return fetch("http://localhost:8082/houses", {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
            .then((response) => {
                if (response.ok) {
                    return response.json();
                } else {
                    throw new Error("Failed to fetch houses");
                }
            })
            .then((houses) => {
                housePicker.innerHTML = `<option value="" disabled selected>Vyberte dům</option>`;
                houses.forEach((house) => {
                    const option = document.createElement("option");
                    option.value = house.ID;
                    option.textContent = house.Address;
                    housePicker.appendChild(option);
                });
            })
            .catch((error) => {
                console.error("Error fetching houses:", error);
                alert("Chyba při načítání seznamu domů.");
            });
    };

    const ensureAuthentication = () => {
        return new Promise((resolve, reject) => {
            if (token) {
                fetch("http://localhost:8082/verifyToken", {
                    method: "POST",
                    headers: { Authorization: `Bearer ${token}` },
                })
                    .then((response) => {
                        if (response.ok) {
                            resolve();
                        } else {
                            localStorage.removeItem("authToken");
                            reject();
                        }
                    })
                    .catch(() => reject());
            } else {
                reject();
            }
        });
    };


    const login = (username, password) => {
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
                localStorage.setItem("authToken", token);
            })
            .catch((error) => {
                console.error("Login failed:", error);
                alert("Neplatné přihlašovací údaje.");
            });
    };

    uploadBtn.addEventListener("click", () => {

        const file = fileInput.files[0];
        const username = usernameInput.value;
        const password = passwordInput.value;
        const houseId = housePicker.value;

        if (!houseId) {
            alert("Vyberte dům!");

            login(username, password)
                .then(fetchHouses)
            return;
        }

        if (!file) {
            alert("Vyberte soubor!");
            return;
        }

        if (!file.name.endsWith(".xls") && !file.name.endsWith(".xlsx")) {
            alert("Povolené jsou pouze soubory XLS nebo XLSX.");
            return;
        }

        const uploadFile = () => {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("houseId", houseId);
    
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

        login(username, password)
            .then(uploadFile)
            .catch((error) => {
                console.error("Error during the process:", error);
            });
    });

    // Fetch houses when the page loads
    ensureAuthentication()
        .then(fetchHouses)
        .catch((error) => {
            console.error("Error fetching houses:", error);
        });
});