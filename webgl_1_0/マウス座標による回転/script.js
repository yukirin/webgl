var c;
var gl;
var m = new matIV();
var q = new qtnIV();
var qt = q.identity(q.create());

onload = function () {
	this.setTimeout(renderWebGL, 300);
};

function renderWebGL() {
	c = document.getElementById('canvas');
	c.width = 1000;
	c.height = 600;

	c.addEventListener('mousemove', mouseMove, true);

	gl = c.getContext('webgl') || c.getContext('experimental-webgl');
	var prg = create_program('vertex.glsl', 'x-vertex', 'fragment.glsl', 'x-fragment');

	var { p: v_pos, n: v_normal, c: v_color, i: index } = torus(64, 64, 0.5, 1.5);

	var t_vbos = [create_vbo(v_pos), create_vbo(v_normal), create_vbo(v_color)];
	var ibo = create_ibo(index);

	var [mMatrix, vMatrix, pMatrix, tmpMatrix, mvpMatrix, invMatrix] = initialMatrix(6);

	var eyeDirection = [0.0, 0.0, 20.0];
	var lightPosition = [15.0, 10.0, 15.0];
	var ambientColor = [0.1, 0.1, 0.1, 1.0];
	var count = 0;

	var camPosition = [0.0, 0.0, 10.0];
	var camUpDirection = [0.0, 1.0, 0.0];

	gl.depthFunc(gl.LEQUAL);
	gl.enable(gl.DEPTH_TEST);
	gl.frontFace(gl.CCW);
	gl.enable(gl.CULL_FACE);

	(function () {
		clearBuffer([0.0, 0.0, 0.0, 1.0], 1.0);
		count++

		var rad = (count % 180) * Math.PI / 90;
		var qMatrix = m.identity(m.create());
		q.toMatIV(qt, qMatrix);

		setAttribute(t_vbos, ['position', 'normal', 'color'], [3, 3, 4], prg);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);


		m.lookAt(camPosition, [0, 0, 0], camUpDirection, vMatrix);
		m.perspective(45, c.width / c.height, 0.1, 100, pMatrix);
		m.multiply(pMatrix, vMatrix, tmpMatrix);

		m.identity(mMatrix);
		m.multiply(mMatrix, qMatrix, mMatrix);
		m.rotate(mMatrix, rad, [0, 1, 0], mMatrix);
		m.multiply(tmpMatrix, mMatrix, mvpMatrix);
		m.inverse(mMatrix, invMatrix);

		linkUniform([mvpMatrix, invMatrix, lightPosition, ambientColor, eyeDirection, mMatrix],
			['mvpMatrix', 'invMatrix', 'lightPosition', 'ambientColor', 'eyeDirection', 'mMatrix'],
			['m4', 'm4', 'v3', 'v4', 'v3', 'm4'], prg);
		gl.drawElements(gl.TRIANGLES, index.length, gl.UNSIGNED_SHORT, 0);
		gl.flush();

		setTimeout(arguments.callee, 1000 / 30);
	})();
}
