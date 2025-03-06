CREATE DATABASE Vodarenska;
USE Vodarenska;

CREATE USER 'apiUser'@'localhost' IDENTIFIED BY 'MyPassword123!';
GRANT ALL PRIVILEGES ON Vodarenska.* TO 'apiUser'@'localhost';
FLUSH privileges;

CREATE TABLE User(
	ID INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
	Name VARCHAR(100) NOT NULL,
	HashedPassword VARCHAR(255) NOT NULL
);

INSERT INTO User(Name, HashedPassword, EmployeePermissions) VALUES('admin', '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', 1);

CREATE TABLE House(
	ID INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    Address VARCHAR(100) NOT NULL,
    User_ID INT NOT NULL,
    
    FOREIGN KEY(User_ID) REFERENCES User(ID)
);

INSERT INTO House(Address, User_ID) VALUES('TempAdresa 1000/1',1);

CREATE TABLE Gauge (
    ID INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    SerialNumber VARCHAR(100) NOT NULL UNIQUE,
    Type ENUM('Heat', 'ColdWater', 'HotWater') NOT NULL,
    House_ID INT NOT NULL,
    
    FOREIGN KEY (House_ID) REFERENCES House(ID)
);

INSERT INTO Gauge(SerialNumber, Type, House_ID) VALUES('SE01/1', 'Heat', 1);

CREATE TABLE MonthlyUsage(
	ID INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    Gauge_ID INT NOT NULL,
    Month INT NOT NULL,
    Year INT NOT NULL,
    Heat DECIMAL(10,2) NOT NULL,
    ColdWater DECIMAL(10,2) NOT NULL,
    HotWater DECIMAL(10,2) NOT NULL
);

ALTER TABLE MonthlyUsage ADD UNIQUE KEY unique_usage (Gauge_ID, Month, Year);

CREATE TABLE AlertsType(
    ID INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    Name VARCHAR(50) NOT NULL
);

CREATE TABLE Alerts (
    ID INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    House_ID INT NOT NULL,
    Month INT NOT NULL,
    Year INT NOT NULL,
    
	AlertsType_ID INT NOT NULL,
    LimitExceed DECIMAL(10,2) NOT NULL,
    
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (House_ID) REFERENCES House(ID),
    FOREIGN KEY (AlertsType_ID) REFERENCES AlertsType(ID)
);


-- Trigger pro upozornění, když spotřeba překročí danou hodnotu během měsíce
DELIMITER $$
CREATE TRIGGER before_monthly_usage_insert
BEFORE INSERT ON MonthlyUsage
FOR EACH ROW
BEGIN
    DECLARE threshold DECIMAL(10,2);
    
    -- Předpokládáme, že limit je definovaný v tabulce Alerts a je přednastavený
    SELECT LimitExceed INTO threshold 
    FROM Alerts 
    WHERE House_ID = NEW.House_ID AND AlertsType_ID = 1; 
    
    -- Pokud spotřeba překročí limit, vložíme upozornění
    IF NEW.ColdWater > threshold THEN
        INSERT INTO Alerts (House_ID, Month, Year, AlertsType_ID, LimitExceed)
        VALUES (NEW.House_ID, NEW.Month, NEW.Year, 1, NEW.ColdWater);
    END IF;
END $$
DELIMITER ;

-- Trigger pro porovnání spotřeby s průměrem předchozích let
DELIMITER $$
CREATE TRIGGER before_monthly_usage_insert_avg
BEFORE INSERT ON MonthlyUsage
FOR EACH ROW
BEGIN
    DECLARE avg_usage DECIMAL(10,2);
    
    -- Vypočítáme průměrnou spotřebu za stejný měsíc v minulých letech
    SELECT AVG(ColdWater) INTO avg_usage
    FROM MonthlyUsage
    WHERE House_ID = NEW.House_ID AND Month = NEW.Month AND Year < NEW.Year;
    
    -- Pokud je aktuální spotřeba vyšší než průměr, vložíme upozornění
    IF NEW.ColdWater > avg_usage THEN
        INSERT INTO Alerts (House_ID, Month, Year, AlertsType_ID, LimitExceed)
        VALUES (NEW.House_ID, NEW.Month, NEW.Year, 1, NEW.ColdWater);
    END IF;
END $$
DELIMITER ;

-- Trigger pro automatické zaslání přehledu 1. dne následujícího měsíce (simulované logikou)
DELIMITER $$
CREATE EVENT send_monthly_report
ON SCHEDULE EVERY 1 MONTH
STARTS TIMESTAMP(CURRENT_DATE + INTERVAL 1 MONTH - INTERVAL DAY(CURRENT_DATE)-1 DAY)
DO
BEGIN
    INSERT INTO Alerts (House_ID, Month, Year, AlertsType_ID, LimitExceed)
    SELECT House_ID, MONTH(CURRENT_DATE - INTERVAL 1 MONTH), YEAR(CURRENT_DATE - INTERVAL 1 MONTH), 3, 0
    FROM MonthlyUsage;
END $$
DELIMITER ;

-- Trigger pro zobrazení zbývající spotřeby
DELIMITER $$
CREATE TRIGGER before_monthly_usage_insert_remaining
BEFORE INSERT ON MonthlyUsage
FOR EACH ROW
BEGIN
    DECLARE max_limit DECIMAL(10,2);
    DECLARE used DECIMAL(10,2);
    
    -- Získání maximální hodnoty z tabulky Alerts (předpokládáme definovaný limit)
    SELECT LimitExceed INTO max_limit 
    FROM Alerts 
    WHERE House_ID = NEW.House_ID AND AlertsType_ID = 1; 
    
    -- Výpočet již spotřebované hodnoty
    SELECT SUM(ColdWater) INTO used 
    FROM MonthlyUsage 
    WHERE House_ID = NEW.House_ID AND Year = NEW.Year AND Month <= NEW.Month;
    
    -- Vložení do tabulky Alerts pokud zbývající spotřeba je nízká
    IF max_limit - used < 10 THEN
        INSERT INTO Alerts (House_ID, Month, Year, AlertsType_ID, LimitExceed)
        VALUES (NEW.House_ID, NEW.Month, NEW.Year, 4, max_limit - used);
    END IF;
END $$
DELIMITER ;



INSERT INTO AlertsType(Name) VALUES('ColdWater');
INSERT INTO AlertsType(Name) VALUES('HotWater');

-- Z SQL databáze získaz data a vložit je do excelu. PHP script nechat v server repu