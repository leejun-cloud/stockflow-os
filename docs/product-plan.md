# 글로벌 스톡사진 멀티 업로드·심사 자동화 플랫폼 기획서

> **For Hermes:** 이 문서는 MVP 문서가 아니라 실제 사업/운영 가능한 완성형 제품 기획서 초안이다. 제품 구조, 운영 플로우, 실사용 DB 스키마, 사이트별 어댑터 참조 메뉴까지 포함한다.

**문서 버전:** v1.0  
**작성일:** 2026-07-16  
**문서 성격:** 서비스 기획 + 운영 설계 + 데이터 모델 설계 + 어댑터 규격서 목차

---

## 1. 제품 한 줄 정의

사용자가 사진만 업로드하면 시스템이 사진 품질·권리·시장성·플랫폼 적합성을 자동 분석하고, 각 사이트별 요구 형식에 맞춰 메타데이터를 생성·변환하며, 제출·심사 상태 추적·거절 사유 학습·재업로드 조정까지 수행하는 **멀티 스톡사진 운영 자동화 플랫폼**.

---

## 2. 제품명 제안

- **StockFlow OS**
- **PhotoOps Hub**
- **StockPilot**
- **MetaSubmit AI**
- **StockBridge Studio**

이 문서에서는 임시로 **StockFlow OS**라고 표기한다.

---

## 3. 문제 정의

현재 스톡사진 판매자는 다음 문제를 반복해서 겪는다.

### 3.1 업로드 전 단계의 비효율
- 사진 품질을 수동으로 확인해야 한다.
- 상업용/에디토리얼 구분을 매번 판단해야 한다.
- 인물/건물/브랜드/작품/사유재산 관련 릴리스 필요 여부를 사람이 기억해야 한다.
- 같은 사진을 여러 플랫폼 규칙에 맞게 각각 수정해야 한다.

### 3.2 메타데이터 작성의 중복 노동
- 제목, 설명, 키워드를 플랫폼마다 다시 입력해야 한다.
- 사이트마다 키워드 수, 정렬, 카테고리, 금칙어, 우선순위 규칙이 다르다.
- 영어 키워드 작성 품질이 수익성과 직접 연결된다.

### 3.3 업로드 후 운영의 단절
- 어디에 제출됐는지, 어디서 반려됐는지, 왜 반려됐는지 한눈에 보기 어렵다.
- 반려 사유를 누적 학습해 다음 제출에 반영하기 어렵다.
- 승인율, 수익률, 태그 성과, 주제 성과가 구조화되지 않는다.

### 3.4 시장 확장 한계
- 플랫폼이 늘수록 작업량이 선형 이상으로 증가한다.
- 대형 스톡 사이트별 규정 차이가 운영 병목이 된다.
- 결국 좋은 사진보다 운영 체계가 부족해 판매가 막힌다.

---

## 4. 제품 목표

### 4.1 핵심 목표
1. 사진 업로드 이후 사람의 반복 작업을 최대한 제거한다.
2. 플랫폼별 메타데이터 생성·변환을 자동화한다.
3. 심사/거절/재제출까지 하나의 운영 흐름으로 연결한다.
4. 거절 사유를 학습하여 승인율을 계속 올린다.
5. 사용자는 "사진 업로드 + 예외 검토"만 하면 되게 만든다.

### 4.2 성공 상태
- 사용자는 원본 사진만 넣는다.
- 시스템이 자동으로 품질 점검, 릴리스 점검, 플랫폼 적합성 분류를 한다.
- 시스템이 사이트별 메타데이터를 만든다.
- 시스템이 업로드 큐를 관리하고 제출한다.
- 시스템이 승인/거절 결과를 수집한다.
- 시스템이 거절 이유에 따라 메타데이터·제출 정책·사이트 우선순위를 자동 조정한다.

---

## 5. 대상 사용자

### 5.1 1차 사용자
- 여러 스톡 사이트에 사진을 판매하는 개인 작가
- 사진가/여행작가/다큐·실사 사진 작가
- 보유 이미지가 많은 콘텐츠 운영자
- 국내외 스톡 플랫폼에 꾸준히 제출하는 스튜디오

### 5.2 2차 사용자
- 외주로 스톡 운영을 대행하는 에이전시
- 여러 촬영자 포트폴리오를 관리하는 팀
- 사진+영상 혼합 자산을 운영하는 크리에이터 네트워크

