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

	gl = c.getContext('webgl') || c.getContext('experimental-webgl');
	clearBuffer([0.0, 0.0, 0.0, 1.0], 1.0);

	var prg = create_program('vertex.glsl', 'x-vertex', 'fragment.glsl', 'x-fragment');
}