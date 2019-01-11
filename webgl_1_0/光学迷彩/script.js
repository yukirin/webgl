var c;
var gl;
var m = new matIV();
var q = new qtnIV();
var textures = [];
var cubeTexture = null;
var qt = q.identity(q.create());

onload = function () {
	this.setTimeout(renderWebGL, 300);
};

function renderWebGL() {
	var eRange = document.getElementById('range');
	c = document.getElementById('canvas');
	c.width = 512;
	c.height = 512;

	gl = c.getContext('webgl', { stencil: true }) || c.getContext('experimental-webgl', { stencil: true });
	var prg = create_program('vertex.glsl', 'x-vertex', 'fragment.glsl', 'x-fragment');
	var trPrg = create_program('torus_vertex.glsl', 'x-vertex', 'torus_fragment.glsl', 'x-fragment');
	var cubePrg = create_program('cubemap_vertex.glsl', 'x-vertex', 'cubemap_fragment.glsl', 'x-fragment');
	var fBuffer = create_framebuffer(c.width, c.height, []);

	create_cube_texture(['cube_PX.png', 'cube_PY.png', 'cube_PZ.png', 'cube_NX.png', 'cube_NY.png', 'cube_NZ.png'],
		[gl.TEXTURE_CUBE_MAP_POSITIVE_X, gl.TEXTURE_CUBE_MAP_POSITIVE_Y, gl.TEXTURE_CUBE_MAP_POSITIVE_Z,
		gl.TEXTURE_CUBE_MAP_NEGATIVE_X, gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, gl.TEXTURE_CUBE_MAP_NEGATIVE_Z]);

	var torusData = torus(64, 64, 2.5, 5.0, [1, 1, 1, 1]);
	var trIndex = create_ibo(torusData.i);
	var cubeData = cube(2.0, [1, 1, 1, 1]);
	var cIndex = create_ibo(cubeData.i);

	var [mMatrix, vMatrix, pMatrix, tmpMatrix, mvpMatrix, invTMatrix, invMatrix, tMatrix, tvMatrix, tpMatrix, tvpMatrix] = initialMatrix(11);
	var lightPosition = [-10.0, 10.0, 10.0];
	var lightUpDirection = [0.577, 0.577, -0.577];
	var camPosition = [0, 0, 20.0];
	var camUpDirection = [0, 1, 0];
	var count = 0;

	tMatrix[0] = 0.5; tMatrix[1] = 0.0; tMatrix[2] = 0.0; tMatrix[3] = 0.0;
	tMatrix[4] = 0.0; tMatrix[5] = 0.5; tMatrix[6] = 0.0; tMatrix[7] = 0.0;
	tMatrix[8] = 0.0; tMatrix[9] = 0.0; tMatrix[10] = 1.0; tMatrix[11] = 0.0;
	tMatrix[12] = 0.5; tMatrix[13] = 0.5; tMatrix[14] = 0.0; tMatrix[15] = 1.0;

	gl.depthFunc(gl.LEQUAL);
	gl.enable(gl.DEPTH_TEST);
	gl.frontFace(gl.CCW);
	// gl.enable(gl.CULL_FACE);
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

	(function () {
		count++;
		var rad = (count % 360) * Math.PI / 180;

		gl.bindFramebuffer(gl.FRAMEBUFFER, fBuffer.f);
		clearBuffer([0.0, 0.7, 0.7, 1.0], 1.0, 0);
		setVPMatrix(camPosition, [0, 0, 0], camUpDirection, 90, c.width, c.height, 0.1, 200);

		gl.useProgram(cubePrg);
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeTexture);
		linkAttribute([cubeData.p, cubeData.c, cubeData.n], ['position', 'color', 'normal'], [3, 4, 3], cubePrg);
		render([100, 100, 100], 0, [1, 1, 1], [0, 0, 0], [], cubeData.i.length, cIndex,
			[mMatrix, mvpMatrix, invTMatrix, 0, camPosition, false],
			['mMatrix', 'mvpMatrix', 'invTMatrix', 'cubeTexture', 'eyePosition', 'reflection'],
			['m4', 'm4', 'm4', 'i1', 'v3', 'i1'], cubePrg);

		gl.useProgram(trPrg);
		linkAttribute([torusData.p, torusData.c, torusData.n], ['position', 'color', 'normal'], [3, 4, 3], trPrg);
		for (var i = 0; i < 10; i++) {
			var transPos = [0, 0, 50];
			amb = hsva(i * 40, 1, 1, 1);
			q.rotate((36.0 * i * Math.PI) / 180, [0, 1, 0], qt);
			q.toVecIII(transPos, qt, transPos);
			render([1, 1, 1], rad, [1, 1, 1], transPos, [], torusData.i.length, trIndex,
				[mMatrix, mvpMatrix, invTMatrix, lightPosition, camPosition, amb],
				['mMatrix', 'mvpMatrix', 'invTMatrix', 'lightDirection', 'eyePosition', 'ambientColor'],
				['m4', 'm4', 'm4', 'v3', 'v3', 'v4'], trPrg);
		}

		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		clearBuffer([0.0, 0.7, 0.7, 1.0], 1.0, 0);

		gl.useProgram(cubePrg);
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeTexture);
		linkAttribute([cubeData.p, cubeData.c, cubeData.n], ['position', 'color', 'normal'], [3, 4, 3], cubePrg);
		render([100, 100, 100], 0, [1, 1, 1], [0, 0, 0], [], cubeData.i.length, cIndex,
			[mMatrix, mvpMatrix, invTMatrix, 0, camPosition, false],
			['mMatrix', 'mvpMatrix', 'invTMatrix', 'cubeTexture', 'eyePosition', 'reflection'],
			['m4', 'm4', 'm4', 'i1', 'v3', 'i1'], cubePrg);

		gl.useProgram(trPrg);
		linkAttribute([torusData.p, torusData.c, torusData.n], ['position', 'color', 'normal'], [3, 4, 3], trPrg);
		for (var i = 0; i < 10; i++) {
			var transPos = [0, 0, 50];
			amb = hsva(i * 40, 1, 1, 1);
			q.rotate((36.0 * i * Math.PI) / 180, [0, 1, 0], qt);
			q.toVecIII(transPos, qt, transPos);
			render([1, 1, 1], rad, [1, 1, 1], transPos, [], torusData.i.length, trIndex,
				[mMatrix, mvpMatrix, invTMatrix, lightPosition, camPosition, amb],
				['mMatrix', 'mvpMatrix', 'invTMatrix', 'lightDirection', 'eyePosition', 'ambientColor'],
				['m4', 'm4', 'm4', 'v3', 'v3', 'v4'], trPrg);
		}

		m.multiply(tMatrix, tmpMatrix, tvpMatrix);
		var coefficient = (eRange.value - 50) / 50.0;

		gl.useProgram(prg);
		linkAttribute([torusData.p, torusData.c, torusData.n], ['position', 'color', 'normal'], [3, 4, 3], prg);
		render([1, 1, 1], rad, [1, 1, 1], [0, 0, 0], [fBuffer.t], torusData.i.length, trIndex,
			[mMatrix, mvpMatrix, invTMatrix, tvpMatrix, coefficient, 0],
			['mMatrix', 'mvpMatrix', 'invTMatrix', 'tMatrix', 'coefficient', 'texture'],
			['m4', 'm4', 'm4', 'm4', 'f1', 'i1'], prg);

		gl.flush();
		setTimeout(arguments.callee, 1000 / 30);
	})();
}
