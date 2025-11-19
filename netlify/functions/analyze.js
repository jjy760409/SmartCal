// netlify/functions/analyze.js
// SmartCal AI 서버 함수 (YOLO 연동 준비 + 다중 음식 데모)
// - 프론트에서 base64 data URL(image) 받기
// - 1순위: YOLO 서버가 설정되어 있으면 그쪽으로 요청
// - 2순위: YOLO가 없으면 현재처럼 랜덤 다중 음식 데모 결과 반환

const YOLO_API_URL = process.env.YOLO_API_URL;   // Netlify 환경변수에서 가져올 예정
const YOLO_API_KEY = process.env.YOLO_API_KEY || null;

const defaultHeaders = {
  "Content-Type": "application/json; charset=utf-8",
  "Access-Control-Allow-Origin": "*"
};

// ── YOLO 서버 호출 함수 ──
async function callYoloApi(imageDataUrl) {
  if (!YOLO_API_URL) {
    // YOLO 서버 주소가 아직 설정되지 않은 경우
    return null;
  }

  try {
    const headers = {
      "Content-Type": "application/json"
    };
    if (YOLO_API_KEY) {
      // 선택: 인증 토큰이 필요할 경우
      headers["Authorization"] = `Bearer ${YOLO_API_KEY}`;
    }

    const res = await fetch(YOLO_API_URL, {
      method: "POST",
      headers,
      body: JSON.stringify({ image: imageDataUrl })
    });

    if (!res.ok) {
      throw new Error(`YOLO server error: ${res.status}`);
    }

    const data = await res.json();

    // 기대하는 형식:
    // { items: [{ foodName, calories, box?, confidence? }...], totalCalories, note? }
    if (!data || !Array.isArray(data.items) || data.items.length === 0) {
      throw new Error("YOLO result is empty");
    }

    return data;
  } catch (err) {
    console.error("YOLO API call failed:", err);
    return null;
  }
}

// ── Netlify handler ──
exports.handler = async (event, context) => {
  // CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        ...defaultHeaders,
        "Access-Control-Allow-Methods": "POST,OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type,Authorization"
      },
      body: ""
    };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: defaultHeaders,
      body: JSON.stringify({ error: "Method not allowed" })
    };
  }

  try {
    const body = JSON.parse(event.body || "{}");
    const imageDataUrl = body.image;

    if (!imageDataUrl || typeof imageDataUrl !== "string") {
      return {
        statusCode: 400,
        headers: defaultHeaders,
        body: JSON.stringify({ error: "image field is required" })
      };
    }

    // 1️⃣ 먼저 YOLO 서버가 있다면 호출 시도
    const yoloResult = await callYoloApi(imageDataUrl);
    if (yoloResult) {
      // YOLO 서버가 정상 응답을 줬다면 그대로 프론트로 전달
      return {
        statusCode: 200,
        headers: defaultHeaders,
        body: JSON.stringify(yoloResult)
      };
    }

    // 2️⃣ YOLO 서버가 없거나 실패한 경우 → 기존 데모 랜덤 다중 음식
    const foodCandidates = [
      { foodName: "김밥(1줄)", calories: 320 },
      { foodName: "치킨(한 조각)", calories: 250 },
      { foodName: "햄버거(1개)", calories: 450 },
      { foodName: "샐러드(1그릇)", calories: 110 },
      { foodName: "라면(1봉지)", calories: 500 },
      { foodName: "초콜릿(1조각)", calories: 60 }
    ];

    const count = Math.floor(Math.random() * 3) + 1; // 1~3개
    const shuffled = [...foodCandidates].sort(() => Math.random() - 0.5);
    const items = shuffled.slice(0, count);

    const totalCalories = items.reduce(
      (sum, item) => sum + (item.calories || 0),
      0
    );

    const note =
      count === 1
        ? "단일 음식에 대한 데모 분석 결과입니다. YOLO 서버 연결 시 실제 인식 결과로 대체됩니다."
        : "여러 음식을 함께 인식한 데모 분석 결과입니다. YOLO 서버 연결 시 실제 인식 결과로 대체됩니다.";

    const responseBody = {
      items,
      totalCalories,
      note
    };

    return {
      statusCode: 200,
      headers: defaultHeaders,
      body: JSON.stringify(responseBody)
    };
  } catch (err) {
    console.error("Analyze function error:", err);
    return {
      statusCode: 500,
      headers: defaultHeaders,
      body: JSON.stringify({ error: "Server error" })
    };
  }
};
