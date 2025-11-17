const video = document.getElementById("video");
const btn = document.getElementById("cameraBtn");

btn.addEventListener("click", async () => {
  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
  video.srcObject = stream;
});
