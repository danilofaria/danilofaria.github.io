var mouse = new THREE.Vector2(), INTERSECTED, CAM_FOLLOW_i;
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

 document.getElementById( "planet_1" ).addEventListener( 'click', function() {
    CAM_FOLLOW_i=1; button_clicked = true;
  }, false );
 document.getElementById( "planet_2" ).addEventListener( 'click', function() {
    CAM_FOLLOW_i=2; button_clicked = true;
  }, false );
 document.getElementById( "planet_3" ).addEventListener( 'click', function() {
    CAM_FOLLOW_i=3; button_clicked = true;
  }, false );
 document.getElementById( "planet_4" ).addEventListener( 'click', function() {
    CAM_FOLLOW_i=4; button_clicked = true;
  }, false );
 document.getElementById( "planet_5" ).addEventListener( 'click', function() {
    CAM_FOLLOW_i=5; button_clicked = true;
  }, false );
 document.getElementById( "planet_6" ).addEventListener( 'click', function() {
    CAM_FOLLOW_i=6; button_clicked = true;
  }, false );
 document.getElementById( "planet_7" ).addEventListener( 'click', function() {
    CAM_FOLLOW_i=7; button_clicked = true;
  }, false );
 document.getElementById( "planet_8" ).addEventListener( 'click', function() {
    CAM_FOLLOW_i=8; button_clicked = true;
  }, false );

// for(var j=1; j<=8;j++){
//   document.getElementById( "planet_" + j ).addEventListener( 'click', function() {
//     // CAM_FOLLOW_i=i;
//     alert(j);
//   }, false );
// }

THREE.ImageUtils.crossOrigin = '';

var texture_dir = [
"https://dl.dropboxusercontent.com/u/25861113/planet_textures/sun.png",
"https://dl.dropboxusercontent.com/u/25861113/planet_textures/mercury.png",
"https://dl.dropboxusercontent.com/u/25861113/planet_textures/venus.png",
"https://dl.dropboxusercontent.com/u/25861113/planet_textures/earth.png",
"https://dl.dropboxusercontent.com/u/25861113/planet_textures/mars.png",
"https://dl.dropboxusercontent.com/u/25861113/planet_textures/jupiter.png",
"https://dl.dropboxusercontent.com/u/25861113/planet_textures/saturn.png",
"https://dl.dropboxusercontent.com/u/25861113/planet_textures/uranus.png",
"https://dl.dropboxusercontent.com/u/25861113/planet_textures/neptune.png",
]

var materials = [];
var transp_material = new THREE.MeshBasicMaterial( { color: 0x555555, transparent: true, blending: THREE.AdditiveBlending } );
var shininess = 0, specular = 0x333333, bumpScale = 1, shading = THREE.SmoothShading;
var n_planets = 8;

for(var i=0; i<n_planets+1; i++){
  var texture = THREE.ImageUtils.loadTexture( texture_dir[i] );
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = 16;
  if (i==0)
  materials.push( new THREE.MeshPhongMaterial( { map: texture, emissive: 0xffff00, bumpMap: texture, bumpScale: bumpScale, color: 0xFFFFFF, ambient: 0x000000, specular: 0xffffff, shininess: shininess, metal: false, shading: shading } ) );
  else
  materials.push( new THREE.MeshPhongMaterial( { map: texture, bumpMap: texture, bumpScale: bumpScale, color: 0xFFFFFF, ambient: 0x000000, specular: 0xffffff, shininess: shininess, metal: false, shading: shading } ) );
}

var G = 1.18419, M=331436;
var three_d_scene = new ThreeDScene(n_planets+1);
var explicit_euler = new ExplicitEuler();
var dt = 0.005;

//Sun
three_d_scene.setPosition(0, [0,0,0]);
three_d_scene.radii[0]=50;
three_d_scene.setM(0,M);
three_d_scene.isFixed[0] = true;

