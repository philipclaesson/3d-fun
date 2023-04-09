const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const geometry = new THREE.BoxGeometry();
const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

camera.position.z = 5;

async function requestSensorPermissions() {
    try {
        const permissionNames = ["accelerometer", "gyroscope", "magnetometer"];

        for (const permissionName of permissionNames) {
            console.log("Requesting permission to access", permissionName)
            if (navigator.permissions) {
                const permission = await navigator.permissions.query({ name: permissionName });

                if (permission.state === "denied") {
                    console.error(`Permission to access ${permissionName} was denied.`);
                    return false;
                } else {
                    console.log(`Permission to access ${permissionName} was granted. ${permission.state}`);
                }
            } else {
                console.error("no permissions API available")
            }
        }
        return true;
    } catch (error) {
        console.error("Error while requesting sensor permissions:", error);
        return false;
    }
}

async function initOrientationSensor() {
    if ("AbsoluteOrientationSensor" in window) {
        try {
            const permissionsGranted = await requestSensorPermissions();

            if (!permissionsGranted) {
                console.error("Required sensor permissions were not granted.");
                return;
            }

            const sensor = new AbsoluteOrientationSensor({ frequency: 60 });
            sensor.addEventListener("reading", () => {
                console.log("Orientation sensor reading:", sensor.quaternion);
                const quaternion = new THREE.Quaternion(...sensor.quaternion);
                cube.setRotationFromQuaternion(quaternion);
            });

            sensor.addEventListener("error", (event) => {
                console.error("Orientation sensor error:", event.error);
            });

            await sensor.start();
        } catch (error) {
            console.error("Orientation sensor initialization failed:", error);
        }
        if (window.DeviceOrientationEvent) {
            window.addEventListener("deviceorientation", (event) => {
                const alpha = event.alpha ? THREE.MathUtils.degToRad(event.alpha) : 0;
                const beta = event.beta ? THREE.MathUtils.degToRad(event.beta) : 0;
                const gamma = event.gamma ? THREE.MathUtils.degToRad(event.gamma) : 0;

                const euler = new THREE.Euler(beta, alpha, -gamma, "YXZ");
                cube.setRotationFromEuler(euler);
            });
        } else {
            console.error("Device orientation not supported");
        }
    } else {
        console.error("Orientation sensor not supported");
    }
}

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

initOrientationSensor().then(() => {
    animate();
});
