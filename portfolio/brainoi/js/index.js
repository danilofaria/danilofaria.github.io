THREE.ImageUtils.crossOrigin = '';
var mouse = new THREE.Vector2(), INTERSECTED, cube_clicked;
var mouse_clicked = false, button_clicked = false;
function onDocumentMouseMove( event ) {
  event.preventDefault();
  mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
  mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
}
function onDocumentMouseClick( event ) {
  // event.preventDefault();
  mouse_clicked = true;
}
document.addEventListener( 'mousemove', onDocumentMouseMove, false );
document.addEventListener( 'click', onDocumentMouseClick, false );
var raycaster= new THREE.Raycaster();


var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 0.1, 1000 );
// Create an ambient light
var light = new THREE.AmbientLight( 0x404040 ); // soft white light
scene.add( light );

var renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

var n_bin=3, n_col=5, n_row=5;
function blockToWorld(b,x,y,width){
    width = typeof width !== 'undefined' ? width : 1;
    return [(b-1)*(n_col+1)-(n_bin*n_col+2)/2+.5+(x-1)+width/2-.5, (y-1) -n_row/2+0.5];
}

function updateBlock(block, movement){
    movement = typeof movement !== 'undefined' ? movement : false;
    if (!movement)
		var coord = block.coordinates;
	else
		var coord = block.coordinates_in_movement;
	var world_coord = blockToWorld(coord[0], coord[1], coord[2], block.width);
	block.cube.position.x = world_coord[0];
	block.cube.position.y = world_coord[1];
	block.cube.game_coordinates = coord;
}

for(var b = 1; b <=3; b++){
	for(var x = 1; x <=5; x++){
		for(var y = 1; y <=5; y++){
			var geometry = new THREE.BoxGeometry( 1, 1, 0.01 );
			
			var shininess = 0, specular = 0x333333, bumpScale = 1, shading = THREE.SmoothShading;
			var texture = THREE.ImageUtils.loadTexture( "https://dl.dropboxusercontent.com/u/25861113/planet_textures/neon.png" );
			texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
			texture.anisotropy = 16;
			var material = new THREE.MeshPhongMaterial( { map: texture, side: THREE.FrontSide, emissive: 0xFFFFFF, bumpMap: texture, bumpScale: bumpScale, color: 0xFFFFFF, ambient: 0x000000, specular: 0xffffff, shininess: shininess, shading: shading, opacity: 0.6, transparent: true  } );
  			// var material= new THREE.MeshPhongMaterial( { map: texture, bumpMap: texture, bumpScale: bumpScale, color: 0xFFFFFF, ambient: 0xffffff, specular: 0xffffff, shininess: shininess, metal: false, shading: shading } ) ;
			
			// var material = new THREE.MeshPhongMaterial( { map: texture, emissive: 0xffffff, bumpMap: texture, bumpScale: bumpScale, color: 0xFFFFFF, ambient: 0x000000, specular: 0xffffff, shininess: shininess, metal: false, shading: shading } );
			// var material = new THREE.MeshPhongMaterial( { map: texture, bumpMap: texture, bumpScale: bumpScale, color: 0xFFFFFF, ambient: 0x000000, specular: 0xffffff, shininess: shininess, metal: false, shading: shading } );
			// var material = new THREE.MeshPhongMaterial( { color: 0x000000, specular: 0x666666, emissive: 0x0000ff, ambient: 0x000000, shininess: 10, shading: THREE.SmoothShading, opacity: 0.4, transparent: true } );
			
			var cube = new THREE.Mesh( geometry, material );
			var world_coord = blockToWorld(b,x,y);
			cube.position.x = world_coord[0];
			cube.position.y = world_coord[1];
			cube.game_coordinates = [b,x,y];
			scene.add( cube );
}}}

var brainoi = new Brainoi();
var blocks = brainoi.current_phase.blocks;
var n = blocks.length;
var win = false;