---

## 6. 제품 핵심 가치

### 6.1 자동 분류
- 상업용 가능 여부
- 에디토리얼 전용 여부
- 릴리스 필요 여부
- 플랫폼별 제출 적합성
- 중복/유사 컷 위험도

### 6.2 메타데이터 자동화
- 제목 생성
- 설명 생성
- 키워드 생성
- 카테고리 추천
- 플랫폼별 규칙 변환
- 다국어 메타데이터 파생

### 6.3 제출 자동화
- 플랫폼별 큐 생성
- 제출 예약
- 업로드 성공/실패 재시도
- 릴리스/첨부 파일 동봉

### 6.4 심사 운영 자동화
- 승인/거절 상태 수집
- 거절 사유 정규화
- 거절 유형별 수정 제안
- 자동 수정 후 재업로드 정책 적용

### 6.5 운영 인텔리전스
- 승인율 추이
- 플랫폼별 수익성
- 카테고리별 성과
- 키워드 성과
- 거절 원인 빈도
- 작가별/컬렉션별 비교

---

## 7. 전체 운영 흐름

### 7.1 업로드 인입
1. 사용자가 원본 사진을 업로드한다.
2. 시스템이 해시 생성, 중복 검사, EXIF 추출, 기본 분류를 수행한다.
3. 촬영일, 위치, 렌즈, 해상도, 파일형식 등 기술 메타를 저장한다.

### 7.2 사전 분석
1. 이미지 품질 분석
2. 초점/흔들림/노이즈/노출/압축 손상 점검
3. 인물/브랜드/간판/작품/건물/문자 감지
4. 상업용/에디토리얼/보류 판정
5. 릴리스 필요 여부 예측
6. AI 생성/합성 여부 분류 또는 확인 요청

### 7.3 콘텐츠 생성
1. 기본 제목 생성
2. 상세 설명 생성
3. 핵심 키워드 생성
4. 분위기/개념/상황 키워드 생성
5. 장소/계절/행동/대상 태그 생성
6. 금칙어/중복 키워드 제거

### 7.4 플랫폼 변환
1. Adobe용 메타데이터 생성
2. Shutterstock용 메타데이터 생성
3. Alamy용 메타데이터 생성
4. Getty/iStock용 메타데이터 생성
5. 기타 플랫폼용 파생본 생성

### 7.5 제출 준비
1. 사이트별 제출 가능 여부 점검
2. 릴리스 누락 확인
3. 카테고리 확인
4. 큐 우선순위 계산
5. 제출 배치 구성

### 7.6 제출 실행
1. 어댑터가 사이트별 업로드 절차 수행
2. 결과를 Submission Attempt로 기록
3. 성공 시 심사 대기 상태로 전환
4. 실패 시 재시도/수동 검토 큐로 이동

### 7.7 심사 추적
1. 상태 폴링 또는 브라우저 수집
2. 승인/거절/추가정보요청 반영
3. 거절 사유 정규화
4. 규칙 엔진이 수정 제안 생성
5. 자동 재제출 정책 평가

### 7.8 학습 루프
1. 거절 패턴 누적
2. 사이트별 승인 확률 모델 갱신
3. 메타데이터 생성 규칙 업데이트
4. 품질 기준 임계치 조정
5. 플랫폼별 추천 전략 개선

---

## 8. 핵심 기능 모듈

### 8.1 자산 관리
- 원본 파일 보관
- 파생 파일 관리
- 해시 중복 검사
- 촬영 세션/컬렉션 관리
- 작가별 라이브러리 분리

### 8.2 분석 엔진
- 기술 품질 분석
- 장면 분류
- 객체/상표/얼굴 감지
- 릴리스 필요성 추정
- 중복/유사도 분석

### 8.3 메타데이터 엔진
- 베이스 메타데이터 생성
- 키워드 점수화
- 언어 변환
- 플랫폼별 변환 규칙 적용
- 금칙어/반려유발 요소 필터링

### 8.4 릴리스 관리
- 인물 릴리스 업로드/연결
- 재산 릴리스 업로드/연결
- 릴리스 유효성 검증
- 자산과 릴리스 매핑

### 8.5 제출 오케스트레이터
- 사이트별 큐 생성
- 예약 제출
- 동시성 제어
- 실패 재시도
- 휴먼 승인 게이트 설정

