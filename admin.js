// admin.js

// ★★★ 임시 마스터 계정 (나중에 서버/DB 연동 가능하게 분리 구성) ★★★
const MASTER_EMAIL = "admin@smartcal-ai.com";
const MASTER_PASSWORD = "SmartCal!2025"; // 나중에 꼭 변경 권장

// HTML 요소 찾기
const loginForm = document.getElementById("adminLoginForm");
const emailInput = document.getElementById("adminEmail");
const pwInput = document.getElementById("adminPassword");
const errorBox = document.getElementById("adminError");
const dash = document.getElementById("adminDashboard");

const dashTodayShots = document.getElementById("dashTodayShots");
const dashActiveSubs = document.getElementById("dashActiveSubs");
const dashTodayPayments = document.getElementById("dashTodayPayments");
const dashMonthlySales = document.getElementById("dashMonthlySales");

const btnRefreshDummy = document.getElementById("btnRefreshDummy");
const btnFuturePg = document.getElementById("btnFuturePg");
const logoutBtn = document.getElementById("adminLogoutBtn");

// 이미 로그인된 상태인지 체크 (로컬스토리지)
const ADMIN_TOKEN_KEY = "smartcal_admin_token";

function isLoggedIn() {
  return localStorage.getItem(ADMIN_TOKEN_KEY) === "OK";
}

function showDashboard() {
  if (!dash) return;
  dash.style.display = "block";
}

function hideDashboard() {
  if (!dash) return;
  dash.style.display = "none";
}

// 페이지 처음 진입했을 때
window.addEventListener("DOMContentLoaded", () => {
  if (isLoggedIn()) {
    // 이미 로그인되어 있으면 바로 대시보드 보여주기
    hideError();
    showDashboard();
  } else {
    hideDashboard();
  }
});

function showError(msg) {
  if (!errorBox) return;
  errorBox.textContent = msg;
}

function hideError() {
  if (!errorBox) return;
  errorBox.textContent = "";
}

// 로그인 처리
if (loginForm) {
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const email = (emailInput?.value || "").trim();
    const pw = (pwInput?.value || "").trim();

    if (!email || !pw) {
      showError("ID와 비밀번호를 모두 입력해 주세요.");
      return;
    }

    // 임시 마스터 계정 체크 (프론트엔드용)
    if (email === MASTER_EMAIL && pw === MASTER_PASSWORD) {
      // 로그인 성공
      hideError();
      localStorage.setItem(ADMIN_TOKEN_KEY, "OK");
      showDashboard();
    } else {
      showError("ID 또는 비밀번호가 올바르지 않습니다.");
      hideDashboard();
      localStorage.removeItem(ADMIN_TOKEN_KEY);
    }
  });
}

// 로그아웃 처리
if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    hideDashboard();
    if (pwInput) pwInput.value = "";
    showError("로그아웃 되었습니다.");
  });
}

// 임시 대시보드 테스트용 버튼
if (btnRefreshDummy) {
  btnRefreshDummy.addEventListener("click", () => {
    // 나중에: 여기서 진짜 서버 API 호출해서 오늘 데이터 가져오면 됨
    dashTodayShots.textContent = "37 회";
    dashActiveSubs.textContent = "12 명";
    dashTodayPayments.textContent = "5 건";
    dashMonthlySales.textContent = "128,400 원";
  });
}

// PG/결제 연동 설정 버튼 (지금은 안내 문구만)
if (btnFuturePg) {
  btnFuturePg.addEventListener("click", () => {
    alert(
      [
        "🔧 PG/결제 연동 준비 단계입니다.",
        "",
        "1) 포트원(아임포트) 대시보드에서",
        "   - 가맹점 식별코드",
        "   - REST API 키 / 시크릿 발급",
        "",
        "2) smartcal-yolo-server (백엔드)에서",
        "   - /payments/confirm 같은 API 엔드포인트 생성",
        "",
        "3) 결제 완료 후 해당 API에서",
        "   - 구독자 상태 DB 업데이트",
        "   - 이 admin 화면에서 '활성 구독자 / 매출' 반영",
      ].join("\n")
    );
  });
}
