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
  const initPrg = create_program('init.vert', 'x-vertex', 'init.frag', 'x-fragment');
  const updatePrg = create_program('update.vert', 'x-vertex', 'update.frag', 'x-fragment');
  const readPrg = create_program('read.vert', 'x-vertex', 'read.frag', 'x-fragment');
  const fBufferSize = 512;
  const particleCount = fBufferSize * fBufferSize;

  let frontFB = create_framebuffer(fBufferSize, fBufferSize, false, true);
  let backFB = create_framebuffer(fBufferSize, fBufferSize, false, true);

  const pData = plane();
  const indices = new Array(fBufferSize * fBufferSize);
  for (let i = 0; i < particleCount; i++) {
    indices[i] = i;
  }
  const vaos = {};
  vaos.initPlane = createVAO([pData.p], ['position'], [3], [0], pData.i, initPrg);
  vaos.updatePlane = createVAO([pData.p], ['position'], [3], [0], pData.i, updatePrg);
  vaos.index = createVAO([indices], ['index'], [1], [0], [], readPrg);

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


  gl.disable(gl.BLEND);
  changePrgFramebuffer(initPrg, backFB.f, [fBufferSize, fBufferSize], [0.0, 0.0, 0.0, 0.0]);
  setVPMatrix(45, c.width, c.height, 0.1, 150, true);
  ext.vao.bindVertexArrayOES(vaos.initPlane);
  render(
      [1.0, 1.0, 1.0], Math.PI / 2, [1, 0, 0], [0, 0, 0], [], pData.i.length, [mvpMatrix, [fBufferSize, fBufferSize]],
      ['mvpMatrix', 'resolution'], ['m4', 'v2'], initPrg);

  function renderFrame(now) {
    now *= 0.001;
    const deltaTime = now - then;
    then = now;
    const state = eCheck.checked;
    const difference = eRange.value / 100;

    count++;
    const rad = (count % 720) * Math.PI / 360;
    const hsv = hsva((count / 2) % 360, 1, 1, 0.5);
    const mouse = [mousePositionX, mousePositionY];
    if (mouseFlag) {
      velocity = 1.0;
    } else {
      velocity *= 0.95;
    }

    gl.disable(gl.BLEND);
    changePrgFramebuffer(updatePrg, frontFB.f, [fBufferSize, fBufferSize], [0.0, 0.0, 0.0, 0.0]);
    ext.vao.bindVertexArrayOES(vaos.updatePlane);
    render(
        [1.0, 1.0, 1.0], Math.PI / 2, [1, 0, 0], [0, 0, 0], [backFB.t], pData.i.length,
        [mvpMatrix, [fBufferSize, fBufferSize], 0, mouse, mouseFlag, velocity],
        ['mvpMatrix', 'resolution', 'texture', 'mouse', 'mouseFlag', 'velocity'], ['m4', 'v2', 'i1', 'v2', 'i1', 'f1'],
        updatePrg);

    gl.enable(gl.BLEND);
    changePrgFramebuffer(readPrg, null, [c.width, c.height]);
    ext.vao.bindVertexArrayOES(vaos.index);
    render(
        [1.0, 1.0, 1.0], 0, [1, 0, 1], [0, 0, 0], [frontFB.t], particleCount,
        [[fBufferSize, fBufferSize], 0, velocity, hsv], ['resolution', 'texture', 'pointScale', 'ambient'],
        ['v2', 'i1', 'f1', 'v4'], readPrg, true);

    [frontFB, backFB] = [backFB, frontFB];
    gl.flush();
    requestAnimationFrame(renderFrame);
  };

  requestAnimationFrame(renderFrame);
};

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