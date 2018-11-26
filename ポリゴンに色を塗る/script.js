var gl;
var m = new matIV();
var q = new qtnIV();

onload = function () {
	this.setTimeout(renderWebGL, 300);
};

function renderWebGL() {
	var c = document.getElementById('canvas');
	c.width = 300;
	c.height = 300;

	gl = c.getContext('webgl') || c.getContext('experimental-webgl');

	clearBuffer([0.0, 0.0, 0.0, 1.0], 1.0);

	var v_shader = create_shader('vertex.glsl', 'x-vertex');
	var f_shader = create_shader('fragment.glsl', 'x-fragment');

	var prg = create_program(v_shader, f_shader);

	var attLocation = gl.getAttribLocation(prg, 'position');
	var attStride = 3;

	var vertex_position = [
		0.0, 1.0, 0.0,
		1.0, 0.0, 0.0,
		-1.0, 0.0, 0.0
	];

	var pos_vbo = create_vbo(vertex_position);

	gl.bindBuffer(gl.ARRAY_BUFFER, pos_vbo);
	gl.enableVertexAttribArray(attLocation);
	gl.vertexAttribPointer(attLocation, attStride, gl.FLOAT, false, 0, 0);

	var mMatrix = m.identity(m.create());
	var mvpMatrix = getMvpMatrix(mMatrix, [0.0, 1.0, 3.0], [0, 0, 0], [0, 1, 0],
		90, c.width / c.height, 0.1, 100);

	var uniLocation = gl.getUniformLocation(prg, 'mvpMatrix');
	gl.uniformMatrix4fv(uniLocation, false, mvpMatrix);

	gl.drawArrays(gl.TRIANGLES, 0, 3);

	gl.flush();
}