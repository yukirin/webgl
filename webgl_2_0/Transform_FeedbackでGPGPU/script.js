let c, gl, ext;
let then = 0;
let cubeTexture = null;
const m = new matIV();
const q = new qtnIV();
const textures = [];
const cameraQt = q.identity(q.create());
const mousePosition = [0.0, 0.0];
let targetImageData;
let delayFunc;

onload = function() {
  const eRange = document.getElementById('range');
  const eCheck = document.getElementById('checkbox');

  c = document.getElementById('canvas');
  c.width = 512;
  c.height = 512;
  const imageWidth = 256;
  const imageHeight = 256;
  const outVaryings = ['vPosition', 'vVelocity', 'vColor'];
  c.addEventListener('mousemove', mouseMove2, false);
  getImageData(imageWidth, imageHeight, 'sample.jpg');

  delayFunc = function() {
    gl = c.getContext('webgl2', {stencil: true});
    ext = getExtensions(gl);
    const writePrg = create_program('write.vert', 'x-vertex', 'write.frag', 'x-fragment', true, outVaryings, false);
    const readPrg = create_program('read.vert', 'x-vertex', 'read.frag', 'x-fragment');
    const datanum = createTransformFeedbackData(imageWidth, imageHeight, targetImageData);
    const attLocation = [0, 1, 2];
    const attStride = [3, 3, 4];
    const VBOArray = [
      [
        create_vbo(datanum.p, gl.DYNAMIC_COPY), create_vbo(datanum.v, gl.DYNAMIC_COPY),
        create_vbo(datanum.c, gl.DYNAMIC_COPY)
      ],
      [
        create_vbo(datanum.p, gl.DYNAMIC_COPY), create_vbo(datanum.v, gl.DYNAMIC_COPY),
        create_vbo(datanum.c, gl.DYNAMIC_COPY)
      ]
    ];

    const [mMatrix, vMatrix, pMatrix, tmpMatrix, mvpMatrix, invTMatrix, invMatrix, tMatrix] = initialMatrix(8);
    const lightDirection = [1.0, 1.0, 2.0];
    const initCamPosition = [0.0, 0.0, 2.0];
    const initCamUpDirection = [0, 1, 0];
    const camPosition = [];
    const camUpDirection = [];
    const ambientColor = [0.10, 0.10, 0.10, 1.0];
    let count = 0;
    let move = 0.0;

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
      const strength = eRange.value;

      if (state) {
        move = 1.0;
      } else {
        move *= 0.95;
      }

      count++;
      const rad = (count % 720) * Math.PI / 360;
      const hsv = hsva((count / 2) % 360, 1, 1, 1);
      const index = count % 2;
      const invertIndex = 1 - index;

      gl.useProgram(writePrg);
      setAttribute(VBOArray[index], ['position,3', 'velocity,3', 'color,4'], writePrg);
      enableTransformFeedback(outVaryings, VBOArray[invertIndex]);
      render(
          [1.0, 1.0, 1.0], rad, [1, 0, 0], [0, 0, 0], [], imageWidth * imageHeight, [now, mousePosition, move],
          ['time,f1', 'mouse,v2', 'move,f1'], writePrg, true);
      disableTransformFeedback(outVaryings);

      changePrgFramebuffer(readPrg, null, [c.width, c.height]);
      setAttribute(VBOArray[invertIndex], ['position,3', 'velocity,3', 'color,4'], readPrg);
      setVPMatrix(60, c.width, c.height, 0.1, 150);
      render(
          [1.0, 1.0, 1.0], rad, [0, 1, 0], [0, 0, 0], [], imageWidth * imageHeight, [mvpMatrix, move],
          ['mvpMatrix,m4', 'move,f1'], readPrg, true);

      gl.flush();
      requestAnimationFrame(renderFrame);
    };

    requestAnimationFrame(renderFrame);
  };
};