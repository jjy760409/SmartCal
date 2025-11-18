// app.js  전체 새 버전
// - 카메라 캡처
// - 사용법 팝업(닫기 버튼 제대로 동작)
// - 3회 무료 사용 카운트 + 구독 유도 팝업
// - 분석 결과 카드 UI (현재는 '가짜 데이터'로 동작, 나중에 서버 연결만 교체)

const FREE_LIMIT = 3;
const CATEGORY_ICON_MAP = {
  meal: "🍽️",
  rice: "🍚",
  noodle: "🍜",
  soup: "🥣",
  dessert: "🍰",
  bakery: "🥐",
  drink: "🥤",
  coffee: "☕",
  fruit: "🍎",
  snack: "🍪",
};

let videoEl, canvasEl, snapBtn;

// -----------------------------
// 초기 진입
// -----------------------------
document.addEventListener("DOMContentLoaded", () => {
  videoEl = document.getElementById("cameraVideo");
  canvasEl = document.getElementById("captureCanvas");
  snapBtn = document.getElementById("snapButton");

  initCamera();
  attachEvents();
  updateFreeBadge(getUsageInfo());
});

// -----------------------------
// 카메라 초기화
// -----------------------------
async function initCamera() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    alert("이 브라우저에서는 카메라를 사용할 수 없습니다.");
    return;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment" },
      audio: false,
    });
    videoEl.srcObject = stream;
    await videoEl.play();
  } catch (e) {
    console.error(e);
    alert("카메라 권한을 허용해 주세요.");
  }
}

// -----------------------------
// 이벤트 연결
// -----------------------------
function attachEvents() {
  if (snapBtn) {
    snapBtn.addEventListener("click", handleCapture);
  }

  // 사용법 팝업 닫기 버튼
  const guideCloseBtn = document.getElementById("guideCloseBtn");
  if (guideCloseBtn) {
    guideCloseBtn.addEventListener("click", () => {
      const m = document.getElementById("guideModal");
      if (m) m.style.display = "none";
    });
  }

  // 배경(어두운 부분)을 클릭해도 닫히게 하고 싶으면 이 부분 추가
  const guideOverlay = document.getElementById("guideModal");
  if (guideOverlay) {
    guideOverlay.addEventListener("click", (e) => {
      if (e.target.id === "guideModal") {
        guideOverlay.style.display = "none";
      }
    });
  }
}

// -----------------------------
// 캡처 → 분석
// -----------------------------
async function handleCapture() {
  if (!videoEl || !canvasEl) return;

  showLoading(true);

  try {
    // 비디오 프레임을 캔버스에 그리기
    const w = videoEl.videoWidth || 640;
    const h = videoEl.videoHeight || 480;
    canvasEl.width = w;
    canvasEl.height = h;

    const ctx = canvasEl.getContext("2d");
    ctx.drawImage(videoEl, 0, 0, w, h);

    const dataUrl = canvasEl.toDataURL("image/jpeg", 0.8);

    // ① 실제 서버 연결 버전으로 바꿀 부분
    // const analysis = await sendImageToServer(dataUrl);
    // ② 지금은 '가짜 분석 결과'로 동작 (테스트용)
    const analysis = createFakeAnalysis();

    renderAnalysisResult(analysis);

    const usage = increaseUsage();
    updateFreeBadge(usage);

    if (usage.used > FREE_LIMIT && usage.sub === "none") {
      openSubscribeModal();
    }
  } catch (e) {
    console.error(e);
    alert("분석 중 오류가 발생했습니다. 다시 시도해 주세요.");
  } finally {
    showLoading(false);
  }
}

