var hue = [];
google.charts.load('current', {
    'packages': ['corechart']
});

function hslToRgb(h, s, l) {
    var r, g, b;
    if (s === 0) {
        r = g = b = l; // achromatic
    } else {
        var hue2rgb = function hue2rgb(p, q, t) {
            if (t < 0) {
                t += 1;
            }
            if (t > 1) {
                t -= 1;
            }
            if (t < 1 / 6) {
                return p + (q - p) * 6 * t;
            }
            if (t < 1 / 2) {
                return q;
            }
            if (t < 2 / 3) {
                return p + (q - p) * (2 / 3 - t) * 6;
            }
            return p;
        };

        var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        var p = 2 * l - q;
        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
    }
    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}


function rgbToHsl(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;
    var max = Math.max(r, g, b),
        min = Math.min(r, g, b);
    var h, s, l = (max + min) / 2;
    if (max === min) {
        h = s = 0; // achromatic
    } else {
        var d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r:
                h = (g - b) / d + (g < b ? 6 : 0);
                break;
            case g:
                h = (b - r) / d + 2;
                break;
            case b:
                h = (r - g) / d + 4;
                break;
        }
        h /= 6;
    }

    return [h, s, l];
}

$(document).ready(function () {
    var imageLoader = document.getElementById('imageLoader');
    imageLoader.addEventListener('change', handleImage, false);
    var canvas = document.getElementById('imageCanvas');
    var container = document.getElementById('outside');
    var ctx = canvas.getContext('2d');

    function handleImage(e) {
        // Draw the image
        var reader = new FileReader();
        reader.onload = function (event) {
            var img = new Image();
            img.onload = function () {
                //canvas.width = img.width;
                //canvas.height = img.height;
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0, img.width,    img.height,    // source rectangle
                   0, 0, canvas.width, canvas.height);
                //drawGraph();
            };
            img.src = event.target.result;
        }
        reader.readAsDataURL(e.target.files[0]);
    }


    function drawGraph() {
        // get the data
        var imgd = ctx.getImageData(0, 0, canvas.width, canvas.height);
        var data = imgd.data;

        for (var i = 0; i < 361; i++) {
            hue[i] = 0;
        }

        for (var i = 0; i < data.length; i += 4) {
            var r = data[i],
                g = data[i + 1],
                b = data[i + 2]
            var hsl = rgbToHsl(r, g, b);
            if (hsl[1] !== 0) {
                var h = Math.floor(hsl[0] * 360);
                hue[h] = hue[h] + 1;
            }
        }


        // Set a callback to run when the Google Visualization API is loaded.
        google.charts.setOnLoadCallback(drawChart);

        function drawChart() {
            // Create the data table.
            var dataTable = new google.visualization.DataTable();
            dataTable.addColumn('string', 'Color');
            dataTable.addColumn('number', 'Counts');
            dataTable.addColumn({
                type: 'string',
                role: 'style'
            });


            for (i = 0; i < 361; i++) {
                var s = i.toString();
                var colorRGB = hslToRgb(i / 360.0, 1, 0.5);
                var c = "color: rgb(" + colorRGB[0] + ", " + colorRGB[1] + ", " + colorRGB[2] + ")";
                dataTable.addRow([s, hue[i], c]);
            }

            // Set chart options
            var options = {
                'title': 'Color graph',
                //'width': 1000,
                //'height': 500,
                legend: 'none'
            };

            // Instantiate and draw our chart, passing in some options.
            var chart = new google.visualization.ColumnChart(document.getElementById('chart_div'));
            chart.draw(dataTable, options);
        }
    }
});