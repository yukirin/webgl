var gl;
var m = new matIV();
var q = new qtnIV();

onload = function () {
	this.setTimeout(renderWebGL, 300);
};

function renderWebGL() {
	var c = document.getElementById('canvas');
	c.width = 1000;
	c.height = 600;

	gl = c.getContext('webgl') || c.getContext('experimental-webgl');
	var prg = create_program('vertex.glsl', 'x-vertex', 'fragment.glsl', 'x-fragment');

	var { p: v_pos, n: v_normal, c: v_color, i: index } = torus(32, 32, 1.0, 2.0, [0.75, 0.25, 0.25, 1.0]);
	var { p: sp_pos, n: sp_normal, c: sp_color, i: sp_index } = sphere(64, 64, 2.0, [0.25, 0.25, 0.75, 1.0]);

	var t_vbos = [create_vbo(v_pos), create_vbo(v_normal), create_vbo(v_color)];
	var sp_vbos = [create_vbo(sp_pos), create_vbo(sp_normal), create_vbo(sp_color)];
	var ibo = create_ibo(index);
	var sp_ibo = create_ibo(sp_index);

	var [mMatrix, vMatrix, pMatrix, tmpMatrix, mvpMatrix, invMatrix] = initialMatrix(6);

	m.lookAt([0.0, 0.0, 20.0], [0, 0, 0], [0, 1, 0], vMatrix);
	m.perspective(45, c.width / c.height, 0.1, 100, pMatrix);
	m.multiply(pMatrix, vMatrix, tmpMatrix);

	var eyeDirection = [0.0, 0.0, 20.0];
	var lightPosition = [0.0, 0.0, 0.0];
	var ambientColor = [0.1, 0.1, 0.1, 1.0];
	var count = 0;

	gl.depthFunc(gl.LEQUAL);
	gl.enable(gl.DEPTH_TEST);
	gl.frontFace(gl.CCW);
	gl.enable(gl.CULL_FACE);

	(function () {
		clearBuffer([0.0, 0.0, 0.0, 1.0], 1.0);
		count++

		var rad = (count % 360) * Math.PI / 180;
		var tx = Math.cos(rad) * 3.5;
		var ty = Math.sin(rad) * 3.5;
		var tz = Math.sin(rad) * 3.5;

		setAttribute(t_vbos, ['position', 'normal', 'color'], [3, 3, 4], prg);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);

		m.identity(mMatrix);
		m.translate(mMatrix, [tx, -ty, -tz], mMatrix);
		m.rotate(mMatrix, -rad, [0, 1, 1], mMatrix);
		m.multiply(tmpMatrix, mMatrix, mvpMatrix);
		m.inverse(mMatrix, invMatrix);

		linkUniform([mvpMatrix, invMatrix, lightPosition, ambientColor, eyeDirection, mMatrix],
			['mvpMatrix', 'invMatrix', 'lightPosition', 'ambientColor', 'eyeDirection', 'mMatrix'],
			['m4', 'm4', 'v3', 'v4', 'v3', 'm4'], prg);
		gl.drawElements(gl.TRIANGLES, index.length, gl.UNSIGNED_SHORT, 0);

		setAttribute(sp_vbos, ['position', 'normal', 'color'], [3, 3, 4], prg);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sp_ibo);

		m.identity(mMatrix);
		m.translate(mMatrix, [-tx, ty, tz], mMatrix);
		m.multiply(tmpMatrix, mMatrix, mvpMatrix);
		m.inverse(mMatrix, invMatrix);

		linkUniform([mvpMatrix, invMatrix, mMatrix],
			['mvpMatrix', 'invMatrix', 'mMatrix'],
			['m4', 'm4', 'm4'], prg);
		gl.drawElements(gl.TRIANGLES, sp_index.length, gl.UNSIGNED_SHORT, 0);
		gl.flush();

		setTimeout(arguments.callee, 1000 / 30);
	})();
}