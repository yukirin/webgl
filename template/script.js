var c;
var gl;
var m = new matIV();
var q = new qtnIV();

onload = function () {
	this.setTimeout(renderWebGL, 300);
};

function renderWebGL() {
	c = document.getElementById('canvas');
	c.width = 500;
	c.height = 300;

	gl = c.getContext('webgl', { stencil: true }) || c.getContext('experimental-webgl', { stencil: true });
	clearBuffer([0.0, 0.0, 0.0, 1.0], 1.0, 0);
	var prg = create_program('vertex.glsl', 'x-vertex', 'fragment.glsl', 'x-fragment');

	gl.depthFunc(gl.LEQUAL);
	gl.enable(gl.DEPTH_TEST);
	gl.frontFace(gl.CCW);
	gl.enable(gl.CULL_FACE);
	gl.enable(gl.STENCIL_TEST);
}