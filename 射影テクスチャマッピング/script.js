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
	c.width = 1000;
	c.height = 800;

	gl = c.getContext('webgl', { stencil: true }) || c.getContext('experimental-webgl', { stencil: true });
	var prg = create_program('vertex.glsl', 'x-vertex', 'fragment.glsl', 'x-fragment');

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
		1.0, 1.0, 1.0, 1.0,
		1.0, 1.0, 1.0, 1.0,
		1.0, 1.0, 1.0, 1.0,
		1.0, 1.0, 1.0, 1.0
	];
	var index = [
		0, 1, 2,
		3, 2, 1
	];
	var cIndex = create_ibo(index);

	var [mMatrix, vMatrix, pMatrix, tmpMatrix, mvpMatrix, invTMatrix, invMatrix, tMatrix, tvMatrix, tpMatrix, tvpMatrix] = initialMatrix(11);
	var lightPosition = [-10.0, 10.0, 10.0];
	var lightUpDirection = [0.577, 0.577, -0.577];
	var camPosition = [-20, 10, 70];
	var camUpDirection = [0, 1, 0];
	var count = 0;
	var lightRange = 10.0;
	create_texture('texture.png', 0);

	tMatrix[0] = 0.5; tMatrix[1] = 0.0; tMatrix[2] = 0.0; tMatrix[3] = 0.0;
	tMatrix[4] = 0.0; tMatrix[5] = -0.5; tMatrix[6] = 0.0; tMatrix[7] = 0.0;
	tMatrix[8] = 0.0; tMatrix[9] = 0.0; tMatrix[10] = 1.0; tMatrix[11] = 0.0;
	tMatrix[12] = 0.5; tMatrix[13] = 0.5; tMatrix[14] = 0.0; tMatrix[15] = 1.0;
	// lightPosition[0] = -1.0 * lightRange;
	// lightPosition[1] = 1.0 * lightRange;
	// lightPosition[2] = 1.0 * lightRange;

	m.lookAt(lightPosition, [0, 0, 0], lightUpDirection, tvMatrix);
	m.perspective(90, 1.0, 0.1, 150, tpMatrix);
	m.multiply(tMatrix, tpMatrix, tvpMatrix);
	m.multiply(tvpMatrix, tvMatrix, tMatrix);

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

		clearBuffer([0.0, 0.7, 0.7, 1.0], 1.0, 0);
		setVPMatrix(camPosition, [0, 0, 0], camUpDirection, 45, c.width, c.height, 0.1, 200);

		linkAttribute([position, color, normal], ['position', 'color', 'normal'], [3, 4, 3], prg);
		render([20, 1, 20], 0, [1, 1, 1], [0, -10, 0], [textures[0]], index.length, cIndex,
			[mMatrix, mvpMatrix, invTMatrix, tMatrix, lightPosition, 0],
			['mMatrix', 'mvpMatrix', 'invTMatrix', 'tMatrix', 'lightPosition', 'texture'],
			['m4', 'm4', 'm4', 'm4', 'v3', 'i1'], prg);

		linkAttribute([position, color, normal], ['position', 'color', 'normal'], [3, 4, 3], prg);
		render([20, 1, 20], Math.PI / 2, [1, 0, 0], [0, 10, -20], [textures[0]], index.length, cIndex,
			[mMatrix, mvpMatrix, invTMatrix, tMatrix, lightPosition, 0],
			['mMatrix', 'mvpMatrix', 'invTMatrix', 'tMatrix', 'lightPosition', 'texture'],
			['m4', 'm4', 'm4', 'm4', 'v3', 'i1'], prg);

		linkAttribute([position, color, normal], ['position', 'color', 'normal'], [3, 4, 3], prg);
		render([20, 1, 20], Math.PI / 2, [0, 0, 1], [20, 10, 0], [textures[0]], index.length, cIndex,
			[mMatrix, mvpMatrix, invTMatrix, tMatrix, lightPosition, 0],
			['mMatrix', 'mvpMatrix', 'invTMatrix', 'tMatrix', 'lightPosition', 'texture'],
			['m4', 'm4', 'm4', 'm4', 'v3', 'i1'], prg);

		for (var i = 0; i < 10; i++) {
			var trans = new Array();
			trans[0] = (i % 5 - 2.0) * 7.0;
			trans[1] = Math.floor(i / 5) * 7.0 - 5.0;
			trans[2] = (i % 5 - 2.0) * 5.0;

			linkAttribute([torusData.p, torusData.c, torusData.n], ['position', 'color', 'normal'], [3, 4, 3], prg);
			render([1, 1, 1], rad, [1, 1, 0], trans, [textures[0]], torusData.i.length, trIndex,
				[mMatrix, mvpMatrix, invTMatrix, tMatrix, lightPosition, 0],
				['mMatrix', 'mvpMatrix', 'invTMatrix', 'tMatrix', 'lightPosition', 'texture'],
				['m4', 'm4', 'm4', 'm4', 'v3', 'i1'], prg);
		}

		gl.flush();
		setTimeout(arguments.callee, 1000 / 30);
	})();
}
