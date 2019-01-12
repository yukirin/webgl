let c, gl, ext;
let then = 0;
let cubeTexture = null;
const m = new matIV();
const q = new qtnIV();
const textures = [];
const cameraQt = q.identity(q.create());

onload = function() {
  const eRange = document.getElementById('range');
  const eCheck = document.getElementById('checkbox');

  c = document.getElementById('canvas');
  c.width = 1280;
  c.height = 720;
  c.addEventListener('mousemove', mouseMove, true);

  gl = c.getContext('webgl2', {stencil: true});
  ext = getExtensions(gl);
  const prg = create_program('lighting.vert', 'x-vertex', 'lighting.frag', 'x-fragment');
  const reversePrg = create_program('reverse.vert', 'x-vertex', 'reverse.frag', 'x-fragment');
  const fBufferSize = 2048;
  create_texture('sample.jpg', 0);

  const trData = torus(64, 64, 0.1, 0.3);
  const vaos = {};
  vaos.torus = createVAO([trData.p], ['position,3'], [0], trData.i, prg);

  const [mMatrix, vMatrix, pMatrix, tmpMatrix, mvpMatrix, invTMatrix, invMatrix, tMatrix] = initialMatrix(8);
  const lightDirection = [1.0, 1.0, 2.0];
  const initCamPosition = [0.0, 3.0, 5.0];
  const initCamUpDirection = [0, 1, 0];
  const camPosition = [];
  const camUpDirection = [];
  const ambientColor = [0.10, 0.10, 0.10, 1.0];
  let count = 0;

  const ubos = linkUBO(
      ['matrix', 'material', 'misc'], [[mMatrix, invTMatrix, mvpMatrix], [1.0, 1.0, 0.0, 1.0], [1.0]],
      [prg, reversePrg])

  gl.depthFunc(gl.LEQUAL);
  gl.enable(gl.DEPTH_TEST);
  gl.frontFace(gl.CCW);
  gl.cullFace(gl.BACK);
  gl.enable(gl.CULL_FACE);
  // gl.enable(gl.STENCIL_TEST);
  // gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  // gl.blendEquationSeparate(gl.FUNC_ADD, gl.FUNC_ADD);
  // gl.enable(gl.BLEND);

  function render(
      scale, rad, axis, translate, textures, indexSize, updateNames, updateDatanum, isDrawPoints = false,
      isInstanced = false, insCount = 1) {
    bind_texture(textures);

    m.identity(mMatrix);
    m.translate(mMatrix, translate, mMatrix);
    m.rotate(mMatrix, rad, axis, mMatrix);
    m.scale(mMatrix, scale, mMatrix);

    m.multiply(tmpMatrix, mMatrix, mvpMatrix);

    m.inverse(mMatrix, invMatrix);
    m.transpose(invMatrix, invTMatrix);

    for (let i in updateNames) {
      updateUBO(ubos[updateNames[i]], updateDatanum[i]);
    }

    if (isInstanced) {
      gl.drawElementsInstanced(gl.TRIANGLES, indexSize, gl.UNSIGNED_SHORT, 0, insCount);
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
    const scale = eRange.value / 50.0;

    count++;
    const rad = (count % 720) * Math.PI / 360;
    const hsv = hsva((count / 2) % 360, 1, 1, 1);

    changePrgFramebuffer(prg, null, [c.width, c.height]);
    gl.bindVertexArray(vaos.torus);
    setVPMatrix(45, c.width, c.height, 0.1, 150);
    render(
        [1.0, 1.0, 1.0], rad, [1, 1, 1], [0, 0, 0], [], trData.i.length, ['matrix', 'misc'],
        [[mMatrix, mvpMatrix, invTMatrix], [scale]]);

    gl.useProgram(reversePrg);
    render(
        [1.0, 1.0, 1.0], rad, [1, 1, 1], [1, 0, 0], [], trData.i.length, ['matrix', 'misc'],
        [[mMatrix, mvpMatrix, invTMatrix], [scale]]);

    gl.flush();
    requestAnimationFrame(renderFrame);
  };

  requestAnimationFrame(renderFrame);
};