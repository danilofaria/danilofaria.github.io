THREE.ImageUtils.crossOrigin = '';
var mouse = new THREE.Vector2(), INTERSECTED, HIGHLIGHTED, cube_clicked;
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

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );}

window.addEventListener( 'resize', onWindowResize, false );


//Back ground
var sphere_material = new THREE.MeshBasicMaterial( { color: 0x000055, wireframe: true } );
var reference = new THREE.Mesh();
scene.add(reference);
var radius = 1, segments = 16, rings = 16;
for ( var i = 0; i < 1000; i ++ ) {
  var vertex = new THREE.Vector3();
  vertex.x = THREE.Math.randFloatSpread( 50 );
  vertex.y = THREE.Math.randFloatSpread( 50 );
  vertex.z = THREE.Math.randFloatSpread( 50 );
  while(vertex.length() < 10){
    vertex.x = THREE.Math.randFloatSpread( 50 );
    vertex.y = THREE.Math.randFloatSpread( 50 );
    vertex.z = THREE.Math.randFloatSpread( 50 );
  }
  var sphere = new THREE.Mesh(
    new THREE.SphereGeometry(
      radius, segments,rings),
    sphere_material);

  sphere.position.x=vertex.x;
  sphere.position.y=vertex.y;
  sphere.position.z=vertex.z;
  sphere.type_m = "background";

  reference.add(sphere);
}


var land_geometry = new THREE.BoxGeometry( 1, 1, .2 );
var land_material = 
	new THREE.MeshPhongMaterial( { color: 0x000000, specular: 0x666666, emissive: 0x00aa00, ambient: 0x000000, shininess: 10, shading: THREE.SmoothShading } );
var land_cube = new THREE.Mesh( land_geometry, land_material );
land_cube.visible=false;
scene.add(land_cube);

var max_dimension = 6;
var max_block = max_dimension*max_dimension*3;
var grid_cubes = [], gridbg_cubes = [], game_cubes = [], grid_i=0, game_i=0;

var shininess = 0, specular = 0x333333, bumpScale = 1, shading = THREE.SmoothShading;
var gridbg_texture = THREE.ImageUtils.loadTexture( 
	"textures/neon.png");
	// "http://danilofaria.github.io/portfolio/brainoi/img/neon.png");
gridbg_texture.anisotropy = renderer.getMaxAnisotropy();
var game_texture = THREE.ImageUtils.loadTexture( 
	"textures/crate.jpg");
	// "http://danilofaria.github.io/portfolio/brainoi/img/crate.jpg");
game_texture.anisotropy = renderer.getMaxAnisotropy();

for(var i = 0; i <max_block; i++){
	var grid_geometry = new THREE.BoxGeometry( 1, 1, .51 );
	var grid_material = new THREE.MeshBasicMaterial( { color: 0x555555, transparent: true,  opacity: 0, blending: THREE.AdditiveBlending } );
	var grid_cube = new THREE.Mesh( grid_geometry, grid_material );
	grid_cube.type_m = "game";
	grid_cubes.push(grid_cube);
	grid_cube.position.x=-10000;
	grid_cube.visible=false;
	scene.add( grid_cube );

	var gridbg_geometry = new THREE.BoxGeometry( 1, 1, .01 );
	var gridbg_material =  new THREE.MeshPhongMaterial( { map: gridbg_texture, side: THREE.FrontSide, emissive: 0xFFFFFF, bumpMap: gridbg_texture, bumpScale: bumpScale, color: 0xFFFFFF, ambient: 0x000000, specular: 0xffffff, shininess: shininess, shading: shading, opacity: 0.6, transparent: true  } );
	var gridbg_cube = new THREE.Mesh( gridbg_geometry, gridbg_material );
	gridbg_cubes.push(gridbg_cube);
	gridbg_cube.visible=false;
	gridbg_cube.position.x=-10000;
	scene.add( gridbg_cube );

	var game_geometry = new THREE.BoxGeometry( 1, 1, .4 );
	var game_material = new THREE.MeshPhongMaterial( { map: game_texture, emissive: 0xffffff, bumpMap: game_texture, bumpScale: bumpScale, color: 0xFFFFFF, ambient: 0x000000, specular: 0xffffff, shininess: shininess, metal: false, shading: shading } );
	
	var game_cube = new THREE.Mesh( game_geometry, game_material );
	game_cubes.push(game_cube);
	game_cube.visible=false;
	game_cube.position.x=-10000;
	scene.add( game_cube );
}

var brainoi = new Brainoi();
var win = false, end = false;
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

