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
	var depthPrg = create_program('depth_vertex.glsl', 'x-vertex', 'depth_fragment.glsl', 'x-fragment');
	var fBuffer = create_framebuffer(c.width, c.height, []);

	var torusData = torus(64, 64, 1.0, 2.0, [1, 1, 1, 1]);
	var trIndex = create_ibo(torusData.i);
	var position = [
		-1.0, 0.0, -1.0,
		1.0, 0.0, -1.0,
		-1.0, 0.0, 1.0,
		1.0, 0.0, 1.0
	];
	var normal = [
		0.0, 1.0, 0.0,
		0.0, 1.0, 0.0,
		0.0, 1.0, 0.0,
		0.0, 1.0, 0.0
	];
	var color = [
		0.5, 0.5, 0.5, 1.0,
		0.5, 0.5, 0.5, 1.0,
		0.5, 0.5, 0.5, 1.0,
		0.5, 0.5, 0.5, 1.0
	];
	var index = [
		0, 2, 1,
		3, 1, 2
	];
	var cIndex = create_ibo(index);

	var [mMatrix, vMatrix, pMatrix, tmpMatrix, mvpMatrix, invTMatrix, invMatrix, tMatrix, dvMatrix, dpMatrix, dvpMatrix, lgtMatrix] = initialMatrix(12);
	var lightPosition = [0.0, 30.0, 0.0];
	var camPosition = [0, 80, 50.0];
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

		// add shadow mapping
		m.multiply(dvpMatrix, mMatrix, lgtMatrix);

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
		var rad = (count % 180) * Math.PI / 90;

		// gl.bindFramebuffer(gl.FRAMEBUFFER, fBuffer.f);
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		clearBuffer([0.0, 0.7, 0.7, 1.0], 1.0, 0);
		setVPMatrix(camPosition, [0, 0, 0], camUpDirection, 45, c.width, c.height, 0.1, 150);

		m.lookAt(lightPosition, [0, 0, 0], [0, 0, -1], dvMatrix);
		m.perspective(90, 1.0, 0.1, 150, dpMatrix);
		m.multiply(tMatrix, dpMatrix, dvpMatrix);
		m.multiply(dvpMatrix, dvMatrix, tMatrix);

		m.multiply(dpMatrix, dvMatrix, dvpMatrix);

		gl.useProgram(depthPrg);
		linkAttribute([torusData.p], ['position'], [3, 4, 3], depthPrg);
		for (var i = 0; i < 10; i++) {
			var transPos = [0, 0, 10 + Math.floor(i / 5) * -4];
			q.rotate((72.0 * i * Math.PI) / 180, [0, 1, 0], qt);
			q.toVecIII(transPos, qt, transPos);

			transPos[1] += (5 * Math.floor(i / 5));
			render([1, 1, 1], rad, [1, 1, 1], transPos, [], torusData.i.length, trIndex,
				[lgtMatrix, true],
				['mvpMatrix', 'depthBuffer'], ['m4', 'i1'], depthPrg);
		}

		linkAttribute([position], ['position'], [3, 4, 3], depthPrg);
		render([40, 0.1, 40], 0, [1, 1, 1], [0, -120, 0], [], index.length, cIndex,
			[lgtMatrix, true],
			['mvpMatrix', 'depthBuffer'], ['m4', 'i1'], depthPrg);

		// gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		// clearBuffer([0.0, 0.7, 0.7, 1.0], 1.0, 0);
		// gl.useProgram(prg);

		// linkAttribute([torusData.p, torusData.c, torusData.n], ['position', 'color', 'normal'], [3, 4, 3], prg);
		// for (var i = 0; i < 10; i++) {
		// 	var transPos = [0, 0, 10 + Math.floor(i / 5) * -4];
		// 	q.rotate((72.0 * i * Math.PI) / 180, [0, 1, 0], qt);
		// 	q.toVecIII(transPos, qt, transPos);

		// 	transPos[1] += (5 * Math.floor(i / 5));
		// 	render([1, 1, 1], rad, [1, 1, 1], transPos, [fBuffer.t], torusData.i.length, trIndex,
		// 		[mMatrix, mvpMatrix, tMatrix, lgtMatrix, invTMatrix, lightPosition, 0, true],
		// 		['mMatrix', 'mvpMatrix', 'tMatrix', 'lgtMatrix', 'invTMatrix', 'lightPosition', 'texture', 'depthBuffer'],
		// 		['m4', 'm4', 'm4', 'm4', 'm4', 'v3', 'i1', 'i1'], prg);
		// }

		// linkAttribute([position, color, normal], ['position', 'color', 'normal'], [3, 4, 3], prg);
		// render([40, 0.1, 40], 0, [1, 1, 1], [0, -20, 0], [fBuffer.t], index.length, cIndex,
		// 	[mMatrix, mvpMatrix, tMatrix, lgtMatrix, invTMatrix, lightPosition, 0, true],
		// 	['mMatrix', 'mvpMatrix', 'tMatrix', 'lgtMatrix', 'invTMatrix', 'lightPosition', 'texture', 'depthBuffer'],
		// 	['m4', 'm4', 'm4', 'm4', 'm4', 'v3', 'i1', 'i1'], prg);

		gl.flush();
		setTimeout(arguments.callee, 1000 / 30);
	})();
}
