let c, gl, ext;
let then = 0;
let cubeTexture = null;
const m = new matIV();
const q = new qtnIV();
const textures = [];
const cameraQt = q.identity(q.create());
let mouseFlag = false;
let mousePositionX = 0.0;
let mousePositionY = 0.0;
let velocity = 0.0;
const MAX_VELOCITY = 2.0;
const SPEED = 0.02;

onload = function() {
  const eRange = document.getElementById('range');
  const eCheck = document.getElementById('checkbox');

  c = document.getElementById('canvas');
  c.width = 1024;
  c.height = 1024;
  c.addEventListener('mousemove', mousePos, true);
  c.addEventListener('mousedown', mouseDown, true);
  c.addEventListener('mouseup', mouseUp, true);

  gl = c.getContext('webgl', {stencil: true}) || c.getContext('experimental-webgl', {stencil: true});
  ext = getExtensions(gl);
  const prg = create_program('lighting.vert', 'x-vertex', 'lighting.frag', 'x-fragment');
  const fBufferSize = 2048;

  const particle = initParticle();
  const vaos = {};
  vaos.particle = ext.vao.createVertexArrayOES();

  const vbo = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
  gl.bufferData(gl.ARRAY_BUFFER, particle.p, gl.DYNAMIC_DRAW);
  ext.vao.bindVertexArrayOES(vaos.particle);
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
  let attLocation = gl.getAttribLocation(prg, 'position');
  gl.enableVertexAttribArray(attLocation);
  gl.vertexAttribPointer(attLocation, 2, gl.FLOAT, false, 0, 0);
  ext.vao.bindVertexArrayOES(null);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  const [mMatrix, vMatrix, pMatrix, tmpMatrix, mvpMatrix, invTMatrix, invMatrix, tMatrix] = initialMatrix(8);
  const lightDirection = [1.0, 1.0, 2.0];
  const initCamPosition = [0.0, 5.0, 6.0];
  const initCamUpDirection = [0, 1, 0];
  const camPosition = [];
  const camUpDirection = [];
  const ambientColor = [0.10, 0.10, 0.10, 1.0];
  let count = 0;

  gl.depthFunc(gl.LEQUAL);
  gl.enable(gl.DEPTH_TEST);
  gl.frontFace(gl.CCW);
  gl.cullFace(gl.BACK);
  gl.enable(gl.CULL_FACE);
  // gl.enable(gl.STENCIL_TEST);
  gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE, gl.ONE, gl.ONE);
  // gl.blendEquationSeparate(gl.FUNC_ADD, gl.FUNC_ADD);
  gl.enable(gl.BLEND);

  function render(
      scale, rad, axis, translate, textures, indexSize, linkValues, linkNames, linkTypes, prg, isDrawPoints = false,
      isInstanced = false, insCount = 1) {
    bind_texture(textures);

    m.identity(mMatrix);
    m.translate(mMatrix, translate, mMatrix);
    m.rotate(mMatrix, rad, axis, mMatrix);
    m.scale(mMatrix, scale, mMatrix);

    m.multiply(tmpMatrix, mMatrix, mvpMatrix);

    m.inverse(mMatrix, invMatrix);
    m.transpose(invMatrix, invTMatrix);

    linkUniform(linkValues, linkNames, linkTypes, prg);

    if (isInstanced) {
      ext.ins.drawElementsInstancedANGLE(gl.TRIANGLES, indexSize, gl.UNSIGNED_SHORT, 0, insCount);
      return;
    }

    if (isDrawPoints) {
      gl.drawArrays(gl.POINTS, 0, indexSize);
      return;
    }

    gl.drawElements(gl.TRIANGLES, indexSize, gl.UNSIGNED_SHORT, 0);
  }

  function setVPMatrix(fovy, width, height, near, far, isOrtho = false) {
    const center = [0.0, 0.0, 0.0];
    q.toVecIII(initCamPosition, cameraQt, camPosition);
    q.toVecIII(initCamUpDirection, cameraQt, camUpDirection);

    if (isOrtho) {
      m.lookAt([0.0, 0.0, 0.5], center, [0, 1, 0], vMatrix);
      m.ortho(-1.0, 1.0, 1.0, -1.0, 0.1, 100, pMatrix);
    } else {
      m.lookAt(camPosition, center, camUpDirection, vMatrix);
      m.perspective(fovy, width / height, near, far, pMatrix);
    }
    m.multiply(pMatrix, vMatrix, tmpMatrix);
  }



  function renderFrame(now) {
    now *= 0.001;
    const deltaTime = now - then;
    then = now;
    const state = eCheck.checked;
    const difference = eRange.value / 100;

    count++;
    const rad = (count % 720) * Math.PI / 360;
    const hsv = hsva((count / 2) % 360, 1, 1, 0.5);

    if (mouseFlag) {
      velocity = MAX_VELOCITY;
    } else {
      velocity *= 0.95;
    }

    updateParticle(particle);
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, particle.p);

    changePrgFramebuffer(prg, null, [c.width, c.height]);
    setVPMatrix(45, c.width, c.height, 0.1, 150);
    ext.vao.bindVertexArrayOES(vaos.particle);
    render(
        [1.0, 1.0, 1.0], rad, [1, 1, 1], [0, 0, 0], [], particle.resX * particle.resY, [hsv, 2.0],
        ['pointColor', 'pointSize'], ['v4', 'f1'], prg, true);

    gl.flush();
    requestAnimationFrame(renderFrame);
  };

  requestAnimationFrame(renderFrame);
};

