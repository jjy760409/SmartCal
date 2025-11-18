let stream;
let currentFacingMode = "environment"; // 후면 카메라 기본

async function setupCamera() {
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
  }

  stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: currentFacingMode }
  });

  const cameraVideo = document.getElementById("cameraVideo");
  cameraVideo.srcObject = stream;
}

document.getElementById("snapButton").addEventListener("click", () => {
  const cameraVideo = document.getElementById("cameraVideo");
  const captureCanvas = document.getElementById("captureCanvas");
  const ctx = captureCanvas.getContext("2d");
  
  captureCanvas.width = cameraVideo.videoWidth;
  captureCanvas.height = cameraVideo.videoHeight;
  ctx.drawImage(cameraVideo, 0, 0);

  // 결과 UI 표시 (임시 데이터)
  document.getElementById("resultContainer").style.display = "block";
  document.getElementById("kcalValue").innerText = "95 kcal";
  document.getElementById("carbValue").innerText = "25 g";
  document.getElementById("proteinValue").innerText = "3 g";
  document.getElementById("fatValue").innerText = "0.3 g";
});

// 🔄 카메라 전환 버튼
document.getElementById("switchCameraBtn").addEventListener("click", () => {
  currentFacingMode = currentFacingMode === "user" ? "environment" : "user";
  setupCamera();
});

// '닫기' 버튼
document.getElementById("guideCloseBtn").addEventListener("click", () => {
  document.getElementById("guideModal").style.display = "none";
});

// 구독 모달 닫기
function closeSubscribeModal() {
  document.getElementById("subscribeModal").style.display = "none";
}

setupCamera();
