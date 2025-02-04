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

$columnIndex = 2;
foreach ($czMonths as $monthNum => $monthCzName) {
    $sheet->setCellValueByColumnAndRow($columnIndex, 4, $monthCzName);

    $heat      = isset($usageData[$monthNum]) ? $usageData[$monthNum]['Heat']      : 0;
    $coldWater = isset($usageData[$monthNum]) ? $usageData[$monthNum]['ColdWater'] : 0;
    $hotWater  = isset($usageData[$monthNum]) ? $usageData[$monthNum]['HotWater']  : 0;

    $sheet->setCellValueByColumnAndRow($columnIndex, 1, $heat);
    $sheet->setCellValueByColumnAndRow($columnIndex, 2, $coldWater);
    $sheet->setCellValueByColumnAndRow($columnIndex, 3, $hotWater);

    $columnIndex++;
}

header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
header("Content-Disposition: attachment;filename=\"export_house_{$houseId}.xlsx\"");
header('Cache-Control: max-age=0');

$writer = new Xlsx($spreadsheet);
$writer->save('php://output');
exit;
