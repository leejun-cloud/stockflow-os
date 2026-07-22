# Firebase + 다운로드 인프라 셋업 (mvpkit firebase 모듈이 생성)

이 프로젝트에는 다음 서버리스 함수가 추가되었습니다:

- `api/_admin.js` — Firebase Admin 초기화(공용)
- `api/github-import.js` — 비공개 GitHub 저장소를 토큰 인증으로 가져오고, 소스 ZIP을 Firebase Storage(`products/{id}.zip`)에 업로드
- `api/download.js` — 구매(보유) 검증 후 5분짜리 서명 URL 발급

그리고 `vercel.json` 에 `Cross-Origin-Opener-Policy: same-origin-allow-popups` 헤더가 추가되었습니다
(없으면 Google 로그인 팝업이 COOP 정책에 막혀 실패합니다).

---

## ⚠️ 한 번은 사람이 해야 하는 단계 (자동화 불가 — 비밀값/콘솔 인증)

코드는 모두 준비됐고, 아래 비밀키 등록과 콘솔 설정만 하면 동작합니다.

### 1) Firebase 서비스계정 키 (필수)
Firebase Console → ⚙️ 프로젝트 설정 → **서비스 계정** → **새 비공개 키 생성** → JSON 다운로드.
base64로 인코딩해 보관소에 등록:

```
mvpkit keys set FIREBASE_SERVICE_ACCOUNT_B64 "$(base64 -i ~/Downloads/<서비스계정>.json | tr -d '\n')"
```

(Storage 버킷은 서비스계정의 project_id에서 자동 도출됩니다. 다르면 `FIREBASE_STORAGE_BUCKET` 도 등록하세요.)

### 2) GitHub 토큰 (github-import 사용 시)
GitHub → Settings → Personal access tokens.
- Fine-grained: 대상 저장소 + **Contents: Read-only**
- 또는 Classic: `repo` 스코프

```
mvpkit keys set GITHUB_TOKEN "<토큰>"
```

### 3) Firebase Authentication 콘솔 설정 (로그인 사용 시)
- **로그인 방법**: 이메일/비밀번호, Google 등 사용할 제공업체 **사용 설정**
- **승인된 도메인(Authorized domains)**: 배포 도메인(예: `*.vercel.app`, 커스텀 도메인)을 **추가**
  → 안 하면 Google 로그인이 `auth/unauthorized-domain` 으로 실패

### 4) 적용 + 배포
```
mvpkit apply . --deploy
```

---

## 클라이언트 주의사항
- 다운로드 버튼은 `api/download` 응답의 `url` 로 **`fetch` 하지 말고** `window.location.href = url`
  또는 `<a href download>` 로 받으세요 (서명 URL은 GCS CORS 미설정이라 브라우저 fetch는 막힘).
- 인증 실패 시 가짜(mock) 세션으로 폴백하지 마세요 — 실제 로그인 오류를 가립니다.

## Firestore 데이터 모델 (가정)
- `libraries` 문서: `{ userId, productId, method, unlockedAt }` — 보유/구매 여부 판단에 사용.