for(var b = 0; b <n; b++){
	var geometry = new THREE.BoxGeometry( 1, 1, 1.1 );
	// var material = new THREE.MeshPhongMaterial( { color: 0x000000, specular: 0x666666, emissive: 0x00ff00, ambient: 0x000000, shininess: 10, shading: THREE.SmoothShading, opacity: 0.9, transparent: true } );
	var shininess = 0, specular = 0x333333, bumpScale = 1, shading = THREE.SmoothShading;
	var texture = THREE.ImageUtils.loadTexture( "http://4.bp.blogspot.com/-V1QT6AeGmOg/Uu-BZhdUQsI/AAAAAAAADvs/ujJWWCeFAOw/s1600/crate+difuse.jpg" );
	texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
	texture.anisotropy = 16;
	var material = new THREE.MeshPhongMaterial( { map: texture, emissive: 0xffff00, bumpMap: texture, bumpScale: bumpScale, color: 0xFFFFFF, ambient: 0x000000, specular: 0xffffff, shininess: shininess, metal: false, shading: shading } );
	// var material = new THREE.MeshPhongMaterial( { map: texture, bumpMap: texture, bumpScale: bumpScale, color: 0xFFFFFF, ambient: 0x000000, specular: 0xffffff, shininess: shininess, metal: false, shading: shading } );
	

	var cube = new THREE.Mesh( geometry, material );
	var block = blocks[b];
	cube.scale.x = block.width;
	var world_coord = blockToWorld(block.b(), block.x(),block.y(),block.width);
	cube.position.x = world_coord[0];
	cube.position.y = world_coord[1];
	cube.game_coordinates = [block.b(),block.x(),block.y()];
	block.cube = cube;
	scene.add( cube );
}

cube.scale.z = 1.1;
camera.position.z = 10;

var render = function () {
	requestAnimationFrame( render );

	// cube.rotation.x += 0.1;
	// cube.rotation.y += 0.1;

	  // find intersections
	  var vector = new THREE.Vector3( mouse.x, mouse.y, 1 ).unproject( camera );
	  raycaster.set( camera.position, vector.sub( camera.position ).normalize() );
	  var intersects = raycaster.intersectObjects( scene.children );
	  if ( intersects.length > 0 ) {
	    if ( INTERSECTED != intersects[ 0 ].object ) {
	      if ( INTERSECTED ) INTERSECTED.material.emissive.setHex( INTERSECTED.currentHex );
	      //if ( intersects[ 0 ].object.is_planet){
	        INTERSECTED = intersects[ 0 ].object;
	        INTERSECTED.currentHex = INTERSECTED.material.emissive.getHex();
	        INTERSECTED.material.emissive.setHex( 0xff0000 );
	      //} else {INTERSECTED=null;}
	    }
	  } else {
	    if ( INTERSECTED ) INTERSECTED.material.emissive.setHex( INTERSECTED.currentHex );
	    INTERSECTED = null;
	  }
	  if (mouse_clicked && !button_clicked){
	    if (INTERSECTED && !brainoi.block_grabbed){
	      cube_clicked=INTERSECTED;
	  	  var coord = cube_clicked.game_coordinates;
	  	  brainoi.click(coord[0],coord[1]);
		  var block = brainoi.block_grabbed;
		  if (block) updateBlock(block,true);
	  	}else if (brainoi.block_grabbed){
	  		var block = brainoi.block_grabbed;
	  		brainoi.release();
	  		win = brainoi.phase_won();
			updateBlock(block);
	  	}
	  } else {
	  	if(INTERSECTED && brainoi.block_grabbed){
	      cube_clicked=INTERSECTED;
	  	  var coord = cube_clicked.game_coordinates;
	  	  brainoi.move(coord[0],coord[1]);
	  	  var block = brainoi.block_grabbed;
		  if (block) updateBlock(block,true);
	  	}
	  }

	if (win){
		alert("foda-se!");
		win=false;
	}

	raycaster.set( camera.position, vector.sub( camera.position ).normalize() );
  	button_clicked=false;
 	mouse_clicked = false;



	renderer.render(scene, camera);
};

render();