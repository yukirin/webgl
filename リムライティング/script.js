let c, gl;
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
  c.width = 1024;
  c.height = 1024;
  c.addEventListener('mousemove', mouseMove, true);

  gl = c.getContext('webgl', {stencil: true}) || c.getContext('experimental-webgl', {stencil: true});
  const prg = create_program('lighting.vert', 'x-vertex', 'lighting.frag', 'x-fragment');

  const fBufferSize = 2048;
  // const fBuffer = create_framebuffer(fBufferSize, fBufferSize);

  const torusData = torus(64, 64, 0.10, 0.2);
  const trIndex = create_ibo(torusData.i);

  const [mMatrix, vMatrix, pMatrix, tmpMatrix, mvpMatrix, invTMatrix, invMatrix] = initialMatrix(7);
  const lightDirection = [.0, .0, -1.];
  const initCamPosition = [.0, .0, 1];
  const initCamUpDirection = [0, 1, 0];
  const camPosition = [];
  const camUpDirection = [];
  let count = 0;

  gl.depthFunc(gl.LEQUAL);
  gl.enable(gl.DEPTH_TEST);
  gl.frontFace(gl.CCW);
  gl.cullFace(gl.BACK);
  gl.enable(gl.CULL_FACE);
  // gl.enable(gl.STENCIL_TEST);
  // gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  // gl.blendEquationSeparate(gl.FUNC_ADD, gl.FUNC_ADD);
  // gl.enable(gl.BLEND);

  function render(scale, rad, axis, translate, textures, indexSize, ibo, linkValues, linkNames, linkTypes, prg) {
    bind_texture(textures);

    m.identity(mMatrix);
    m.translate(mMatrix, translate, mMatrix);
    m.rotate(mMatrix, rad, axis, mMatrix);
    m.scale(mMatrix, scale, mMatrix);

    m.multiply(tmpMatrix, mMatrix, mvpMatrix);

    m.inverse(mMatrix, invMatrix);
    m.transpose(invMatrix, invTMatrix);

    linkUniform(linkValues, linkNames, linkTypes, prg);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
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
    const rimCoef = eRange.value * 0.01;
    const rimPower = 3.5;

    count++;
    const rad = (count % 720) * Math.PI / 360;
    const hsv = hsva((count / 2) % 360, 1, 1, 1);

    changePrgFramebuffer(prg, null, [c.width, c.height]);
    setVPMatrix(45, c.width, c.height, 0.1, 100);
    linkAttribute([torusData.p, torusData.c, torusData.n], ['position', 'color', 'normal'], [3, 4, 3], prg);
    render(
        [1.0, 1.0, 1.0], Math.PI / 2, [1, 0, 0], [0.0, 0.0, 0.0], [], torusData.i.length, trIndex,
        [mMatrix, mvpMatrix, invTMatrix, lightDirection, camPosition, [1.0, 1.0, 1.0, 1.0], rimCoef, rimPower],
        ['mMatrix', 'mvpMatrix', 'invTMatrix', 'lightDirection', 'eyePosition', 'rimColor', 'rimCoef', 'rimPower'],
        ['m4', 'm4', 'm4', 'v3', 'v3', 'v4', 'f1', 'f1'], prg);

    gl.flush();
    requestAnimationFrame(renderFrame);
  };

  requestAnimationFrame(renderFrame);
};