function updateGrid(){
	var blocks = brainoi.current_phase.blocks;
	var dim = brainoi.current_phase.dimensions;
	var n = blocks.length;
	n_bin= dim[0];
	n_col= dim[1];
	n_row= dim[2];

	for(var i=0;i<grid_i;i++){
		var cube = grid_cubes[i];
		cube.position.x=-10000;
		cube.visible=false;
		var cube = gridbg_cubes[i];
		cube.position.x=-10000;
		cube.visible=false;
	}
	grid_i=0;
	for(var i=0;i<game_i;i++){
		var cube = game_cubes[i];
		cube.position.x=-10000;
		cube.visible=false;
	}
	game_i=0;

	for(var b = 1; b <=n_bin; b++){
		for(var x = 1; x <=n_col; x++){
			for(var y = 1; y <=n_row; y++){
				var cube = grid_cubes[grid_i];
				var gridbg_cube = gridbg_cubes[grid_i];
				cube.visible=true;
				gridbg_cube.visible=true;
				var world_coord = blockToWorld(b,x,y);
				cube.position.x = world_coord[0];
				cube.position.y = world_coord[1];
				gridbg_cube.position.x = world_coord[0];
				gridbg_cube.position.y = world_coord[1];
				cube.game_coordinates = [b,x,y];
				grid_i++;
	}}}
	for(var b = 0; b <n; b++){
		var game_cube = game_cubes[game_i]; game_i++;
		game_cube.visible=true;
		var block = blocks[b];
		game_cube.scale.x = block.width;
		var world_coord = blockToWorld(block.b(), block.x(),block.y(),block.width);
		game_cube.position.x = world_coord[0];
		game_cube.position.y = world_coord[1];
		game_cube.game_coordinates = [block.b(),block.x(),block.y()];
		block.cube = game_cube;
	}
	camera.position.z = (n_bin*n_col+2)/2;
}

updateGrid();

var render = function () {
	requestAnimationFrame( render );

	reference.rotation.x += 0.001;
	reference.rotation.y += 0.001;

	if (win && !end){
		var next = brainoi.next_phase();
		if(next){
		alert("Congratulations!");
		updateGrid();
		document.getElementById("phase_n").innerHTML = brainoi.phase_n;
		document.getElementById("moves").innerHTML = 0;}
		else {alert("Congratulations! You've beat all the available phases!"); end=true;}
		win=false;
	}
    land_cube.visible=false;

	  // find intersections
	  var vector = new THREE.Vector3( mouse.x, mouse.y, 1 ).unproject( camera );
	  raycaster.set( camera.position, vector.sub( camera.position ).normalize() );
	  var intersects = raycaster.intersectObjects( scene.children );
	  if ( intersects.length > 0 ) {
	    if ( INTERSECTED != intersects[ 0 ].object && intersects[ 0 ].object.type_m == "game") {
	      if ( HIGHLIGHTED ) HIGHLIGHTED.material.emissive.setHex( HIGHLIGHTED.currentHex );
	        INTERSECTED = intersects[ 0 ].object;
	        
	        if(brainoi.block_grabbed == null){
	        	var coord = INTERSECTED.game_coordinates;
	  	  		var block = brainoi.freeBlockAt(coord[0],coord[1]);
	  	  		if (block){
					HIGHLIGHTED = block.cube;  	  			
			        HIGHLIGHTED.currentHex = HIGHLIGHTED.material.emissive.getHex();
			        HIGHLIGHTED.material.emissive.setHex( 0xff0000 );
	  	  		}
	        }
	    }
	  } else {
	    if ( HIGHLIGHTED ) HIGHLIGHTED.material.emissive.setHex( HIGHLIGHTED.currentHex );
	    INTERSECTED = null;
	    HIGHLIGHTED = null;
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
			document.getElementById("moves").innerHTML = brainoi.current_phase.n_moves;
	  		win = brainoi.phase_won();
			updateBlock(block);
	  	}
	  } else {
	  	if(INTERSECTED && brainoi.block_grabbed){
	      cube_clicked=INTERSECTED;
	  	  var coord = cube_clicked.game_coordinates;
	  	  brainoi.move(coord[0],coord[1]);
	  	  var block = brainoi.block_grabbed;
		  updateBlock(block,true);
		  var y = block.can_land_here();
		  if (y){
		  	land_cube.visible=true;
		  	var coord = block.coordinates_in_movement;
		  	var world_coord = blockToWorld(coord[0], coord[1], y, block.width);
			land_cube.position.x = world_coord[0];
			land_cube.position.y = world_coord[1];
			land_cube.scale.x = block.width;
		  }
	  	}
	  }

	raycaster.set( camera.position, vector.sub( camera.position ).normalize() );
  	button_clicked=false;
 	mouse_clicked = false;

	renderer.render(scene, camera);
};

render();