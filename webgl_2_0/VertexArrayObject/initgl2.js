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

function setAttribute(vbos, attLName_S, prg) {
  for (let i in vbos) {
    const [name, stride] = attLName_S[i].split(',');
    let attLocation = gl.getAttribLocation(prg, name);

    gl.bindBuffer(gl.ARRAY_BUFFER, vbos[i]);
    gl.enableVertexAttribArray(attLocation);
    gl.vertexAttribPointer(attLocation, parseInt(stride), gl.FLOAT, false, 0, 0);
  }
}

function linkAttribute(datanum, attLName_S, insDivs, prg) {
  let stride = 0;
  const interleaveStrides = [], interleaveNames = [];
  const insStrides = [], insNames = [], divs = [];
  const interleaveData = [], insData = [];

  for (let i in attLName_S) {
    const [n, s] = attLName_S[i].split(',');
    if (insDivs[i] == 0) {
      stride += parseInt(s);
      interleaveStrides.push(parseInt(s));
      interleaveNames.push(n);
      interleaveData.push(datanum[i]);
    } else {
      insData.push(datanum[i]);
      insStrides.push(parseInt(s));
      insNames.push(n);
      divs.push(insDivs[i]);
    }
  }

  const byteLength = stride * 4;  // gl.FLOAT === 32bit === 4byte
  const vertexBufferData = createInterleaveBuffer(interleaveData, interleaveStrides);
  const vbo = create_vbo(vertexBufferData);
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo);

  let countStride = 0;
  for (let i in interleaveData) {
    const attLocation = gl.getAttribLocation(prg, interleaveNames[i]);

    gl.enableVertexAttribArray(attLocation);
    gl.vertexAttribPointer(attLocation, interleaveStrides[i], gl.FLOAT, false, byteLength, countStride * 4);
    countStride += interleaveStrides[i];
  }
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  for (let i in insData) {
    const vbo = create_vbo(insData[i]);
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    const attLocation = gl.getAttribLocation(prg, insNames[i]);

    gl.enableVertexAttribArray(attLocation);
    gl.vertexAttribPointer(attLocation, insStrides[i], gl.FLOAT, false, 0, 0);
    ext.ins.vertexAttribDivisorANGLE(attLocation, divs[i]);
  }
  gl.bindBuffer(gl.ARRAY_BUFFER, null);
}

function linkUniform(datanum, uniformNames_Types, prg) {
  for (let i in datanum) {
    const [name, type] = uniformNames_Types[i].split(',');
    let loc = gl.getUniformLocation(prg, name);

    switch (type) {
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
      case 'v2':
        gl.uniform2fv(loc, datanum[i]);
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

function create_texture(source, number, canvasElement = null) {
  if (canvasElement) {
    let tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvasElement);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, ext.aft.TEXTURE_MAX_ANISOTROPY_EXT, 16);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);

    textures[number] = tex;
    gl.bindTexture(gl.TEXTURE_2D, null);

    return;
  }

  let img = new Image();
  img.onload = function() {
    let tex = gl.createTexture();

    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, ext.aft.TEXTURE_MAX_ANISOTROPY_EXT, 16);
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

function create_framebuffer(width, height, isDepthTexture = false, isFloatTexture = false, mrtCount = 1, targets = []) {
  let frameBuffer = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);

  let depthBuffer;
  if (isDepthTexture) {
    depthBuffer = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, depthBuffer);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT, width, height, 0, gl.DEPTH_COMPONENT, gl.UNSIGNED_INT, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, depthBuffer, 0);
    gl.bindTexture(gl.TEXTURE_2D, null);
  } else {
    depthBuffer = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthBuffer);
  }

  const fTexture = [];

  if (targets.length == 0) {
    for (let i = 0; i < mrtCount; i++) {
      fTexture[i] = gl.createTexture();
      const textureType = isFloatTexture ? gl.FLOAT : gl.UNSIGNED_BYTE;
      const textureFilter = isFloatTexture ? gl.NEAREST : gl.LINEAR;

      gl.bindTexture(gl.TEXTURE_2D, fTexture[i]);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, textureType, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, textureFilter);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, textureFilter);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, ext.MRT.COLOR_ATTACHMENT0_WEBGL + i, gl.TEXTURE_2D, fTexture[i], 0);
      gl.bindTexture(gl.TEXTURE_2D, null);
    }
  } else {
    fTexture[0] = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, fTexture[0]);

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

  return {f: frameBuffer, d: depthBuffer, t: fTexture};
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

function plane(color = [1.0, 1.0, 1.0, 1.0]) {
  const position = [-1.0, 0.0, -1.0, 1.0, 0.0, -1.0, -1.0, 0.0, 1.0, 1.0, 0.0, 1.0];
  const uv = [0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 1.0, 1.0];
  const normal = [0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0];
  const colors = [...color, ...color, ...color, ...color];
  const index = [0, 2, 1, 3, 1, 2];

  return {p: position, c: colors, n: normal, i: index, t: uv};
}

function halfBox(color = [1.0, 1.0, 1.0, 1.0]) {
  const uv = [0.0, 1.0, 1.0, 1.0, 0.0, 0.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0, 0.0, 0.0];
  const normal =
      [0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 0.0];
  const colors = [...color, ...color, ...color, ...color, ...color, ...color, ...color];
  const position =
      [1.0, 1.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0, -1.0, 0.0, 0.0, -1.0, -1.0, 1.0, 0.0, -1.0, 0.0, 0.0, 0.0, 0.0, 1.0];
  const index = [0, 2, 3, 0, 3, 1, 2, 4, 5, 2, 5, 3, 1, 3, 5, 1, 5, 6];

  return {p: position, c: colors, n: normal, i: index, t: uv};
}