//Other planets
var offset = 50;
var r = 3;
//distance to sun, radius, angle
var data = [[150-offset, 1*r, 0],[160-offset, 1*r, 30],[170-offset, 1*r, 45],[180-offset, 0.5*r, 125],
[230-offset, 10*r, 200],[260-offset, 9*r, 100],[290-offset, 4*r, 300],[310-offset, 4*r, 250]]
var paths = [];
for(var i=1; i<n_planets+1; i++){
  var dist = data[i-1][0];
  var ca = data[i-1][2];
  var pos = [dist * Math.sin(ca * Math.PI/180), 0, dist * Math.cos(ca * Math.PI/180)]
  three_d_scene.setPosition(i, pos);
  var sign = (i % 2 == 0) ? 1 : -1;
  three_d_scene.setVelocity(i, [0,sign*Math.sqrt(G*M/dist),0]);
  three_d_scene.radii[i]=data[i-1][1];
  three_d_scene.setM(i,1);
  three_d_scene.isFixed[i] = false;
  var gravitational_force = new GravitationalForce(0,i,G);
  three_d_scene.insertForce(gravitational_force);
  var duration = dist/10;
  paths.push(new ParticlePath( i, Math.ceil(duration/dt), 0xffffff));
}

//Saturn's ring
var ring_geometry = new THREE.RingGeometry( 10*r, 13*r, 32 );

var ring_material = new THREE.MeshBasicMaterial( { color: 0x663300, oppacity:0.5, side: THREE.DoubleSide } );
var ring_mesh = new THREE.Mesh( ring_geometry, ring_material );
ring_mesh.rotation.x = Math.PI/2;

// set the scene size
var WIDTH = window.innerWidth,//400,
  HEIGHT = window.innerHeight;//300;

// set some camera attributes
var VIEW_ANGLE = 75,
  ASPECT = WIDTH / HEIGHT,
  NEAR = 0.1,
  FAR = 10000;

var raycaster= new THREE.Raycaster();

var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera( VIEW_ANGLE, ASPECT, NEAR, FAR );
camera.position.z = 220;
var controls = new THREE.TrackballControls( camera );
var renderer = new THREE.WebGLRenderer();
renderer.setClearColor( 0x0b0b0b, 1 );
renderer.sortObjects = false;
renderer.setSize( WIDTH, HEIGHT );
document.body.appendChild( renderer.domElement );

//http://threejs.org/examples/webgl_camera.html
var geometry = new THREE.Geometry();
for ( var i = 0; i < 10000; i ++ ) {
  var vertex = new THREE.Vector3();
  vertex.x = THREE.Math.randFloatSpread( 5000 );
  vertex.y = THREE.Math.randFloatSpread( 5000 );
  vertex.z = THREE.Math.randFloatSpread( 5000 );
  //My change
  while(vertex.length() < 1000){
    vertex.x = THREE.Math.randFloatSpread( 5000 );
    vertex.y = THREE.Math.randFloatSpread( 5000 );
    vertex.z = THREE.Math.randFloatSpread( 5000 );
  }
  geometry.vertices.push( vertex );
}
var particles = new THREE.PointCloud( geometry, new THREE.PointCloudMaterial( { color: 0x888888 } ) );
scene.add( particles );



// set up the sphere vars
var radius = 0.8, segments = 16, rings = 16;
// create a point light
var pointLight =
  new THREE.PointLight(0xFFFFFF, 1);

//Particles initialization  
var particles = new Array(0);
for (i = 0; i < three_d_scene.num_particles; i++) {
  var pos = three_d_scene.getPosition(i);
  radius = three_d_scene.radii[i];

  var sphere = new THREE.Mesh(
    new THREE.SphereGeometry(
      radius, segments,rings),
    materials[i]);

  sphere.position.x=pos[0];
  sphere.position.y=pos[1];
  sphere.position.z=pos[2];
  sphere.particle_i = i;

  if (i==0) sphere.add(pointLight);
  else
  sphere.is_planet = true;
  
  if (i==6)
    sphere.add( ring_mesh );

  scene.add(sphere);
  particles.push( sphere );
}
//End of particless initialization

//Paths initialization
var path_geometries = []
for (var i=0; i<paths.length;i++){
  var material = new THREE.LineBasicMaterial({
    color: paths[i].color
  });
  var geometry = new THREE.Geometry();
  for (var j=0;j< paths[i].max_list_size ;j++)
    geometry.vertices.push(new THREE.Vector3( 0, 0, 0 ));
  path_geometries.push(geometry);
  var line = new THREE.Line( geometry, material );
  scene.add( line );
}
//End of paths initialization