// -----------------------------
// (나중용) 실제 서버 호출 형태 예시
// -----------------------------
async function sendImageToServer(dataUrl) {
  const deviceId = getOrCreateDeviceId();

  const payload = {
    image: dataUrl,
    device_id: deviceId,
    app_version: "1.0.0",
    locale: "ko-KR",
  };

  const res = await fetch("https://api.smartcal-ai.com/v1/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error("서버 오류: " + res.status);
  return await res.json();
}

function getOrCreateDeviceId() {
  const key = "smartcal_device_id";
  let id = localStorage.getItem(key);
  if (!id) {
    id = "web-" + (crypto.randomUUID ? crypto.randomUUID() : Date.now());
    localStorage.setItem(key, id);
  }
  return id;
}

// -----------------------------
// (지금은 가짜 분석 데이터) - 나중에 제거 가능
// -----------------------------
function createFakeAnalysis() {
  // 간단히 사과 1개 예시
  return {
    detected_items: [
      {
        id: "item-1",
        label: "apple",
        display_name_ko: "사과 1개",
        category: "fruit",
        confidence: 0.95,
        serving_size: { unit: "g", value: 120 },
        calories: 95,
        macros: { carbs_g: 25, protein_g: 0.5, fat_g: 0.3 },
      },
    ],
    total: {
      calories: 95,
      macros: { carbs_g: 25, protein_g: 0.5, fat_g: 0.3 },
    },
  };
}

// -----------------------------
// 결과 화면 렌더링
// -----------------------------
function renderAnalysisResult(analysis) {
  const container = document.getElementById("resultContainer");
  if (!container) return;
  container.innerHTML = "";

  const total = analysis.total;
  const header = document.createElement("div");
  header.className = "result-summary";
  header.innerHTML = `
    <div class="result-main-kcal">${total.calories} kcal</div>
    <div class="result-macros">
      탄 ${total.macros.carbs_g}g · 단 ${total.macros.protein_g}g · 지 ${
    total.macros.fat_g
  }g
    </div>
  `;
  container.appendChild(header);

  const list = document.createElement("div");
  list.className = "result-items";

  (analysis.detected_items || []).forEach((item) => {
    const icon = CATEGORY_ICON_MAP[item.category] || "🍽️";
    const card = document.createElement("div");
    card.className = "result-item-card";
    card.innerHTML = `
      <div class="result-item-left">
        <div class="result-item-icon">${icon}</div>
        <div>
          <div class="result-item-name">${item.display_name_ko}</div>
          <div class="result-item-gram">${item.serving_size.value}${
      item.serving_size.unit
    }</div>
        </div>
      </div>
      <div class="result-item-right">
        <div class="result-item-kcal">${item.calories} kcal</div>
        <div class="result-item-macros">
          탄 ${item.macros.carbs_g}g · 단 ${item.macros.protein_g}g · 지 ${
      item.macros.fat_g
    }g
        </div>
      </div>
    `;
    list.appendChild(card);
  });

  container.appendChild(list);
}

// -----------------------------
// 3회 무료 카운트 + 구독 상태
// -----------------------------
function getUsageInfo() {
  const used = parseInt(
    localStorage.getItem("smartcal_free_scans_used") || "0",
    10
  );
  const sub =
    localStorage.getItem("smartcal_subscription_status") || "none";
  return { used, sub };
}

function increaseUsage() {
  const info = getUsageInfo();
  const next = info.used + 1;
  localStorage.setItem("smartcal_free_scans_used", String(next));
  return { ...info, used: next };
}

function updateFreeBadge(info) {
  const badge = document.getElementById("freeBadge");
  if (!badge) return;

  const remain = Math.max(0, FREE_LIMIT - info.used);
  const text =
    info.sub !== "none"
      ? "SmartCal Pro 구독 활성화"
      : `무료 체험 · 남은 촬영 ${remain}회 (총 ${FREE_LIMIT}회)`;

  badge.innerHTML = `<span class="used">${info.used}</span> / ${FREE_LIMIT} · ${text}`;
}

// -----------------------------
// 구독 팝업
// -----------------------------
function openSubscribeModal() {
  const el = document.getElementById("subscribeModal");
  if (el) el.style.display = "flex";
}

function closeSubscribeModal() {
  const el = document.getElementById("subscribeModal");
  if (el) el.style.display = "none";
}

function selectPlan(plan) {
  localStorage.setItem("smartcal_subscription_status", plan);
  closeSubscribeModal();
  updateFreeBadge(getUsageInfo());
  alert("테스트용: " + plan + " 플랜을 선택했습니다.");
}

// -----------------------------
// 로딩 표시
// -----------------------------
function showLoading(show) {
  const el = document.getElementById("loadingOverlay");
  if (!el) return;
  el.style.display = show ? "flex" : "none";
}
