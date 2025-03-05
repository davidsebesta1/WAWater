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

    document.addEventListener("DOMContentLoaded", () => {
        const triggersContainer = document.getElementById("triggers-container");
        const addTriggerBtn = document.getElementById("add-trigger-btn");
        const saveTriggersBtn = document.getElementById("save-triggers-btn");
    
        // Přidání nového formulářového řádku pro spouštěč
        addTriggerBtn.addEventListener("click", () => {
            const triggerDiv = document.createElement("div");
            triggerDiv.classList.add("trigger-item");
    
            triggerDiv.innerHTML = `
                <label>Měsíc:</label>
                <input type="number" class="trigger-month" min="1" max="12" required />
                
                <label>Rok:</label>
                <input type="number" class="trigger-year" min="2024" required />
    
                <label>Typ upozornění:</label>
                <select class="trigger-alert-type">
                    <option value="1">Typ 1</option>
                    <option value="2">Typ 2</option>
                </select>
    
                <label>Limit:</label>
                <input type="number" class="trigger-limit" required />
    
                <button type="button" class="remove-trigger-btn">Odebrat</button>
            `;
    
            // Tlačítko pro odstranění řádku
            triggerDiv.querySelector(".remove-trigger-btn").addEventListener("click", () => {
                triggerDiv.remove();
            });
    
            triggersContainer.appendChild(triggerDiv);
        });
    
        // Uložení triggerů na backend
        saveTriggersBtn.addEventListener("click", () => {
            const houseId = document.getElementById("house-picker").value;
            if (!houseId) {
                alert("Nejprve vyberte dům.");
                return;
            }
    
            const triggers = [];
            document.querySelectorAll(".trigger-item").forEach(triggerDiv => {
                const month = triggerDiv.querySelector(".trigger-month").value;
                const year = triggerDiv.querySelector(".trigger-year").value;
                const alertTypeId = triggerDiv.querySelector(".trigger-alert-type").value;
                const limit = triggerDiv.querySelector(".trigger-limit").value;
    
                if (!month || !year || !alertTypeId || !limit) {
                    alert("Vyplňte všechny hodnoty.");
                    return;
                }
    
                triggers.push({ month: parseInt(month), year: parseInt(year), alertTypeId: parseInt(alertTypeId), limit: parseInt(limit) });
            });
    
            fetch("http://localhost:8082/triggers", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ houseId: parseInt(houseId), triggers }),
            })
            .then(response => {
                if (response.ok) {
                    alert("Spouštěče byly uloženy.");
                } else {
                    throw new Error("Chyba při ukládání.");
                }
            })
            .catch(error => {
                console.error("Error saving triggers:", error);
                alert("Nepodařilo se uložit spouštěče.");
            });
        });
    });
    

    // Fetch houses when the page loads
    ensureAuthentication()
        .then(fetchHouses)
        .catch((error) => {
            console.error("Error fetching houses:", error);
        });
});