### 8.6 심사/거절 대응 엔진
- 승인/거절 상태 수집
- 거절 사유 표준화
- 수정 정책 추천
- 자동 재제출 여부 판단

### 8.7 운영 대시보드
- 승인율
- 반려율
- 사이트별 상태
- 수익성
- 에러 로그
- 수동검토 큐

### 8.8 어댑터 관리센터
- 플랫폼별 연결 상태
- 자격증명 상태
- 마지막 성공 제출 시각
- 사이트 규칙 버전
- 브라우저 자동화 상태

---

## 9. 운영 정책

### 9.1 자동/수동 경계
자동 처리:
- 품질 점검
- 메타데이터 초안 생성
- 사이트별 규칙 변환
- 제출 큐 생성
- 상태 수집
- 단순 거절 사유 수정 제안

사람 검토 필요:
- 권리 애매한 사진
- 릴리스 불충분 사진
- 상표/작품/건물 법적 이슈 가능 사진
- 고부가 프리미엄 사이트 제출 전 최종 승인
- 반복 반려 사진의 전략 변경

### 9.2 자동 재업로드 정책
자동 재업로드 허용:
- 키워드 부족
- 카테고리 불일치
- 설명/제목 수정 가능
- 릴리스 연결 누락 후 보완 가능

자동 재업로드 금지 또는 수동 검토:
- 초점/노이즈/노출 등 원본 품질 문제
- 저작권/상표/재산권 분쟁 가능성
- 플랫폼 정책상 금지 콘텐츠
- 반복 동일 사유 2회 이상 반려

### 9.3 권리 안전장치
- 상업용 판정 전 얼굴/브랜드/작품 감지 필수
- 릴리스가 없는 자산은 commercial 큐 차단 가능
- 정책 위반 위험도가 높으면 자동 제출 금지
- 어댑터는 사이트별 정책 플래그를 강제 확인

---

## 10. 관리자/사용자 메뉴 구조

### 10.1 상단 메인 메뉴
1. **대시보드**
2. **자산 라이브러리**
3. **메타데이터 스튜디오**
4. **릴리스 센터**
5. **제출 오케스트레이션**
6. **심사/거절 대응**
7. **플랫폼 어댑터**
8. **분석 리포트**
9. **설정**
10. **감사로그**

### 10.2 플랫폼 어댑터 메뉴 하위 구조
- 어댑터 개요
- 연결 상태
- 인증/계정 관리
- 파일 제출 규칙
- 메타데이터 변환 규칙
- 릴리스 요구 규칙
- 심사 상태 수집 방식
- 반려 사유 매핑
- 자동 수정 규칙
- 사이트별 에러코드/예외 처리
- 마지막 동기화 기록
- 규칙 버전 히스토리

### 10.3 사이트별 어댑터 참조 메뉴 예시
- Adobe Stock Adapter
- Shutterstock Adapter
- Alamy Adapter
- Getty / iStock Adapter
- Dreamstime Adapter
- 123RF Adapter
- Wirestock Adapter
- Foap Adapter
- Picfair Adapter
- Stocksy Adapter
- Pond5 Adapter
- Fine Art America Adapter

### 10.4 어댑터 문서 내부 메뉴 템플릿
각 어댑터는 아래 목차를 동일하게 가진다.

1. 플랫폼 개요
2. 지원 자산 유형
3. 인증 방식
4. 제출 가능 상태 정의
5. 파일 요구사항
6. 메타데이터 필드 매핑
7. 키워드 규칙
8. 카테고리 규칙
9. 릴리스 요구조건
10. 제출 절차
11. 상태 수집 절차
12. 거절 사유 원문 → 내부 코드 매핑
13. 자동 수정 가능 항목
14. 자동 수정 금지 항목
15. 재제출 정책
16. 예외/장애 처리
17. 정책 버전 및 마지막 검증일

---

## 11. 실사용 기준 DB 설계 원칙

### 11.1 설계 방향
- 단일 사진이 여러 사이트에 여러 버전 메타데이터로 제출될 수 있어야 한다.
- 릴리스, 권리 제한, 상태, 반려 사유가 자산별로 독립 저장되어야 한다.
- 자동 생성 메타데이터와 사람 수정 메타데이터의 이력이 분리되어야 한다.
- 제출 시도와 최종 제출 상태를 분리해야 한다.
- 거절 사유는 원문과 정규화 코드를 동시에 저장해야 한다.
- 규칙 엔진과 어댑터 버전 추적이 가능해야 한다.

