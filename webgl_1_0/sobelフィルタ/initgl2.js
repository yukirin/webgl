function create_shader(fileName, fileType) {
  let shader;

  let request = new XMLHttpRequest();
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
  let matrixes = [];

  for (let i = 0; i < num; i++) {
    matrixes.push(m.identity(m.create()));
  }
  return matrixes;
}

function clearBuffer(clearColor, clearDepth, clearStencil) {
  gl.clearColor(...clearColor);
  gl.clearDepth(clearDepth);
  gl.clearStencil(clearStencil);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);
}

function getMvpMatrix(mMatrix, eye, center, up, fovy, aspect, near, far) {
  let vMatrix = m.identity(m.create());
  let pMatrix = m.identity(m.create());
  let mvpMatrix = m.identity(m.create());

  m.lookAt(eye, center, up, vMatrix);
  m.perspective(fovy, aspect, near, far, pMatrix);

  m.multiply(pMatrix, vMatrix, mvpMatrix);
  m.multiply(mvpMatrix, mMatrix, mvpMatrix);

  return mvpMatrix;
}

function create_program(vsFileName, vsFileType, fsFileName, fsFileType) {
  let vs = create_shader(vsFileName, vsFileType);
  let fs = create_shader(fsFileName, fsFileType);

  let program = gl.createProgram();
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
  let vbo = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo);

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  return vbo;
}

function setAttribute(vbos, attLName, attS, prg) {
  for (let i in vbos) {
    let attLocation = gl.getAttribLocation(prg, attLName[i]);

    gl.bindBuffer(gl.ARRAY_BUFFER, vbos[i]);
    gl.enableVertexAttribArray(attLocation);
    gl.vertexAttribPointer(attLocation, attS[i], gl.FLOAT, false, 0, 0);
  }
}

function linkAttribute(datanum, attLName, attS, prg) {
  for (let i in datanum) {
    let vbo = create_vbo(datanum[i]);
    let attLocation = gl.getAttribLocation(prg, attLName[i]);

    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.enableVertexAttribArray(attLocation);
    gl.vertexAttribPointer(attLocation, attS[i], gl.FLOAT, false, 0, 0);
  }
}

function linkUniform(datanum, uniformNames, uniformTypes, prg) {
  for (let i in datanum) {
    let loc = gl.getUniformLocation(prg, uniformNames[i]);

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
      case 'f1':
        gl.uniform1f(loc, datanum[i]);
        break;
      case 'f1v':
        gl.uniform1fv(loc, datanum[i]);
        break;
      default:
        break;
    }
  }
}

function create_ibo(data) {
  let ibo = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Int16Array(data), gl.STATIC_DRAW);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

  return ibo;
}

function create_texture(source, number) {
  let img = new Image();

  img.onload = function() {
    let tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    textures[number] = tex;
    gl.bindTexture(gl.TEXTURE_2D, null);
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
  let cw = c.width;
  let ch = c.height;
  let wh = 1 / Math.sqrt(cw * cw + ch * ch);

  let x = e.clientX - c.offsetLeft - cw * 0.5;
  let y = e.clientY - c.offsetTop - ch * 0.5;

  let sq = Math.sqrt(x * x + y * y);
  let r = sq * 2.0 * Math.PI * wh;
  if (sq != 1) {
    sq = 1 / sq;
    x *= sq;
    y *= sq;
  }

  q.rotate(r, [y, x, 0.0], cameraQt);
}

function create_framebuffer(width, height, targets) {
  let frameBuffer = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);

  let depthRenderBuffer = gl.createRenderbuffer();
  gl.bindRenderbuffer(gl.RENDERBUFFER, depthRenderBuffer);
  gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);
  gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthRenderBuffer);

  let fTexture = gl.createTexture();

  if (targets.length == 0) {
    gl.bindTexture(gl.TEXTURE_2D, fTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, fTexture, 0);
    gl.bindTexture(gl.TEXTURE_2D, null);
  } else {
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, fTexture);

    for (let i in targets) {
      gl.texImage2D(targets[i], 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    }
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
  }

  gl.bindRenderbuffer(gl.RENDERBUFFER, null);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);

  return {f: frameBuffer, d: depthRenderBuffer, t: fTexture};
}

function bind_texture(textures) {
  const units = [
    gl.TEXTURE0,
    gl.TEXTURE1,
    gl.TEXTURE2,
    gl.TEXTURE3,
    gl.TEXTURE4,
    gl.TEXTURE5,
    gl.TEXTURE6,
    gl.TEXTURE7,
    gl.TEXTURE8,
    gl.TEXTURE9,
  ];

  for (let i in textures) {
    gl.activeTexture(units[i]);
    gl.bindTexture(gl.TEXTURE_2D, textures[i]);
  }
}

function create_cube_texture(source, target) {
  let cImg = new Array();

  for (let i = 0; i < source.length; i++) {
    cImg[i] = new cubeMapImage();
    cImg[i].data.src = source[i];
  }

  function cubeMapImage() {
    this.data = new Image();

    this.data.onload = function() {
      this.imageDataLoaded = true;
      checkLoaded();
    };
  }

  function checkLoaded() {
    if (cImg[0].data.imageDataLoaded && cImg[1].data.imageDataLoaded && cImg[2].data.imageDataLoaded &&
        cImg[3].data.imageDataLoaded && cImg[4].data.imageDataLoaded && cImg[5].data.imageDataLoaded) {
      generateCubeMap();
    }
  }

  function generateCubeMap() {
    let tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, tex);

    for (let j = 0; j < source.length; j++) {
      gl.texImage2D(target[j], 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, cImg[j].data);
    }

    gl.generateMipmap(gl.TEXTURE_CUBE_MAP);

    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    cubeTexture = tex;
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
  }
}

function plane(color) {
  const position = [-1.0, 0.0, -1.0, 1.0, 0.0, -1.0, -1.0, 0.0, 1.0, 1.0, 0.0, 1.0];
  const uv = [0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 1.0, 1.0];
  const normal = [0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0];
  const colors = [...color, ...color, ...color, ...color];
  const index = [0, 2, 1, 3, 1, 2];

  return {p: position, c: colors, n: normal, i: index, t: uv};
}
