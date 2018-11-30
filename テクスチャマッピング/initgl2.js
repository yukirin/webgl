function create_shader(fileName, fileType) {
    var shader;

    var request = new XMLHttpRequest();
    request.open('GET', fileName, false);
    request.overrideMimeType('text/html');
    request.send(null);

    switch (fileType) {
        case 'x-vertex':
            shader = gl.createShader(gl.VERTEX_SHADER);
            break;

        case 'x-fragment':
            shader = gl.createShader(gl.FRAGMENT_SHADER);
            break;

        default:
            return;
    }
    gl.shaderSource(shader, request.responseText);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert(gl.getShaderInfoLog(shader));
    }

    return shader;
}

function initialMatrix(num) {
    var matrixes = [];

    for (var i = 0; i < num; i++) {
        matrixes.push(m.identity(m.create()));
    }
    return matrixes;
}

function clearBuffer(clearColor, clearDepth) {
    gl.clearColor(...clearColor);
    gl.clearDepth(clearDepth);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
}

function getMvpMatrix(mMatrix, eye, center, up, fovy, aspect, near, far) {
    var vMatrix = m.identity(m.create());
    var pMatrix = m.identity(m.create());
    var mvpMatrix = m.identity(m.create());

    m.lookAt(eye, center, up, vMatrix);
    m.perspective(fovy, aspect, near, far, pMatrix);

    m.multiply(pMatrix, vMatrix, mvpMatrix);
    m.multiply(mvpMatrix, mMatrix, mvpMatrix);

    return mvpMatrix;
}

function create_program(vsFileName, vsFileType, fsFileName, fsFileType) {
    var vs = create_shader(vsFileName, vsFileType);
    var fs = create_shader(fsFileName, fsFileType);

    var program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);

    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        alert(gl.getProgramInfoLog(program));
    }

    gl.useProgram(program);
    return program;
}

function create_vbo(data) {
    var vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    return vbo;
}

function setAttribute(vbos, attLName, attS, prg) {
    for (var i in vbos) {
        var attLocation = gl.getAttribLocation(prg, attLName[i]);

        gl.bindBuffer(gl.ARRAY_BUFFER, vbos[i]);
        gl.enableVertexAttribArray(attLocation);
        gl.vertexAttribPointer(attLocation, attS[i], gl.FLOAT, false, 0, 0);
    }
}

function linkAttribute(datanum, attLName, attS, prg) {
    for (var i in datanum) {
        var vbo = create_vbo(datanum[i]);
        var attLocation = gl.getAttribLocation(prg, attLName[i]);

        gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
        gl.enableVertexAttribArray(attLocation);
        gl.vertexAttribPointer(attLocation, attS[i], gl.FLOAT, false, 0, 0);
    }
}

function linkUniform(datanum, uniformNames, uniformTypes, prg) {
    for (var i in datanum) {
        var loc = gl.getUniformLocation(prg, uniformNames[i]);

        switch (uniformTypes[i]) {
            case 'm4':
                gl.uniformMatrix4fv(loc, false, datanum[i]);
                break;
            case 'v3':
                gl.uniform3fv(loc, datanum[i]);
                break;
            case 'v4':
                gl.uniform4fv(loc, datanum[i]);
                break;
            case 'i1':
                gl.uniform1i(loc, datanum[i]);
                break;
            default:
                break;
        }
    }
}

function create_ibo(data) {
    var ibo = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Int16Array(data), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

    return ibo;
}

function create_texture(source, number) {
    var img = new Image();

    img.onload = function () {
        var tex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.bindTexture(gl.TEXTURE_2D, null);

        switch (number) {
            case 0:
                texture = tex;
                break;
            case 1:
                texture1 = tex;
                break;
            default:
                break;
        }
    };

    img.src = source;
}

function blend_type(prm) {
    switch (prm) {
        case 0:
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
            break;
        case 1:
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
            break;
        default:
            break;
    }
}

function mouseMove(e) {
    var cw = c.width;
    var ch = c.height;
    var wh = 1 / Math.sqrt(cw * cw + ch * ch);

    var x = e.clientX - c.offsetLeft - cw * 0.5;
    var y = e.clientY - c.offsetTop - ch * 0.5;

    var sq = Math.sqrt(x * x + y * y);
    var r = sq * 2.0 * Math.PI * wh;
    if (sq != 1) {
        sq = 1 / sq;
        x *= sq;
        y *= sq;
    }

    q.rotate(r, [y, x, 0.0], qt);
}