//Axis across the sun
var geometry_axis = new THREE.CylinderGeometry( 1, 1, 150, 32 );
var material_x = new THREE.MeshBasicMaterial( {color: 0xddddff} );
var material_y = new THREE.MeshBasicMaterial( {color: 0xaaaaff} );
var material_z = new THREE.MeshBasicMaterial( {color: 0xccccff} );
var cylinder_x = new THREE.Mesh( geometry_axis, material_x );
var cylinder_y = new THREE.Mesh( geometry_axis, material_y );
var cylinder_z = new THREE.Mesh( geometry_axis, material_z );
cylinder_x.position=new THREE.Vector3(0,0,0);
cylinder_y.position=new THREE.Vector3(0,0,0);
cylinder_z.position=new THREE.Vector3(0,0,0);
cylinder_x.rotation.z = -3.1415/2; 
cylinder_z.rotation.x = 3.1415/2; 
scene.add( cylinder_x );
scene.add( cylinder_y );
scene.add( cylinder_z );

function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize( window.innerWidth, window.innerHeight );}
window.addEventListener( 'resize', onWindowResize, false );

var pos,vel;
var render = function () {
  three_d_scene = explicit_euler.stepScene(three_d_scene, dt)
      
  // Paths update and rendering
  for (i = 0; i < paths.length; i++){
    pos = three_d_scene.getPosition(paths[i].particle_i);
    paths[i].addToPath(pos);
  }
  for (var i=0; i<paths.length;i++){
    path = paths[i];
    var geometry = path_geometries[i];
    var max_n = path.max_list_size;
    for ( var j = 0, l = max_n; j < l; j ++ ) {
      pos_temp = path.getPoint(j);
      if (pos_temp != undefined) pos = pos_temp;
      geometry.vertices[ j ].x = pos[0];
      geometry.vertices[ j ].y = pos[1];
      geometry.vertices[ j ].z = pos[2];
    }
    geometry.verticesNeedUpdate = true;
  }
  // End of paths update and rendering

  // Move particles
  for (i = 0; i < three_d_scene.num_particles; i++) {
    var pos = three_d_scene.getPosition(i);
    var sphere = particles[i];
    sphere.position.x=pos[0];
    sphere.position.y=pos[1];
    sphere.position.z=pos[2];
    sphere.rotation.y += 0.01;
  }

  // find intersections
  var vector = new THREE.Vector3( mouse.x, mouse.y, 1 ).unproject( camera );
  raycaster.set( camera.position, vector.sub( camera.position ).normalize() );
  var intersects = raycaster.intersectObjects( scene.children );
  if ( intersects.length > 0 ) {
    if ( INTERSECTED != intersects[ 0 ].object ) {
      if ( INTERSECTED ) INTERSECTED.material.emissive.setHex( INTERSECTED.currentHex );
      if ( intersects[ 0 ].object.is_planet){
        INTERSECTED = intersects[ 0 ].object;
        INTERSECTED.currentHex = INTERSECTED.material.emissive.getHex();
        INTERSECTED.material.emissive.setHex( 0xff0000 );
      } else {INTERSECTED=null;}
    }
  } else {
    if ( INTERSECTED ) INTERSECTED.material.emissive.setHex( INTERSECTED.currentHex );
    INTERSECTED = null;
  }
  // if (mouse_clicked && INTERSECTED){
  //   CAM_FOLLOW_i=INTERSECTED.particle_i;
  // }
  if (mouse_clicked && !button_clicked){
    if (INTERSECTED)
      CAM_FOLLOW_i=INTERSECTED.particle_i;
    else{
      CAM_FOLLOW_i = 0;
    }
  }
  if(CAM_FOLLOW_i){
    pos = three_d_scene.getPosition(CAM_FOLLOW_i);
    vel = three_d_scene.getVelocity(CAM_FOLLOW_i);
    radius = three_d_scene.radii[CAM_FOLLOW_i];
    vel = new THREE.Vector3( vel[0], vel[1], vel[2] );
    vel = vel.normalize();
    camera.position.x = pos[0] -vel.x*radius*5;
    camera.position.y = pos[1] -vel.y*radius*5;//- vel[1];
    camera.position.z = pos[2] -vel.z*radius*5;//- vel[2];+220;//
    camera.up = new THREE.Vector3(0,1,0);
    camera.lookAt(new THREE.Vector3( pos[0], pos[1], pos[2] ));
  }else{
    controls.update();
  }

  raycaster.set( camera.position, vector.sub( camera.position ).normalize() );
  button_clicked=false;
  mouse_clicked = false;
  
  requestAnimationFrame( render );
  renderer.render(scene, camera);
};

  render();