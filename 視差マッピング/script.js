var c;
var gl;
var m = new matIV();
var q = new qtnIV();
var textures = [];
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

	var earthData = sphere(64, 64, 1);
	var eIndex = create_ibo(earthData.i);

	var [mMatrix, vMatrix, pMatrix, tmpMatrix, mvpMatrix, invTMatrix, invMatrix] = initialMatrix(7);
	var lightPosition = [-10, 10, 10];
	var camPosition = [0, 0, 5];
	var camUpDirection = [0, 1, 0];
	var hScale = 0.01;
	var count = 0;

	create_texture('texture.png', 0);
	create_texture('height.png', 1);

	gl.depthFunc(gl.LEQUAL);
	gl.enable(gl.DEPTH_TEST);
	gl.frontFace(gl.CCW);
	// gl.enable(gl.CULL_FACE);
	// gl.enable(gl.STENCIL_TEST);
	// gl.enable(gl.BLEND);
	// gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE);

	function render(scale, rad, axis, translate, textures, indexSize, linkValues, linkNames, linkTypes, prg) {
		bind_texture(textures);
		m.identity(mMatrix);
		m.translate(mMatrix, translate, mMatrix);
		m.rotate(mMatrix, rad, axis, mMatrix);
		m.scale(mMatrix, scale, mMatrix);
		m.multiply(tmpMatrix, mMatrix, mvpMatrix);
		m.inverse(mMatrix, invMatrix);
		m.transpose(invMatrix, invTMatrix);
		linkUniform(linkValues, linkNames, linkTypes, prg);
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
		clearBuffer([0.0, 0.0, 0.0, 1.0], 1.0, 0);
		var rad = (count % 360) * Math.PI / 180;

		linkAttribute([earthData.p, earthData.c, earthData.n, earthData.t], ['position', 'color', 'normal', 'textureCoord'], [3, 4, 3, 2], prg);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, eIndex);
		setVPMatrix(camPosition, [0, 0, 0], camUpDirection, 45, c.width, c.height, 0.1, 100);
		render([1, 1, 1], rad, [0, -1, 0], [0, 0, 0], textures.slice(0, 2), earthData.i.length,
			[mMatrix, mvpMatrix, invTMatrix, lightPosition, camPosition, 0, 1, hScale],
			['mMatrix', 'mvpMatrix', 'invTMatrix', 'lightPosition', 'eyePosition', 'texture', 'heightTexture', 'height'],
			['m4', 'm4', 'm4', 'v3', 'v3', 'i1', 'i1', 'f1'], prg);

		gl.flush();
		setTimeout(arguments.callee, 1000 / 30);
	})();
}
