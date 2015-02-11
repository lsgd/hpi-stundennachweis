<?php

$_url = 'http://www.webcal.fi/cal.php?id=75&format=json&start_year=%s&end_year=%s&tz=Europe%%2FBerlin';

$url = sprintf($_url, date('Y') - 1, date('Y') + 10);

$content = file_get_contents($url);
$json = json_decode($content);

$output = array();

foreach($json as $item) {
    $output[$item->date] = true;
}

$h = fopen('tmp/holidays.json', 'w');
fwrite($h, json_encode($output));
fclose($h);

header("location: index.html");
exit();