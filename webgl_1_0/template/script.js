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

  gl = c.getContext('webgl', {stencil: true}) || c.getContext('experimental-webgl', {stencil: true});
  ext = getExtensions(gl);
  const prg = create_program('lighting.vert', 'x-vertex', 'lighting.frag', 'x-fragment');
  create_texture('texture.png', 0);

  const fBufferSize = 2048;

  const trData = torus(64, 64, 0.08, 0.15);
  const instanceCount = 100;
  const instancePositions = new Array();
  const instanceColors = new Array();
  const offsetPosition = 3;
  const offsetColor = 4;

  for (var i = 0; i < instanceCount; i++) {
    var j = i % 10;
    var k = Math.floor(i / 10) * 0.5 + 0.5;
    var rad = (3600 / instanceCount) * j * Math.PI / 180;
    instancePositions[i * offsetPosition] = Math.cos(rad) * k;
    instancePositions[i * offsetPosition + 1] = 0.0;
    instancePositions[i * offsetPosition + 2] = Math.sin(rad) * k;

    var hsv = hsva((3600 / instanceCount) * i, 1.0, 1.0, 1.0);
    instanceColors[i * offsetColor] = hsv[0];
    instanceColors[i * offsetColor + 1] = hsv[1];
    instanceColors[i * offsetColor + 2] = hsv[2];
    instanceColors[i * offsetColor + 3] = hsv[3];
  }

  const vaos = {};
  vaos.torus = createVAO(
      [trData.p, trData.n, instancePositions, instanceColors],
      ['position,3', 'normal,3', 'instancePosition,3', 'instanceColor,4'], [0, 0, 1, 1], trData.i, prg);

  const [mMatrix, vMatrix, pMatrix, tmpMatrix, mvpMatrix, invTMatrix, invMatrix, tMatrix] = initialMatrix(8);
  const lightDirection = [1.0, 1.0, 2.0];
  const initCamPosition = [0.0, 5.0, 5.0];
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
  // gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  // gl.blendEquationSeparate(gl.FUNC_ADD, gl.FUNC_ADD);
  // gl.enable(gl.BLEND);

  function render(
      scale, rad, axis, translate, textures, indexSize, linkValues, linkNames_Types, prg, isDrawPoints = false,
      isInstanced = false, insCount = 1) {
    bind_texture(textures);

    m.identity(mMatrix);
    m.translate(mMatrix, translate, mMatrix);
    m.rotate(mMatrix, rad, axis, mMatrix);
    m.scale(mMatrix, scale, mMatrix);

    m.multiply(tmpMatrix, mMatrix, mvpMatrix);

    m.inverse(mMatrix, invMatrix);
    m.transpose(invMatrix, invTMatrix);

    linkUniform(linkValues, linkNames_Types, prg);

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
    const strength = eRange.value;

    count++;
    const rad = (count % 720) * Math.PI / 360;
    const hsv = hsva((count / 2) % 360, 1, 1, 1);

    changePrgFramebuffer(prg, null, [c.width, c.height]);
    setVPMatrix(45, c.width, c.height, 0.1, 150);
    ext.vao.bindVertexArrayOES(vaos.torus);
    render(
        [1.0, 1.0, 1.0], rad, [1, 1, 1], [0, 0, 0], [], trData.i.length,
        [mMatrix, mvpMatrix, invTMatrix, lightDirection, camPosition, ambientColor],
        ['mMatrix,m4', 'mvpMatrix,m4', 'invTMatrix,m4', 'lightDirection,v3', 'eyePosition,v3', 'ambientColor,v4'], prg,
        false, true, instanceCount);

    gl.flush();
    requestAnimationFrame(renderFrame);
  };

  requestAnimationFrame(renderFrame);
};