### 11.2 권장 기술 스택
- 주 DB: **PostgreSQL**
- 검색/필터: Postgres FTS + 필요시 OpenSearch
- 파일 저장: S3 호환 스토리지
- 비동기 작업: Redis + 큐 워커
- 이벤트 로그: append-only event table

---

## 12. 실사용 DB 스키마

아래는 운영 가능한 수준의 핵심 스키마다. 실제 구현 시에는 파티셔닝, 인덱스, JSONB 보조 필드를 함께 쓴다.

### 12.1 accounts
플랫폼 사용자 또는 조직 계정

필드:
- id (uuid, pk)
- owner_type (enum: user, team, org)
- owner_id (uuid)
- name
- plan_tier
- timezone
- status (active, suspended, closed)
- created_at
- updated_at

### 12.2 users
- id (uuid, pk)
- account_id (fk accounts)
- email
- name
- role (owner, admin, editor, reviewer, viewer)
- locale
- status
- last_login_at
- created_at
- updated_at

### 12.3 creators
실제 사진 업로더/작가 단위

- id (uuid, pk)
- account_id (fk accounts)
- display_name
- legal_name
- country
- language
- bio
- tax_profile_id (nullable)
- default_metadata_profile_id (nullable)
- created_at
- updated_at

### 12.4 collections
촬영 세션/프로젝트/주제 묶음

- id (uuid, pk)
- account_id (fk accounts)
- creator_id (fk creators)
- name
- slug
- description
- capture_start_at
- capture_end_at
- location_name
- status (draft, active, archived)
- created_at
- updated_at

### 12.5 assets
원본 자산 마스터

- id (uuid, pk)
- account_id (fk accounts)
- creator_id (fk creators)
- collection_id (fk collections, nullable)
- asset_type (photo, vector, illustration, video)
- source_kind (camera, scan, illustration, ai_generated, ai_assisted, unknown)
- original_filename
- storage_key
- sha256
- phash
- mime_type
- width
- height
- megapixels
- color_space
- exif_json (jsonb)
- captured_at
- uploaded_at
- country
- city
- latitude
- longitude
- camera_make
- camera_model
- lens_model
- ai_disclosure_status (confirmed_no, confirmed_yes, suspected, unknown)
- commercial_eligibility (eligible, editorial_only, blocked, review_required)
- release_requirement_status (not_required, required, partial, satisfied, review_required)
- quality_status (pending, pass, warning, fail)
- lifecycle_status (ingested, analyzed, ready, queued, submitted, archived)
- created_at
- updated_at

인덱스:
- unique(account_id, sha256)
- index(account_id, phash)
- index(account_id, creator_id, captured_at)
- index(account_id, commercial_eligibility)

### 12.6 asset_variants
플랫폼 제출용 파생본

- id (uuid, pk)
- asset_id (fk assets)
- variant_type (original, resized, cropped, vector_preview, platform_export)
- target_platform_id (fk platforms, nullable)
- storage_key
- width
- height
- file_size_bytes
- format
- render_profile
- checksum
- created_at

### 12.7 asset_analysis_runs
분석 실행 로그

- id (uuid, pk)
- asset_id (fk assets)
- pipeline_version
- started_at
- finished_at
- status (queued, running, succeeded, failed, partial)
- triggered_by (system, user, rule_engine, reprocess)
- error_summary
- raw_result_json (jsonb)

### 12.8 asset_quality_scores
품질 평가 결과

- id (uuid, pk)
- asset_id (fk assets)
- analysis_run_id (fk asset_analysis_runs)
- sharpness_score
- exposure_score
- noise_score
- white_balance_score
- artifact_score
- duplicate_risk_score
- commercial_appeal_score
- overall_score
- qc_recommendation (pass, review, fail)
- created_at

### 12.9 detected_entities
사진에서 감지된 엔티티

- id (uuid, pk)
- asset_id (fk assets)
- analysis_run_id (fk asset_analysis_runs)
- entity_type (face, logo, text, landmark, artwork, property, license_plate, animal, food, object)
- label
- confidence
- bbox_json (jsonb)
- requires_release_hint (boolean)
- requires_manual_review_hint (boolean)
- created_at

