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
	c = document.getElementById('canvas');
	c.width = 512;
	c.height = 512;

	gl = c.getContext('webgl', { stencil: true }) || c.getContext('experimental-webgl', { stencil: true });
	var prg = create_program('vertex.glsl', 'x-vertex', 'fragment.glsl', 'x-fragment');
	var defPrg = create_program('default_vertex.glsl', 'x-vertex', 'default_fragment.glsl', 'x-fragment');

	var sphereData = sphere(64, 64, 3, [1, 1, 1, 1]);
	var spIndex = create_ibo(sphereData.i);
	var torusData = torus(64, 64, 0.5, 1.0, [1.0, 1.0, 1.0, 1.0]);
	var trIndex = create_ibo(torusData.i);
	var cubeData = cube(2, [1, 1, 1, 1]);
	var cIndex = create_ibo(cubeData.i);

	var [mMatrix, vMatrix, pMatrix, tmpMatrix, mvpMatrix, invTMatrix, invMatrix] = initialMatrix(7);
	var lightDirection = [-1.0, 1.0, 1.0];
	var camPosition = [0, 0, 20];
	var camUpDirection = [0, 1, 0];
	var hScale = 0.01;
	var count = 0;
	var cubeTarget = [
		gl.TEXTURE_CUBE_MAP_POSITIVE_X, gl.TEXTURE_CUBE_MAP_POSITIVE_Y, gl.TEXTURE_CUBE_MAP_POSITIVE_Z,
		gl.TEXTURE_CUBE_MAP_NEGATIVE_X, gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, gl.TEXTURE_CUBE_MAP_NEGATIVE_Z
	];

	create_cube_texture(['cube_PX.png', 'cube_PY.png', 'cube_PZ.png', 'cube_NX.png', 'cube_NY.png', 'cube_NZ.png'], cubeTarget);
	var fBuffer = create_framebuffer(c.width, c.height, cubeTarget);

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

	var eye = [[1, 0, 0], [0, 1, 0], [0, 0, 1], [-1, 0, 0], [0, -1, 0], [0, 0, -1]];
	var camUp = [[0, -1, 0], [0, 0, 1], [0, -1, 0], [0, -1, 0], [0, 0, -1], [0, -1, 0]];
	var pos = [[6, 0, 0], [0, 6, 0], [0, 0, 6], [-6, 0, 0], [0, -6, 0], [0, 0, -6]];
	var amb = [[1, 0.5, 0.5, 1], [0.5, 1, 0.5, 1], [0.5, 0.5, 1, 1], [0.5, 0, 0, 1], [0, 0.5, 0, 1], [0, 0, 0.5, 1]];

	(function () {
		count++;
		var rad = (count % 360) * Math.PI / 180;

		(function () {
			gl.bindFramebuffer(gl.FRAMEBUFFER, fBuffer.f);
			gl.viewport(0, 0, c.width, c.height);
			gl.activeTexture(gl.TEXTURE0);
			gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeTexture);

			for (var i = 0; i < cubeTarget.length; i++) {
				gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, cubeTarget[i], fBuffer.t, 0);
				clearBuffer([0, 0, 0, 1], 1, 0);
				setVPMatrix([0, 0, 0], eye[i], camUp[i], 90, c.width, c.height, 0.1, 200);

				gl.useProgram(prg);
				linkAttribute([cubeData.p, cubeData.c, cubeData.n], ['position', 'color', 'normal'], [3, 4, 3], prg);
				render([100, 100, 100], 0, [0, 1, 0], [0, 0, 0], [], cubeData.i.length, cIndex,
					[mMatrix, mvpMatrix, invTMatrix, [0, 0, 0], 0, false],
					['mMatrix', 'mvpMatrix', 'invTMatrix', 'eyePosition', 'cubeTexture', 'reflection'],
					['m4', 'm4', 'm4', 'v3', 'i1', 'i1'], prg);

				gl.useProgram(defPrg);
				linkAttribute([torusData.p, torusData.c, torusData.n], ['position', 'color', 'normal'], [3, 4, 3], defPrg);
				render([1, 1, 1], rad, [1, 1, 1], pos[i], [], torusData.i.length, trIndex,
					[mMatrix, mvpMatrix, invTMatrix, [0, 0, 0], lightDirection, amb[i]],
					['mMatrix', 'mvpMatrix', 'invTMatrix', 'eyePosition', 'lightDirection', 'ambientColor'],
					['m4', 'm4', 'm4', 'v3', 'v3', 'v4'], defPrg);
			}
		})();

		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		gl.viewport(0, 0, c.width, c.height);
		gl.activeTexture(gl.TEXTURE1);
		gl.bindTexture(gl.TEXTURE_CUBE_MAP, fBuffer.t);
		clearBuffer([0.0, 0.0, 0.0, 1.0], 1.0, 0);
		setVPMatrix(camPosition, [0, 0, 0], camUpDirection, 45, c.width, c.height, 0.1, 200);

		gl.useProgram(prg);
		linkAttribute([cubeData.p, cubeData.c, cubeData.n], ['position', 'color', 'normal'], [3, 4, 3], prg);
		render([100, 100, 100], 0, [0, 1, 0], [0, 0, 0], [], cubeData.i.length, cIndex,
			[mMatrix, mvpMatrix, invTMatrix, camPosition, 0, false],
			['mMatrix', 'mvpMatrix', 'invTMatrix', 'eyePosition', 'cubeTexture', 'reflection'],
			['m4', 'm4', 'm4', 'v3', 'i1', 'i1'], prg);

		linkAttribute([sphereData.p, sphereData.c, sphereData.n], ['position', 'color', 'normal'], [3, 4, 3], prg);
		render([1, 1, 1], 0, [0, -1, 0], [0, 0, 0], [], sphereData.i.length, spIndex,
			[mMatrix, mvpMatrix, invTMatrix, camPosition, 1, true],
			['mMatrix', 'mvpMatrix', 'invTMatrix', 'eyePosition', 'cubeTexture', 'reflection'],
			['m4', 'm4', 'm4', 'v3', 'i1', 'i1'], prg);

		for (var i = 0; i < cubeTarget.length; i++) {
			gl.useProgram(defPrg);
			linkAttribute([torusData.p, torusData.c, torusData.n], ['position', 'color', 'normal'], [3, 4, 3], defPrg);
			render([1, 1, 1], rad, [1, 1, 1], pos[i], [], torusData.i.length, trIndex,
				[mMatrix, mvpMatrix, invTMatrix, camPosition, lightDirection, amb[i]],
				['mMatrix', 'mvpMatrix', 'invTMatrix', 'eyePosition', 'lightDirection', 'ambientColor'],
				['m4', 'm4', 'm4', 'v3', 'v3', 'v4'], defPrg);
		}
		gl.flush();
		setTimeout(arguments.callee, 1000 / 30);
	})();
}
