// Firebase Admin 초기화 (서버리스 함수 공용). mvpkit firebase 모듈이 생성.
// 서비스계정 키는 환경변수로만 보관:
//   FIREBASE_SERVICE_ACCOUNT_B64  (base64로 인코딩한 JSON, 권장)  또는
//   FIREBASE_SERVICE_ACCOUNT       (원문 JSON 문자열)
// Storage 버킷은 서비스계정의 project_id 에서 자동 도출하며,
//   FIREBASE_STORAGE_BUCKET 환경변수로 덮어쓸 수 있다.

import admin from "firebase-admin";

function loadServiceAccount() {
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_B64;
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  let text = "";
  if (b64) text = Buffer.from(b64, "base64").toString("utf8");
  else if (raw) text = raw;
  else throw new Error("FIREBASE_SERVICE_ACCOUNT(_B64) 환경변수가 설정되지 않았습니다.");

  let json;
  try { json = JSON.parse(text); }
  catch {
    try { json = JSON.parse(Buffer.from(text, "base64").toString("utf8")); }
    catch { throw new Error("FIREBASE_SERVICE_ACCOUNT 형식이 올바른 JSON이 아닙니다."); }
  }
  if (json.private_key && json.private_key.includes("\\n")) {
    json.private_key = json.private_key.replace(/\\n/g, "\n");
  }
  return json;
}

let _bucketName = null;

export function getAdmin() {
  if (!admin.apps.length) {
    const sa = loadServiceAccount();
    _bucketName = process.env.FIREBASE_STORAGE_BUCKET || `${sa.project_id}.firebasestorage.app`;
    admin.initializeApp({
      credential: admin.credential.cert(sa),
      storageBucket: _bucketName,
    });
  }
  return admin;
}

export function getBucket() {
  getAdmin();
  return admin.storage().bucket(_bucketName || undefined);
}

export function getDb() {
  return getAdmin().firestore();
}

export async function verifyUid(idToken) {
  if (!idToken) throw new Error("로그인이 필요합니다.");
  const decoded = await getAdmin().auth().verifyIdToken(idToken);
  return decoded.uid;
}