### 12.10 releases
릴리스 마스터

- id (uuid, pk)
- account_id (fk accounts)
- release_type (model, property, editorial_consent, event_credential)
- owner_name
- subject_name
- related_property_name
- signer_name
- signed_at
- country
- language
- document_storage_key
- checksum
- validity_status (valid, incomplete, expired, rejected, review_required)
- notes
- created_at
- updated_at

### 12.11 asset_release_links
자산과 릴리스 연결

- id (uuid, pk)
- asset_id (fk assets)
- release_id (fk releases)
- link_role (primary_subject, background_person, property_owner, event_credential)
- coverage_status (full, partial, uncertain)
- created_at

### 12.12 metadata_profiles
조직/작가별 메타데이터 생성 설정

- id (uuid, pk)
- account_id (fk accounts)
- creator_id (fk creators, nullable)
- name
- default_language
- title_style
- description_style
- keyword_style
- location_policy
- people_naming_policy
- ai_disclosure_policy
- banned_terms_json (jsonb)
- preferred_terms_json (jsonb)
- created_at
- updated_at

### 12.13 asset_metadata_master
플랫폼 중립 베이스 메타데이터

- id (uuid, pk)
- asset_id (fk assets)
- profile_id (fk metadata_profiles, nullable)
- title
- description
- category_primary
- category_secondary
- keywords_json (jsonb)
- concepts_json (jsonb)
- mood_json (jsonb)
- location_text
- people_count
- property_notes
- editorial_caption
- language
- source (ai_generated, ai_refined, human_written, imported)
- version_no
- is_current
- created_by
- created_at

### 12.14 asset_metadata_versions
모든 메타데이터 버전 이력

- id (uuid, pk)
- asset_id (fk assets)
- based_on_master_id (fk asset_metadata_master, nullable)
- change_reason (initial_generation, human_edit, rejection_fix, adapter_transform, bulk_update)
- title
- description
- keywords_json (jsonb)
- category_primary
- category_secondary
- language
- diff_summary
- created_by
- created_at

### 12.15 platforms
플랫폼 정의

- id (uuid, pk)
- code (unique)  -- adobe_stock, shutterstock, alamy, getty, etc.
- name
- platform_type (stock_marketplace, premium_curated, aggregator, direct_sale)
- active
- created_at
- updated_at

### 12.16 platform_accounts
사용자의 사이트별 연결 계정

- id (uuid, pk)
- account_id (fk accounts)
- platform_id (fk platforms)
- creator_id (fk creators, nullable)
- external_account_name
- external_account_id
- auth_type (cookie, oauth, api_key, browser_session, manual)
- credential_ref
- status (connected, expired, error, paused)
- capabilities_json (jsonb)
- last_verified_at
- created_at
- updated_at

### 12.17 platform_rulesets
사이트 규칙 버전 저장

- id (uuid, pk)
- platform_id (fk platforms)
- adapter_version
- rules_version
- effective_from
- effective_to (nullable)
- rules_json (jsonb)
- validation_schema_json (jsonb)
- created_at

### 12.18 platform_metadata_mappings
플랫폼별 필드 매핑 정의

- id (uuid, pk)
- platform_id (fk platforms)
- ruleset_id (fk platform_rulesets)
- internal_field
- external_field
- transform_type
- required
- max_length
- max_items
- order_sensitive
- validation_regex
- notes
- created_at

### 12.19 asset_platform_candidates
어느 사이트에 보낼지 추천/판정 결과

- id (uuid, pk)
- asset_id (fk assets)
- platform_id (fk platforms)
- eligibility_status (recommended, possible, blocked, review_required)
- eligibility_score
- block_reasons_json (jsonb)
- recommendation_notes
- created_at
- updated_at

### 12.20 platform_submission_records
자산의 플랫폼별 최종 제출 단위

- id (uuid, pk)
- asset_id (fk assets)
- platform_id (fk platforms)
- platform_account_id (fk platform_accounts)
- metadata_version_id (fk asset_metadata_versions)
- variant_id (fk asset_variants, nullable)
- submission_status (draft, queued, uploading, submitted, in_review, approved, rejected, removed, paused)
- platform_asset_identifier
- platform_asset_url
- submitted_at
- last_status_at
- approval_at
- rejection_at
- current_attempt_no
- last_error_code
- last_error_message
- auto_retry_enabled
- manual_review_required
- created_at
- updated_at