function particlePlane(color = [1.0, 1.0, 1.0, 1.0]) {
  const position = [-1.0, 1.0, 0.0, 1.0, 1.0, 0.0, -1.0, -1.0, 0.0, 1.0, -1.0, 0.0];
  const colors = [...color, ...color, ...color, ...color];
  const normal = [0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0];
  const uv = [0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 1.0, 1.0];
  const index = [0, 2, 1, 1, 2, 3];

  return {p: position, c: colors, n: normal, i: index, t: uv};
}

function changePrgFramebuffer(
    prg, fBuffer, viewport, initColor = [0.0, 0.0, 0.0, 1.0], initDepth = 1.0, initStencil = 0.0, mrtCount = 1) {
  gl.useProgram(prg);
  gl.bindFramebuffer(gl.FRAMEBUFFER, fBuffer);

  if (fBuffer != null) {
    const bufferList = [];
    for (let i = 0; i < mrtCount; i++) {
      bufferList[i] = ext.MRT.COLOR_ATTACHMENT0_WEBGL + i;
    }
    ext.MRT.drawBuffersWEBGL(bufferList);
  }

  gl.viewport(0.0, 0.0, viewport[0], viewport[1]);
  clearBuffer(initColor, initDepth, initStencil);
}

function gaussian_weight(size, dis) {
  var weight = new Array(size);
  var t = 0.0;
  var d = dis * dis / 10;
  for (var i = 0; i < weight.length; i++) {
    var r = 0.0 + 2.0 * i;
    var w = Math.exp(-0.5 * (r * r) / d);
    weight[i] = w;
    if (i > 0) {
      w *= 2.0;
    }
    t += w;
  }
  for (i = 0; i < weight.length; i++) {
    weight[i] /= t;
  }
  return weight;
}

function createNoiseT(width = 128) {
  const n = new noiseX(5, 2, 0.6);
  n.setSeed(new Date().getTime());
  const noiseColor = new Array(width * width);

  for (let i = 0; i < width; i++) {
    for (let j = 0; j < width; j++) {
      noiseColor[i * width + j] = n.snoise(i, j, 128);
      noiseColor[i * width + j] *= noiseColor[i * width + j];
    }
  }

  return n.canvasExport(noiseColor, width);
}

function getParticleOffsets(particleCount = 30) {
  const offsetPositionX = new Array(particleCount);
  const offsetPositionZ = new Array(particleCount);
  const offsetPositionY = new Array(particleCount);
  const offsetPositionS = new Array(particleCount);
  const offsetTexCoordS = new Array(particleCount);
  const offsetTexCoordT = new Array(particleCount);

  for (i = 0; i < particleCount; i++) {
    offsetPositionX[i] = Math.random() * 6.0 - 3.0;
    offsetPositionZ[i] = -Math.random() * 1.5 + 0.5;
    offsetPositionY[i] = 0.0;
    offsetPositionS[i] = Math.random() * 0.02;
    offsetTexCoordS[i] = Math.random();
    offsetTexCoordT[i] = Math.random();
  }

  offsetPositionZ.sort(function(a, b) {
    return a - b;
  });

  return {
    x: offsetPositionX,
    y: offsetPositionY,
    z: offsetPositionZ,
    speed: offsetPositionS,
    s: offsetTexCoordS,
    t: offsetTexCoordT
  };
}

function getExtensions(context) {
  context.getExtension('WEBGL_depth_texture');
  context.getExtension('EXT_frag_depth');
  context.getExtension('OES_texture_float');
  context.getExtension('OES_texture_float_linear');
  context.getExtension('WEBGL_color_buffer_float');
  context.getExtension('OES_standard_derivatives');
  const extAFT = context.getExtension('EXT_texture_filter_anisotropic');
  const extIns = context.getExtension('ANGLE_instanced_arrays');
  const extMRT = context.getExtension('WEBGL_draw_buffers');

  return {
    aft: extAFT, ins: extIns, MRT: extMRT
  }
}

function createVAO(datanum, attLName_S, insDivs, indexData, prg) {
  const vao = gl.createVertexArray();
  const ibo = create_ibo(indexData);

  gl.bindVertexArray(vao);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
  linkAttribute(datanum, attLName_S, insDivs, prg);
  gl.bindVertexArray(null);

  return vao;
}

function SettingVideoTexture(button, number) {
  button.addEventListener('click', function() {
    button.value = 'running';
    button.disabled = true;
    video.play();
    textures[number] = videoTexture;
  }, true);

  const video = document.createElement('video');
  video.addEventListener('canplaythrough', function() {
    if (button.value !== 'running') {
      button.value = 'can play video';
      button.disabled = false;
    }
  }, true);

  video.addEventListener('ended', function() {
    video.play();
  }, true);

  const videoTexture = gl.createTexture(gl.TEXTURE_2D);
  gl.bindTexture(gl.TEXTURE_2D, videoTexture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  video.src = 'video.mp4';
  return video;
}

function createInterleaveBuffer(datanum, strides) {
  const vertexBuffer = [];
  const dataLength = datanum[0].length / strides[0];

  for (let i = 0; i < dataLength; i++) {
    for (let n in datanum) {
      const start = i * strides[n];
      const end = start + strides[n];
      vertexBuffer.push(...datanum[n].slice(start, end));
    }
  }

  return vertexBuffer;
}