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

function create_program(vs, fs) {
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

function linkAttribute(vbo, attL, attS) {
    for (var i in vbo) {
        gl.bindBuffer(gl.ARRAY_BUFFER, vbo[i]);
        gl.enableVertexAttribArray(attL[i]);
        gl.vertexAttribPointer(attL[i], attS[i], gl.FLOAT, false, 0, 0);
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

    img.onload = function() {
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