### 12.21 submission_attempts
실제 업로드/제출 시도 로그

- id (uuid, pk)
- submission_record_id (fk platform_submission_records)
- attempt_no
- adapter_run_id (fk adapter_runs)
- triggered_by (scheduler, user, retry_policy, rejection_repair)
- status (started, succeeded, failed, partial)
- request_payload_json (jsonb)
- response_payload_json (jsonb)
- error_code
- error_message
- started_at
- finished_at

### 12.22 review_events
플랫폼 심사 상태 이벤트

- id (uuid, pk)
- submission_record_id (fk platform_submission_records)
- platform_event_type (submitted, queued_for_review, approved, rejected, needs_info, removed)
- raw_status_text
- event_at
- raw_payload_json (jsonb)
- created_at

### 12.23 rejection_reason_catalog
내부 표준 거절 사유 사전

- id (uuid, pk)
- code (unique)
- category (technical, legal, metadata, duplicate, commercial_value, ai_policy, release, platform_policy)
- title
- description
- auto_fixable (boolean)
- recommended_action
- severity (low, medium, high, critical)
- created_at

### 12.24 rejection_events
실제 반려 이벤트

- id (uuid, pk)
- submission_record_id (fk platform_submission_records)
- review_event_id (fk review_events)
- catalog_reason_id (fk rejection_reason_catalog, nullable)
- platform_reason_code
- platform_reason_text
- normalized_confidence
- raw_payload_json (jsonb)
- created_at

### 12.25 correction_actions
거절 대응 조치 기록

- id (uuid, pk)
- rejection_event_id (fk rejection_events)
- action_type (edit_title, edit_description, prune_keywords, change_category, attach_release, switch_editorial, block_platform, manual_review, do_not_retry)
- action_status (planned, executed, skipped, failed)
- applied_payload_json (jsonb)
- executed_by (system, user, admin)
- executed_at
- notes

### 12.26 retry_policies
재제출 정책

- id (uuid, pk)
- account_id (fk accounts)
- platform_id (fk platforms, nullable)
- reason_code (fk rejection_reason_catalog.code, nullable)
- max_retry_count
- cooldown_minutes
- requires_human_review_after
- allow_auto_metadata_edit
- allow_auto_release_attach
- allow_auto_platform_switch
- active
- created_at
- updated_at

### 12.27 adapter_definitions
어댑터 정의

- id (uuid, pk)
- platform_id (fk platforms)
- code
- version
- runtime_type (api, browser_automation, hybrid, manual_assist)
- status (active, deprecated, testing)
- supports_upload
- supports_status_sync
- supports_auto_fix
- supports_delete
- supports_release_upload
- config_schema_json (jsonb)
- created_at
- updated_at

### 12.28 adapter_runs
어댑터 실행 로그

- id (uuid, pk)
- adapter_definition_id (fk adapter_definitions)
- platform_account_id (fk platform_accounts)
- job_type (upload, sync_status, repair, delete, validate_session)
- status (queued, running, succeeded, failed, partial)
- started_at
- finished_at
- summary
- raw_log_storage_key
- created_at

### 12.29 jobs
비동기 작업 큐 메타

- id (uuid, pk)
- job_type
- priority
- payload_json (jsonb)
- status (queued, running, succeeded, failed, dead_letter)
- scheduled_at
- started_at
- finished_at
- retry_count
- max_retry_count
- error_message
- created_at

### 12.30 earnings
수익 데이터

- id (uuid, pk)
- submission_record_id (fk platform_submission_records)
- platform_id (fk platforms)
- sale_date
- gross_amount
- net_amount
- currency
- license_type
- raw_payload_json (jsonb)
- created_at

### 12.31 audit_logs
감사 로그

- id (uuid, pk)
- account_id (fk accounts)
- actor_type (user, system, worker, admin)
- actor_id
- action
- target_type
- target_id
- metadata_json (jsonb)
- created_at

---

## 13. 관계 구조 요약

