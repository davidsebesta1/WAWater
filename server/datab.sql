CREATE DATABASE Vodarenska;
USE Vodarenska;

CREATE USER 'apiUser'@'localhost' IDENTIFIED BY 'MyPassword123!';
GRANT ALL PRIVILEGES ON Vodarenska.* TO 'apiUser'@'localhost';
FLUSH privileges;

CREATE TABLE User(
	ID INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
	Name VARCHAR(100) NOT NULL,
	HashedPassword VARCHAR(255) NOT NULL,
    EmployeePermissions BIT NOT NULL
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
    House_ID INT NOT NULL,
    Month INT NOT NULL,
    Year INT NOT NULL,
    Heat DECIMAL(10,2) NOT NULL,
    ColdWater DECIMAL(10,2) NOT NULL,
    HotWater DECIMAL(10,2) NOT NULL
);

ALTER TABLE MonthlyUsage ADD UNIQUE KEY unique_usage (House_ID, Month, Year);

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

INSERT INTO AlertsType(Name) VALUES('ColdWater');
INSERT INTO AlertsType(Name) VALUES('HotWater');

