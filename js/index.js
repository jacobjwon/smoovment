//initialise simplex noise (replace with perlin noise in future if needed)
let noise = new SimplexNoise();

let vizInit = function (){

  const file = document.getElementById("thefile");
  const audio = document.getElementById("audio");
  const fileLabel = document.querySelector("label.file");

  file.onchange = function() {
    audio.classList.add('active');
    let files = this.files;
    audio.src = URL.createObjectURL(files[0]);
    audio.load();
    audio.play();
    let context = new AudioContext();
    let src = context.createMediaElementSource(audio);
    let analyser = context.createAnalyser();
    src.connect(analyser);
    analyser.connect(context.destination);
    analyser.fftSize = 512;
    let bufferLength = analyser.frequencyBinCount;
    let dataArray = new Uint8Array(bufferLength);

    //webgl
    let scene = new THREE.Scene();
    let group = new THREE.Group();
    let camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0,0,100);
    camera.lookAt(scene.position);
    scene.add(camera);

    let renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);

    let icosahedronGeometry = new THREE.IcosahedronGeometry(10, 4);
    let lambertMaterial = new THREE.MeshPhongMaterial({
        color: 0x2194ce,
        emissive: 0x0,
        specular: 0x111111,
        shininess: 30,
        wireframe: true
    });

    let ball = new THREE.Mesh(icosahedronGeometry, lambertMaterial);
    ball.position.set(0, 0, 0);
    group.add(ball);

    let ambientLight = new THREE.AmbientLight(0x0);
    scene.add(ambientLight);

    let spotLight = new THREE.SpotLight(0xffffff);
    spotLight.intensity = 1.4;
    spotLight.position.set(-10, 40, 50);
    spotLight.lookAt(ball);
    spotLight.castShadow = true;
    scene.add(spotLight);

    let orbitControls = new THREE.OrbitControls(camera);
    orbitControls.autoRotate = true;

    // let gui = new dat.GUI();
    let guiControls = new function () {
        this.amp = 1.8;
        this.wireframe = true;
    }();

    // gui.add(guiControls, 'amp', 0, ball.geometry.parameters.radius - 1);
    // gui.add(guiControls, 'wireframe').onChange(function (e) {
    //     ball.material.wireframe = e;
    // });

    scene.add(group);

    document.getElementById('out').appendChild(renderer.domElement);

    window.addEventListener('resize', onWindowResize, false);

    render();

    function render() {
        analyser.getByteFrequencyData(dataArray);

        let lowerHalfArray = dataArray.slice(0, (dataArray.length/2) - 1);
        let upperHalfArray = dataArray.slice((dataArray.length/2) - 1, dataArray.length - 1);

        let overallAvg = avg(dataArray);
        let lowerMax = max(lowerHalfArray);
        let lowerAvg = avg(lowerHalfArray);
        let upperMax = max(upperHalfArray);
        let upperAvg = avg(upperHalfArray);

        let lowerMaxFr = lowerMax / lowerHalfArray.length;
        let lowerAvgFr = lowerAvg / lowerHalfArray.length;
        let upperMaxFr = upperMax / upperHalfArray.length;
        let upperAvgFr = upperAvg / upperHalfArray.length;

        // ball.rotation.y += 0.008;
        // ball.rotation.x += 0.009;

        makeRoughBall(ball, (modulate(Math.pow(lowerMaxFr, 0.5), 0, 1, 0, 8) * 1.2), (modulate(upperAvgFr, 0, 1, 0, 4)) * 0.8);

        group.rotation.y += 0.005;
        renderer.render(scene, camera);
        requestAnimationFrame(render);
    }

    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }

    function makeRoughBall(mesh, bassFr, treFr) {
        mesh.geometry.vertices.forEach(function (vertex, i) {
            let offset = mesh.geometry.parameters.radius;
            let amp = guiControls.amp;
            let time = Date.now();
            vertex.normalize();
            let distance = (offset + bassFr ) + noise.noise3D(vertex.x + time * 0.00007, vertex.y +  time * 0.00008, vertex.z +  time * 0.00009) * amp * treFr;
            vertex.multiplyScalar(distance);
        });
        mesh.geometry.verticesNeedUpdate = true;
        mesh.geometry.normalsNeedUpdate = true;
        mesh.geometry.computeVertexNormals();
        mesh.geometry.computeFaceNormals();
    }

    audio.play();
  };
}

window.onload = vizInit();

document.body.addEventListener('touchend', function(ev) { context.resume(); });

//some helper functions here
function fractionate(val, minVal, maxVal) {
    return (val - minVal)/(maxVal - minVal);
}

function modulate(val, minVal, maxVal, outMin, outMax) {
    let fr = fractionate(val, minVal, maxVal);
    let delta = outMax - outMin;
    return outMin + (fr * delta);
}

function avg(arr){
    let total = arr.reduce(function(sum, b) { return sum + b; });
    return (total / arr.length);
}

function max(arr){
    return arr.reduce(function(a, b){ return Math.max(a, b); })
}

// todos
// customize the audio controls
// provide mic input support
// change the background color based on the audio
// display song name inside the vizualization
// implement the same with Perlin noise