핵심 관계:
- 하나의 **asset**은 여러 **asset_metadata_versions**를 가진다.
- 하나의 **asset**은 여러 **asset_platform_candidates**를 가진다.
- 하나의 **asset**은 여러 **platform_submission_records**를 가진다.
- 하나의 **platform_submission_record**는 여러 **submission_attempts**와 **review_events**를 가진다.
- 하나의 **review_event**는 0개 이상 **rejection_events**를 가진다.
- 하나의 **rejection_event**는 여러 **correction_actions**를 가진다.
- 하나의 **asset**은 여러 **releases**와 연결될 수 있다.
- 하나의 **platform**은 여러 **adapter_definitions**와 **rulesets**를 가진다.

---

## 14. 실제 화면 설계 제안

### 14.1 대시보드
- 오늘 업로드 수
- 제출 대기 수
- 심사 중 수
- 승인 수
- 반려 수
- 자동 수정 가능 반려 수
- 수동 검토 필요 수
- 플랫폼별 성공률

### 14.2 자산 상세 화면
섹션:
- 원본 미리보기
- 기술 정보
- 품질 점수
- 감지 엔티티
- 상업용/에디토리얼 판정
- 릴리스 연결
- 베이스 메타데이터
- 플랫폼별 메타데이터 탭
- 제출 이력
- 심사 이력
- 수익 이력

### 14.3 거절 대응 센터
- 반려 이유별 그룹 보기
- 자동 수정 가능 항목 필터
- 재제출 추천 큐
- 반복 반려 자산 목록
- 플랫폼별 반려 패턴 리포트

### 14.4 어댑터 관리센터
- 연결 상태 초록/노랑/빨강
- 마지막 로그인 검증 시각
- 마지막 성공 제출 시각
- 현재 차단 여부
- 사이트 규칙 버전
- 테스트 제출 버튼
- 상태동기화 실행 버튼

---

## 15. 사이트별 어댑터 명세서 샘플 구조

아래는 실제 제품 안에서 참조할 **어댑터 명세서 메뉴 포맷**이다.

### 15.1 Adobe Stock Adapter 명세서
메뉴:
- 개요
- 계정 연결 방식
- 지원 파일 형식
- 해상도 규칙
- 키워드 제한 규칙
- 제목/설명 길이 규칙
- 카테고리 맵
- 릴리스 첨부 규칙
- 거절 사유 매핑표
- 자동 수정 규칙
- 동기화 주기
- 알려진 제약

### 15.2 Shutterstock Adapter 명세서
메뉴:
- 개요
- 업로드 절차
- 메타데이터 최소 요건
- 릴리스 업로드 요건
- 에디토리얼/커머셜 분기
- 자주 발생하는 반려 사유
- 자동 수정 가능 범위
- 수동 검토 필수 범위
- 세션 만료 처리
- 재시도 정책

### 15.3 Alamy Adapter 명세서
메뉴:
- 파일 규격
- QC 기준
- 캡션/태그 입력 정책
- discoverability 정책
- rights 관리 방식
- commercial/editorial 분기
- 실패 시 복구 절차

### 15.4 Getty / iStock Adapter 명세서
메뉴:
- 심사형 온보딩 구조
- 샘플 제출 단계
- JPEG/RGB 규칙
- 릴리스 요구 규칙
- 중복 제출 경고
- AI 생성물 제한
- 승인 후 라이프사이클

### 15.5 공통 어댑터 인터페이스
모든 어댑터는 아래 인터페이스를 구현한다.

- `validate_session()`
- `validate_asset_for_platform(asset_id)`
- `build_platform_payload(asset_id, metadata_version_id)`
- `upload_asset(asset_id, variant_id)`
- `attach_release(submission_record_id, release_id)`
- `submit_for_review(submission_record_id)`
- `sync_submission_status(submission_record_id)`
- `normalize_rejection_reason(raw_reason)`
- `propose_auto_correction(rejection_event_id)`
- `apply_auto_correction(correction_action_id)`
- `resubmit(submission_record_id)`

---

## 16. 자동 수정 엔진 규칙

### 16.1 자동 수정 가능한 항목
- 키워드 과다/부족 조정
- 제목 길이 조정
- 설명 문장 정리
- 카테고리 변경
- 릴리스 연결 재시도
- commercial → editorial 전환 제안

### 16.2 자동 수정 금지 항목
- 원본 이미지 품질 저하 문제의 임의 보정
- 법적 권리 불명확 자산의 강제 제출
- 반복 반려 자산의 무한 재시도
- 정책상 금지 자산의 우회 제출

