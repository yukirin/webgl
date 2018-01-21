function torus(circle_div, torus_div, circle_r, torus_r, color) {
    var pos = new Array(), col = new Array(), idx = new Array(), nor = new Array();

    for (var i = 0; i <= circle_div; i++) {
        var r = Math.PI * 2 / circle_div * i;
        var rx = Math.cos(r);
        var ry = Math.sin(r);

        for (var ii = 0; ii <= torus_div; ii++) {
            var tr = Math.PI * 2 / torus_div * ii;
            var tx = (rx * circle_r + torus_r) * Math.cos(tr);
            var ty = ry * circle_r;
            var tz = (rx * circle_r + torus_r) * Math.sin(tr);

            var rx2 = rx * Math.cos(tr);
            var rz = rx * Math.sin(tr);

            pos.push(tx, ty, tz);
            nor.push(rx2, ry, rz);

            if (color) {
                var tc = color;
            } else {
                var tc = hsva(360 / torus_div * ii, 1, 1, 1);
            }

            col.push(tc[0], tc[1], tc[2], tc[3]);
        }
    }

    for (i = 0; i < circle_div; i++) {
        for (ii = 0; ii < torus_div; ii++) {
            r = (torus_div + 1) * i + ii;
            idx.push(r, r + torus_div + 1, r + 1);
            idx.push(r + torus_div + 1, r + torus_div + 2, r + 1);
        }
    }

    return {p: pos, n: nor, c: col, i: idx};
}

function sphere(row, column, rad, color) {
    var pos = new Array(), nor = new Array(), col = new Array(), idx = new Array();

    for (var i = 0; i <= row; i++) {
        var r = Math.PI / row * i;
        var ry = Math.cos(r);
        var rr = Math.sin(r);

        for (var ii = 0; ii <= column; ii++) {
            var tr = Math.PI * 2 / column * ii;
            var tx = rr * rad * Math.cos(tr);
            var ty = ry * rad;
            var tz = rr * rad * Math.sin(tr);
            var rx = rr * Math.cos(tr);
            var rz = rr * Math.sin(tr);

            if (color) {
                var tc = color;
            } else {
                tc = hsva(360 / row * i, 1, 1, 1);
            }

            pos.push(tx, ty, tz);
            nor.push(rx, ry, rz);
            col.push(tc[0], tc[1], tc[2], tc[3]);
        }
    }

    r = 0;
    for (i = 0; i < row; i++) {
        for (ii = 0; ii < column; ii++) {
            r = (column + 1) * i + ii;
            idx.push(r, r + 1, r + column + 2);
            idx.push(r, r + column + 2, r + column + 1);
        }
    }
    return {p: pos, n: nor, c: col, i: idx};
}

function hsva(h, s, v, a) {
    if ( s > 1 || v > 1 || a > 1) { return; }

    var th = h % 360;
    var i = Math.floor(th / 60);
    var f = th / 60 - i;
    var m = v * (1 - s);
    var n = v * (1 - s * f);
    var k = v * (1 - s * (1 - f));
    var color = new Array();

    if (!s > 0 && !s < 0) {
        color.push(v, v, v, a);
    } else {
        var r = new Array(v, n, m, m, k, v);
        var g = new Array(k , v, v, n, m, m);
        var b = new Array(m, m, k, v, v, n);
        color.push(r[i], g[i], b[i], a);
    }
    return color;
}