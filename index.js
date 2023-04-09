const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const geometry = new THREE.BoxGeometry();
const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

camera.position.z = 5;

async function requestSensorPermissions() {
    try {
        const permissionNames = ["accelerometer", "gyroscope", "magnetometer"];

        for (const permissionName of permissionNames) {
            if (navigator.permissions) {
                const permission = await navigator.permissions.query({ name: permissionName });

                if (permission.state === "denied") {
                    console.error(`Permission to access ${permissionName} was denied.`);
                    return false;
                }
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