function initParticle() {
  const position = [];
  const vector = [];
  const resolutionX = 100;
  const resolutionY = 100;
  const intervalX = 1.0 / resolutionX;
  const intervalY = 1.0 / resolutionY;
  const verticesCount = resolutionX * resolutionY;

  for (let i = 0; i < resolutionX; i++) {
    for (let j = 0; j < resolutionY; j++) {
      const x = i * intervalX * 2.0 - 1.0;
      const y = j * intervalY * 2.0 - 1.0;
      position.push(x, y);

      vector.push(0.0, 0.0);
    }
  }

  return {p: new Float32Array(position), v: vector, count: verticesCount, resX: resolutionX, resY: resolutionY};
}

function updateParticle(particle) {
  for (let i = 0; i < particle.resX; i++) {
    const k = i * particle.resX;
    for (let j = 0; j < particle.resY; j++) {
      const l = (k + j) * 2;

      if (mouseFlag) {
        const p = vectorUpdate(
            particle.p[l], particle.p[l + 1], mousePositionX, mousePositionY, particle.v[l], particle.v[l + 1]);
        particle.v[l] = p[0];
        particle.v[l + 1] = p[1];
      }

      particle.p[l] += particle.v[l] * velocity * SPEED;
      particle.p[l + 1] += particle.v[l + 1] * velocity * SPEED;
    }
  }
}

function vectorUpdate(x, y, tx, ty, vx, vy) {
  let px = tx - x;
  let py = ty - y;

  let r = Math.sqrt(px * px + py * py) * 5.0;
  if (r !== 0.0) {
    px /= r;
    py /= r;
  }

  px += vx;
  py += vy;
  r = Math.sqrt(px * px + py * py);
  if (r !== 0.0) {
    px /= r;
    py /= r;
  }

  return [px, py];
}

function mouseDown(eve) {
  mouseFlag = true;
}

function mouseUp(eve) {
  mouseFlag = false;
}

function mousePos(eve) {
  if (mouseFlag) {
    const cw = c.width;
    const ch = c.height;
    mousePositionX = (eve.clientX - c.offsetLeft - cw / 2.0) / cw * 2.0;
    mousePositionY = -(eve.clientY - c.offsetTop - ch / 2.0) / ch * 2.0;
  }
}