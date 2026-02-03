import { FaceLandmarker, FilesetResolver } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3";

let faceLandmarker;
const videoOpen = document.getElementById("video-open");
const videoClosed = document.getElementById("video-closed");
const videoWebcam = document.getElementById("webcam");
const startBtn = document.getElementById("start-btn");
const overlay = document.getElementById("overlay");

// 1. 初期化
async function init() {
    const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
    );
    faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
            delegate: "GPU"
        },
        outputFaceBlendshapes: true,
        runningMode: "VIDEO"
    });
    startBtn.innerText = "START EXPERIENCE";
}
init();

// 2. スタート処理
startBtn.addEventListener("click", async () => {
    overlay.style.display = "none";
    
    // mp4を再生
    videoOpen.play();
    videoClosed.play();
    
    videoOpen.muted = false;
    videoClosed.muted = true;

    // カメラ
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    videoWebcam.srcObject = stream;
    videoWebcam.onloadedmetadata = () => {
        predictWebcam();
    };
});

// 3. 判定
function predictWebcam() {
    function render() {
        const results = faceLandmarker.detectForVideo(videoWebcam, performance.now());

        if (results.faceBlendshapes && results.faceBlendshapes.length > 0) {
            const shapes = results.faceBlendshapes[0].categories;
            const left = shapes.find(s => s.categoryName === "eyeBlinkLeft").score;
            const right = shapes.find(s => s.categoryName === "eyeBlinkRight").score;

            // 0.4〜0.6の間で調整してください
            const isClosed = (left + right) / 2 > 0.4;

            if (isClosed) {
                if (videoClosed.style.display === "none") {
                    videoOpen.style.display = "none";
                    videoOpen.muted = true;
                    videoClosed.style.display = "block";
                    videoClosed.muted = false;
                }
            } else {
                if (videoOpen.style.display === "none") {
                    videoOpen.style.display = "block";
                    videoOpen.muted = false;
                    videoClosed.style.display = "none";
                    videoClosed.muted = true;
                }
            }
        }
        requestAnimationFrame(render);
    }
    render();
}