### 16.3 자동 수정 결과 기록
반드시 저장:
- 어떤 규칙이 발동했는지
- 어떤 필드가 바뀌었는지
- 이전 버전과 이후 버전 차이
- 재제출 결과가 어땠는지

---

## 17. 분석·리포트 지표

### 17.1 운영 지표
- 제출 수
- 승인 수
- 반려 수
- 플랫폼별 승인율
- 자동 수정 후 승인 전환율
- 평균 심사 소요 시간
- 세션 오류율

### 17.2 콘텐츠 지표
- 카테고리별 승인율
- 키워드 수 대비 승인율
- 얼굴 포함 사진 승인율
- 상업용 vs 에디토리얼 성과
- 기기별 성과
- 위치/주제별 판매 성과

### 17.3 비즈니스 지표
- 플랫폼별 순수익
- 자산당 평균 수익
- 컬렉션별 ROI
- 작가별 승인율·수익율
- 반려 대응 자동화 절감 시간

---

## 18. 권장 개발 구조

### 18.1 백엔드 서비스
- API 서비스
- 분석 워커
- 메타데이터 생성 워커
- 어댑터 워커
- 상태 동기화 워커
- 리포트 집계 워커

### 18.2 스토리지 구조
- originals/
- variants/
- releases/
- adapter-logs/
- exports/
- reports/

### 18.3 내부 서비스 경계
- Asset Service
- Analysis Service
- Metadata Service
- Release Service
- Submission Service
- Adapter Service
- Review Intelligence Service
- Reporting Service

---

## 19. 보안/컴플라이언스 고려사항

- 플랫폼 계정 인증정보는 vault 또는 암호화 저장소 사용
- 릴리스 문서는 민감정보로 분류
- 삭제 요청 시 자산/문서/로그 보존 정책 분리
- 플랫폼 약관 위반 가능성이 있는 무리한 브라우저 자동화는 정책 기반 제한 필요
- 자동화 수준은 사이트별 리스크 점수에 따라 다르게 적용

---

## 20. 단계별 개발 순서 제안

이 문서는 MVP 용어 대신 **완성형 제품을 향한 개발 순서**로 표현한다.

### Phase 1. 코어 자산/메타/제출 데이터층
- 자산 관리
- 메타데이터 버전 관리
- 릴리스 관리
- 제출 레코드/시도/심사 이벤트 구조

### Phase 2. 분석 엔진 + 메타데이터 엔진
- 품질 분석
- 엔티티 감지
- 권리 판정
- 플랫폼 중립 메타 생성

### Phase 3. 핵심 4개 어댑터
- Adobe
- Shutterstock
- Alamy
- Getty/iStock

### Phase 4. 반려 대응 자동화
- 사유 정규화
- 수정 정책
- 재제출 엔진
- 승인율 개선 루프

### Phase 5. 운영 리포트 + 수익 분석
- 플랫폼별 성과
- 키워드 성과
- 컬렉션/작가 비교
- 수익 집계

### Phase 6. 확장 어댑터
- Dreamstime
- 123RF
- Wirestock
- Foap
- 기타 채널

---

## 21. 결론

이 제품의 본질은 단순 업로더가 아니다.  
진짜 제품 가치는 아래 세 가지를 하나로 묶는 데 있다.

1. **사진 사전 검수 엔진**  
2. **플랫폼별 메타데이터 변환 엔진**  
3. **심사·거절·재제출 운영 엔진**

즉, 사용자가 원하는 것은 "여러 사이트에 대신 올려주는 기능" 자체가 아니라,  
**여러 사이트의 운영 복잡도를 플랫폼이 대신 흡수해주는 시스템**이다.

이 기획서 기준으로 구현하면, 단순 업로드 툴이 아니라  
**스톡사진 운영 OS**로 포지셔닝할 수 있다.

---

## 22. 바로 이어서 만들 수 있는 후속 문서

다음 문서를 바로 이어서 만들 수 있다.

1. **PostgreSQL 실제 CREATE TABLE DDL 문서**
2. **어드민/사용자 화면 IA 와이어프레임 문서**
3. **플랫폼 어댑터 명세서 1차 상세본 (Adobe/Shutterstock/Alamy/Getty)**
4. **백엔드 API 명세서**
5. **작업 큐/워커 설계 문서**
6. **자동 수정 규칙 엔진 상세 설계서**

원하면 다음 단계에서 바로 이어서 작성할 수 있다.
