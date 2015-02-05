$(function() {
    std.init();
});

var std = {};

std.init = function() {
    $('#form-data').submit(std.submitForm);
    $('#form-start').val(new Date().getMonth() + 1);
    $('#year').text(new Date().getFullYear());
}

std.calculateQuartersToHours = function(restHours, distribution, output) {
    if(restHours <= 0) {
        return output;
    }

    var quarters = restHours / 0.25;
    var quartersPerDay = parseInt(quarters / distribution);
    quarters -= quartersPerDay * distribution;

    for(var no = 0; no < output.length; no ++) {
        output[no] += quartersPerDay * 0.25;
    }

    for(var no = 0; no < quarters; no++) {
        // Add remaining quarters to the first days
        output[no] += 0.25;
    }

    return output;
}

std.calculateEqualHoursPerDay = function(weekHours, distribution) {
    var hours = weekHours / distribution;
    var fullHours = parseInt(hours);
    hours = weekHours - (distribution * fullHours);

    var output = [];
    for(var no = 0; no < distribution; no ++) {
        output.push(fullHours);
    }

    if(hours == 0) {
        return output;
    }

    output = std.calculateQuartersToHours(hours, distribution, output);
    return output;
}

std.splitnum = function(num, lst) {
    if(num == 0) {
        return lst;
    }
    n = random.randint(0, num)
    return splitnum(num - n, lst + [n])
}

std.calculateRandomHoursPerDay = function(weekHours, distribution) {
    var output = [];
    for(var no = 0; no < distribution; no++) {
        var number = getRandomInt(1, Math.min(8, weekHours - distribution + 1 + no));

        output.push(number);
        weekHours -= number;
    }

    output = std.calculateQuartersToHours(weekHours, distribution, output);
    return output;
}

std.generateDayEvent = function(hours, dayStart) {
    var begin;

    switch(dayStart) {
        case 913:
            begin = getRandomInt(9, 13) + getRandomInt(0, 3) * 0.25;
            break;
        case 1330:
            begin = 13.5;
            break;
        case 1215:
            begin = getRandomInt(12, 15) + getRandomInt(0, 3) * 0.25;
            break;
        case 900:
        default:
            begin = 9;
            break;
    }

    var end = begin + hours;
    var pause = 0;
    if(hours > 6) {
        pause = 1;
        end += 1;
    }

    var startMinutes = (begin % 1) * 60;
    if(startMinutes == 0) startMinutes = '00';
    var stopMinutes = (end % 1) * 60;
    if(stopMinutes == 0) stopMinutes = '00';
    var sumMinutes = (hours % 1) * 100;
    if(sumMinutes == 0) sumMinutes = '00';

    var output = {
        'begin': parseInt(begin) + ':' + startMinutes,
        'end': parseInt(end) + ':' + stopMinutes,
        'pause': pause ? '1 Std.' : '',
        'sum': parseInt(hours) + ',' + sumMinutes,
        'hours': hours
    }

    return output;
}

std.generateWorkingHoursPerDay = function(distribution, distributionEqually, weekHours, duration, monthStart) {
    var $funcCalculate = distributionEqually ? std.calculateEqualHoursPerDay : std.calculateRandomHoursPerDay;
    var weeksPerMonth = [4.3, 4, 4.3, 4.2, 4.3, 4.2, 4.3, 4.3, 4.2, 4.3, 4.2, 4.3];

    var dayHours = [];
    var month;
    var hours;
    for(var no = 0; no < duration; no++) {
        month = (monthStart + no) % 12;
        if(month == 0) {
            month = 12;
        }
        dayHours.push([]);

        var weeks = weeksPerMonth[month - 1];
        for(var w = 1; w <= weeks; w++) {
            hours = $funcCalculate(weekHours, distribution);
            for(var k in hours) {
                dayHours[no].push(hours[k]);
            }
        }

        var restWeek = weeks % 1;
        if(restWeek <= 0) {
            continue;
        }

        restWeek *= 10;
        restWeek = Math.round(restWeek);
        var restWeekPercentage = restWeek / 7;
        var restWeekHours = restWeekPercentage * weekHours;
        var restQuarters = parseInt(restWeekHours / 0.25);
        if(restQuarters * 0.25 != restWeekHours) {
            restQuarters += 1;
        }
        var restWeekHours = restQuarters * 0.25;
        var restDistribution = Math.min(restWeek, distribution);

        if(distributionEqually) {
            while(restWeekHours > 0) {
                dayHours[no].push(Math.min(dayHours[0][0], restWeekHours));
                restWeekHours -= dayHours[0][0];
            }
        }
        else {
            hours = $funcCalculate(restWeekHours, restDistribution);
            for(var k in hours) {
                dayHours[no].push(hours[k]);
            }
        }
    }

    return dayHours;
}

std.submitForm = function(e) {
    e.preventDefault();

    var name = $('#form-name').val();
    if(name.trim() == '') {
        alert('Bitte gib einen Namen ein.');
        $('#form-name').focus();
        return;
    }

    var weekHours = $('#form-hours').val();
    weekHours = weekHours.replace(',', '.');
    if(weekHours.trim() == '' || isNaN(weekHours) || weekHours % 0.25 != 0) {
        alert('Bitte gib eine gültige Zahl ein.\nErlaubte Nachkommastellen: 0, 0.25, 0.5, 0.75');
        $('#form-hours').focus();
        return;
    }
    weekHours = parseFloat(weekHours);

    var duration = parseInt($('input[name=form-duration]:checked', $(this)).val());
    var monthStart = parseInt($('#form-start').val());

    var distribution = parseInt($('input[name=form-distribution]:checked', $(this)).val());
    var dayStart = parseInt($('input[name=form-daystart]:checked', $(this)).val());

    var distributionEqually = $('input[name=form-distribution-equally]:first', $(this)).is(':checked');

    var $print = $('#print');
    $print.empty();

    var workingHoursPerDay = std.generateWorkingHoursPerDay(distribution, distributionEqually, weekHours, duration, monthStart);
    var year = new Date().getFullYear();
    var _month = new Date().getMonth() + 1;
    for(var m = 0; m < duration; m++) {
        var month = ((monthStart + m) % 12);
        if(month == 0) {
            month = 12;
        }
        if(m == 0 && _month < month && month - _month >= 6) {
            year -= 1;
        }
        if(m > 0 && month == 1) {
            year += 1;
        }

        var $page = $('#templates .page').clone();
        $('.name_value', $page).text(name);
        $('.monthyear_value', $page).text(month + '/' + year);

        var day = 1;
        var currentDistribution = distribution;
        var sum = 0;
        for(var key in workingHoursPerDay[m]) {
            var event = std.generateDayEvent(workingHoursPerDay[m][key], dayStart);
            var $tr = $('tr.day.number'+day, $page);
            $('.begin', $tr).text(event.begin);
            $('.end', $tr).text(event.end);
            $('.pause', $tr).text(event.pause);
            $('.sum', $tr).text(event.sum);

            sum += event.hours;

            currentDistribution -= 1;
            day += 1;
            if(currentDistribution == 0) {
                day += 7 - distribution;
                currentDistribution = distribution;
            }
        }

        var sumMinutes = (sum % 1) * 100;
        if(sumMinutes == 0) sumMinutes = '00';
        var sumText = parseInt(sum) + ',' + sumMinutes;
        $('.sum span:first', $page).text(sumText);

        $print.append($page[0]);
        $print.append('<div class="page-separator"></div>');
    }

    window.print();
}

/**
 * Returns a random integer between min (inclusive) and max (inclusive)
 * Using Math.round() will give you a non-uniform distribution!
 */
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}