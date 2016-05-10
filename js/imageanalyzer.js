// TODOS
/*
    1. Google charts bars growing animation (if not possible consider using d3)
    2. Make the charts responsive (resizing problem)   
        - make all 360 values display in the div 
    3. Starting animation 
    4. Make canvas image fit correctly
*/

var hue = [];
var scale = 2;

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

function startingAnimation() {
    // animation
    $('#curtain').animate({
        width: "50px",
        height: "25px"
    }, 1000, function () {
        $("#curtain").remove();
        $("#loadButton").animate({
            left: -$("#loadButton").parent().width() + $("#loadButton").width() + 20,
            top: -$("#loadButton").parent().height() + $("#loadButton").height() + 30
        }, 1000, function () {
            $("#loadButton").css({
                "top": "11px",
                "bottom": "auto",
                "left": "8px",
                "right": "auto"
            });
        });

    });
}

function fitImage(canvas, context, imageObj) {
	var imageAspectRatio = imageObj.width / imageObj.height;
	var canvasAspectRatio = canvas.width / canvas.height;
    var renderableHeight, renderableWidth, xStart, yStart;

	// If image's aspect ratio is less than canvas's we fit on height
	// and place the image centrally along width
	if(imageAspectRatio < canvasAspectRatio) {
		renderableHeight = canvas.height;
		renderableWidth = imageObj.width * (renderableHeight / imageObj.height);
		xStart = (canvas.width - renderableWidth) / 2;
        yStart = 0;
	}

	// If image's aspect ratio is greater than canvas's we fit on width
	// and place the image centrally along height
	else if(imageAspectRatio > canvasAspectRatio) {
		renderableWidth = canvas.width;
		renderableHeight = imageObj.height * (renderableWidth / imageObj.width);
		xStart = 0;
		yStart = (canvas.height - renderableHeight) / 2;
	}

	// Happy path - keep aspect ratio
	else {
		renderableHeight = canvas.height;
		renderableWidth = canvas.width;
		xStart = 0;
		yStart = 0;
	}
	context.drawImage(imageObj, xStart, yStart, renderableWidth, renderableHeight);
}


$(document).ready(function () {
    var imageLoader = document.getElementById('imageLoader');
    imageLoader.addEventListener('change', handleImage, false);
    var canvas = document.getElementById('imageCanvas');
    var container = document.getElementById('outside');
    var ctx = canvas.getContext('2d');
    
    

    function handleImage(e) {
        canvas.width = $("#div1").width(); 
        canvas.height = $("#div1").height();
        // Draw the image
        var reader = new FileReader();
        reader.onload = function (event) {
            var img = new Image();
            img.onload = function () {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                //ctx.drawImage(img, 0, 0, img.width, img.height, // source rectangle
                    //0, 0, canvas.width, canvas.height);
                fitImage(canvas, ctx, img);
                drawGraph();
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
                if (i % scale === 0) {
                    var sum = 0;
                    for (j = 0; j < scale; j++) {
                        sum += hue[i + j];
                    }
                    dataTable.addRow([s, sum, c]);
                }
            }
            var chartdiv = document.getElementById('chart_div');
            // Set chart options
            var options = {
                'title': 'Color graph',
                'width': chartdiv.width,
                'height': chartdiv.height,
                legend: 'none'
            };

            // Instantiate and draw our chart, passing in some options.
            var chart = new google.visualization.ColumnChart(document.getElementById('chart_div'));
            chart.draw(dataTable, options);
            // Start the drawing animation
            startingAnimation();
        }
    }
});