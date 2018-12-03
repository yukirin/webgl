var c, gl;
var m = new matIV();
var q = new qtnIV();
var texture = null, texture1 = null;
var qt = q.identity(q.create());

onload = function () {
	this.setTimeout(renderWebGL, 300);
};

function renderWebGL() {
	c = document.getElementById('canvas');
	c.width = 512;
	c.height = 512;

	gl = c.getContext('webgl', { stencil: true }) || c.getContext('experimental-webgl', { stencil: true });
	gl.viewport(0, 0, c.width, c.height);
	var prg = create_program('vertex.glsl', 'x-vertex', 'fragment.glsl', 'x-fragment');

	var position = [
		-1.0, 1.0, 0.0,
		1.0, 1.0, 0.0,
		-1.0, -1.0, 0.0,
		1.0, -1.0, 0.0
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
	var vIndex = create_ibo(index);

	var [mMatrix, vMatrix, pMatrix, tmpMatrix, mvpMatrix, invMatrix] = initialMatrix(6);
	var camPosition = [0.0, 0.0, 10.0];
	var camUpDirection = [0.0, 1.0, 0.0];
	var lightDirection = [1, 1, 1];
	var count = 0;

	create_texture('texture0.png', 0);
	gl.activeTexture(gl.TEXTURE0);

	gl.depthFunc(gl.LEQUAL);
	gl.enable(gl.DEPTH_TEST);
	gl.frontFace(gl.CCW);
	gl.enable(gl.CULL_FACE);
	gl.enable(gl.STENCIL_TEST);
	gl.enable(gl.BLEND);
	gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE);

	function render(scale, rad, axis, translate, texture, indexSize, linkValues, linkNames, linkTypes, prg) {
		gl.bindTexture(gl.TEXTURE_2D, texture);
		m.identity(mMatrix);
		m.translate(mMatrix, translate, mMatrix);
		m.rotate(mMatrix, rad, axis, mMatrix);
		m.scale(mMatrix, scale, mMatrix);
		m.multiply(tmpMatrix, mMatrix, mvpMatrix);
		m.inverse(mMatrix, invMatrix);
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
		var rad = (count % 360) * Math.PI / 180;
		var rad2 = (count % 720) * Math.PI / 360;

		clearBuffer([0.0, 0.7, 0.7, 1], 1.0, 0);
		linkAttribute([position, color], ['position', 'color'], [3, 4], prg);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, vIndex);
		setVPMatrix([0, 0, 5], [0, 0, 0], [0, 1, 0], 45, c.width, c.height, 0.1, 100, false);
		render([1, 1, 1], 0, [1, 1, 0], [0, 0, 0], texture, index.length, [mvpMatrix, 0], ['mvpMatrix', 'texture'], ['m4', 'i1'], prg);

		gl.flush();
		setTimeout(arguments.callee, 1000 / 30);
	})();
}
