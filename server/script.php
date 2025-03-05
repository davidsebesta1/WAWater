<?php
require __DIR__ . '/vendor/autoload.php';
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

$host = "localhost";
$user = "apiUser";
$password = "MyPassword123!";
$database = "Vodarenska";

$pdo = new PDO("mysql:host=$host;dbname=$database;charset=utf8", $user, $password);
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$houseId = isset($_GET['houseId']) ? (int) $_GET['houseId'] : 1;
$year = 2023;

$stmt = $pdo->prepare("
    SELECT Month, Heat, ColdWater, HotWater
    FROM MonthlyUsage
    WHERE House_ID = :houseId
      AND Year = :year
    ORDER BY Month
");
$stmt->execute(['houseId' => $houseId, 'year' => $year]);

$usageData = [];
while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    $usageData[$row['Month']] = [
        'Heat'      => $row['Heat'],
        'ColdWater' => $row['ColdWater'],
        'HotWater'  => $row['HotWater']
    ];
}

$spreadsheet = new Spreadsheet();
$sheet = $spreadsheet->getActiveSheet();

$czMonths = [
    1 => 'led', 2 => 'úno', 3 => 'bře', 4 => 'dub', 5 => 'kvě', 
    6 => 'čer', 7 => 'čec', 8 => 'srp', 9 => 'zář', 10 => 'říj', 
    11 => 'lis', 12 => 'pro'
];

$sheet->setCellValue('A1', 'Teplo [poměrové jednotky]');
$sheet->setCellValue('A2', 'Studená voda [m3]');
$sheet->setCellValue('A3', 'Teplá voda [m3]');
$sheet->setCellValue('A5', "Rok: $year, House_ID: $houseId");

<<<<<<< HEAD
$columnIndex = 2; // Start at column B
foreach ($czMonths as $monthNum => $monthCzName) {
    // Convert the column index to a letter (2 -> 'B', 3 -> 'C', etc.)
    $columnLetter = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($columnIndex);
    
    // Set month name in row 4
=======
$columnIndex = 2; 
foreach ($czMonths as $monthNum => $monthCzName) {
    $columnLetter = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($columnIndex);
    
>>>>>>> aad67009577ff7f6e8c0aa3422bd601d0bfd8885
    $sheet->setCellValue("{$columnLetter}4", $monthCzName);

    // Get usage data for each month
    $heat      = isset($usageData[$monthNum]) ? $usageData[$monthNum]['Heat']      : 0;
    $coldWater = isset($usageData[$monthNum]) ? $usageData[$monthNum]['ColdWater'] : 0;
    $hotWater  = isset($usageData[$monthNum]) ? $usageData[$monthNum]['HotWater']  : 0;

<<<<<<< HEAD
    // Set values in rows 1, 2, and 3
=======
>>>>>>> aad67009577ff7f6e8c0aa3422bd601d0bfd8885
    $sheet->setCellValue("{$columnLetter}1", $heat);
    $sheet->setCellValue("{$columnLetter}2", $coldWater);
    $sheet->setCellValue("{$columnLetter}3", $hotWater);

    // Increment column index for next month
    $columnIndex++;
}

header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
header("Content-Disposition: attachment;filename=\"export_house_{$houseId}.xlsx\"");
header('Cache-Control: max-age=0');

$writer = new Xlsx($spreadsheet);
$writer->save('php://output');
exit;
