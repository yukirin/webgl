var c;
var gl;
var m = new matIV();
var q = new qtnIV();
var textures = [];
var cubeTexture = null;
var qt = q.identity(q.create());
var then = 0;

onload = function () {
	var eRange = document.getElementById('range');
	var eCheck = document.getElementById('checkbox');
	c = document.getElementById('canvas');
	c.width = 1280;
	c.height = 720;

	gl = c.getContext('webgl', { stencil: true }) || c.getContext('experimental-webgl', { stencil: true });
	var prg = create_program('vertex.glsl', 'x-vertex', 'fragment.glsl', 'x-fragment');
	var filterPrg = create_program('filter_vertex.glsl', 'x-vertex', 'filter_fragment.glsl', 'x-fragment');

	var shadowMapSize = 2048;
	var fBuffer = create_framebuffer(shadowMapSize, shadowMapSize, []);

	var torusData = torus(64, 64, 1.0, 2.0, [1, 1, 1, 1]);
	var trIndex = create_ibo(torusData.i);
	var planeData = plane([0.9, 0.9, 0.9, 1.0]);
	var pIndex = create_ibo(planeData.i);

	var [mMatrix, vMatrix, pMatrix, tmpMatrix, mvpMatrix, invTMatrix, invMatrix] = initialMatrix(7);
	var lightDirection = [0.0, 30.0, 0.0];
	var camPosition = [0, 70, 0];
	var camUpDirection = [0, 0, -1];
	var count = 0;

	gl.depthFunc(gl.LEQUAL);
	gl.enable(gl.DEPTH_TEST);
	gl.frontFace(gl.CCW);
	gl.enable(gl.CULL_FACE);
	// gl.enable(gl.STENCIL_TEST);
	// gl.enable(gl.BLEND);
	// gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE);

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

	function setVPMatrix(camPosition, center, camUpDirection, fovy, width, height, near, far, isOrtho = false) {
		m.lookAt(camPosition, center, camUpDirection, vMatrix);
		if (isOrtho) {
			m.ortho(-1.0, 1.0, 1.0, -1.0, 0.1, 100, pMatrix);
		} else {
			m.perspective(fovy, width / height, near, far, pMatrix);
		}
		m.multiply(pMatrix, vMatrix, tmpMatrix);
	}


	function renderFrame(now) {
		now *= 0.001;
		var deltaTime = now - then;
		then = now;

		var state = eCheck.checked;
		var r = (eRange.value - 50) / 50

		count++;
		var rad = (count % 360) * Math.PI / 180;
		var hsv = hsva((count / 2) % 360, 1, 1, 1);

		gl.useProgram(prg);
		gl.bindFramebuffer(gl.FRAMEBUFFER, fBuffer.f);
		gl.viewport(0.0, 0.0, shadowMapSize, shadowMapSize);
		clearBuffer(hsv, 1.0, 0);
		setVPMatrix(camPosition, [0, 0, 0], camUpDirection, 45, c.width, c.height, 0.1, 150);
		linkAttribute([torusData.p, torusData.c, torusData.n], ['position', 'color', 'normal'], [3, 4, 3], prg);
		for (var i = 0; i < 10; i++) {
			var amb = hsva(i * 30, 1, 1, 1);
			var transPos = [0, 0, 10 + Math.floor(i / 5) * -4];
			q.rotate((72.0 * i * Math.PI) / 180, [0, 1, 0], qt);
			q.toVecIII(transPos, qt, transPos);
			transPos[1] += (3 * Math.floor(i / 5) + 5);
			render([1, 1, 1], rad, [1, 1, 1], transPos, [], torusData.i.length, trIndex,
				[mMatrix, mvpMatrix, invTMatrix, lightDirection, camPosition, amb],
				['mMatrix', 'mvpMatrix', 'invTMatrix', 'lightDirection', 'eyePosition', 'ambientColor'],
				['m4', 'm4', 'm4', 'v3', 'v3', 'v4'], prg);
		}

		gl.useProgram(filterPrg);
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		gl.viewport(0.0, 0.0, c.width, c.height);
		clearBuffer([0.0, 0.0, 0.0, 1.0], 1.0, 0);
		setVPMatrix([0.0, 0.0, 0.5], [0, 0, 0], [0, 1, 0], 45, c.width, c.height, 0.1, 150, true);
		linkAttribute([planeData.p, planeData.t], ['position', 'texCoord'], [3, 2], filterPrg);
		render([1, 1, 1], Math.PI / 2, [1, 0, 0], [0, 0, 0], [fBuffer.t], planeData.i.length, pIndex,
			[mvpMatrix, 0, state],
			['mvpMatrix', 'texture', 'grayScale'], ['m4', 'i1', 'i1'], filterPrg);

		gl.flush();
		requestAnimationFrame(renderFrame);
	};

	requestAnimationFrame(renderFrame);
};