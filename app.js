// SmartCal AI - Netlify Functions 연동 버전
// - 3회 무료 제한 + 구독 모달
// - /api/analyze 로 이미지(JSON) 전송 (base64)
// - 오늘 섭취 기록 + 총 칼로리
// - PWA 서비스워커 등록

const MAX_FREE_USES = 3;

let captureCount = 0;
let currentStream = null;
let currentFacingMode = "environment";

// 오늘 기록
let todayHistoryKey = "";
let history = [];

// DOM
const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const guideOverlay = document.getElementById("guideOverlay");

const captureBtn = document.getElementById("captureBtn");
const switchCameraBtn = document.getElementById("switchCameraBtn");
const resetGuideBtn = document.getElementById("resetGuideBtn");

const usageText = document.getElementById("usageText");
const usageBadge = document.getElementById("usageBadge");
const message = document.getElementById("message");

const resultSection = document.getElementById("resultSection");
const foodNameEl = document.getElementById("foodName");
const calorieValueEl = document.getElementById("calorieValue");
const resultNoteEl = document.getElementById("resultNote");

const historySection = document.getElementById("historySection");
const historyDateLabel = document.getElementById("historyDateLabel");
const historyList = document.getElementById("historyList");
const historyTotalEl = document.getElementById("historyTotal");
const historyClearBtn = document.getElementById("historyClearBtn");

const subscriptionModal = document.getElementById("subscriptionModal");
const closeModalBtn = document.getElementById("closeModalBtn");
const subscribeBtn = document.getElementById("subscribeBtn");
const laterBtn = document.getElementById("laterBtn");

// 날짜 유틸
function getTodayKey() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}
function formatTime(date) {
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}
function formatTodayLabel(key) {
  const [y, m, d] = key.split("-");
  return `${y}년 ${parseInt(m, 10)}월 ${parseInt(d, 10)}일`;
}

// ── 오늘 기록 ──
function loadHistory() {
  const raw = localStorage.getItem(todayHistoryKey);
  if (!raw) {
    history = [];
    renderHistory();
    return;
  }
  try {
    const parsed = JSON.parse(raw);
    history = Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error("History parse error", e);
    history = [];
  }
  renderHistory();
}
function saveHistory() {
  try {
    localStorage.setItem(todayHistoryKey, JSON.stringify(history));
  } catch (e) {
    console.error("History save error", e);
  }
}
function addHistoryEntry(food) {
  const now = new Date();
  history.push({
    name: food.name,
    kcal: food.kcal,
    time: now.toISOString()
  });
  saveHistory();
  renderHistory();
}
function clearTodayHistory() {
  history = [];
  saveHistory();
  renderHistory();
}
function renderHistory() {
  if (!history || history.length === 0) {
    historySection.style.display = "none";
    historyList.innerHTML = "";
    historyTotalEl.textContent = "0";
    return;
  }
  historySection.style.display = "block";
  historyDateLabel.textContent = formatTodayLabel(getTodayKey());

  historyList.innerHTML = "";
  let total = 0;

  history.forEach((item) => {
    total += Number(item.kcal) || 0;

    const li = document.createElement("li");
    li.className = "history-item";

    const left = document.createElement("div");
    left.className = "history-left";

    const nameEl = document.createElement("div");
    nameEl.className = "history-name";
    nameEl.textContent = item.name;

    const timeEl = document.createElement("div");
    timeEl.className = "history-time";
    timeEl.textContent = `촬영 시간: ${formatTime(new Date(item.time))}`;

    left.appendChild(nameEl);
    left.appendChild(timeEl);

    const kcalEl = document.createElement("div");
    kcalEl.className = "history-kcal";
    kcalEl.textContent = `${item.kcal} kcal`;

    li.appendChild(left);
    li.appendChild(kcalEl);

    historyList.appendChild(li);
  });

  historyTotalEl.textContent = total.toString();
}

// ── 카메라 ──
async function startCamera() {
  try {
    if (currentStream) {
      currentStream.getTracks().forEach((t) => t.stop());
    }
    const constraints = { video: { facingMode: currentFacingMode }, audio: false };
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    currentStream = stream;
    video.srcObject = stream;
    await video.play();
    setMessage("찍고 싶은 음식이 화면 중앙에 오도록 맞춰주세요. 📸", "info");
  } catch (err) {
    console.error(err);
    setMessage("카메라 접근 권한을 허용해 주세요. (브라우저 설정 확인)", "error");
  }
}

function setMessage(text, type = "info") {
  message.textContent = text || "";
  if (!text) return;
  if (type === "error") message.style.color = "#fb7185";
  else if (typ
