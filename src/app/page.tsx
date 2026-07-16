import Link from 'next/link';

const highlights = [
  {
    title: '운영 시간 절감',
    body: '플랫폼별 반복 입력과 제출 흐름을 하나의 대시보드로 묶어 반복 노동을 줄입니다.',
  },
  {
    title: '승인율 최적화',
    body: '품질 점검, 릴리스 누락 경고, 반려 사유 학습을 통해 심사 통과 가능성을 높입니다.',
  },
  {
    title: '팀 워크플로우',
    body: '작가·운영자·검수자의 역할을 나누고 자산별 진행 상태를 명확하게 관리합니다.',
  },
];

const roadmap = [
  '1단계: Adobe / Shutterstock / Alamy 중심 MVP',
  '2단계: 반려 사유 정규화와 재제출 추천 엔진',
  '3단계: 팀 계정, 성과 분석, 수익성 대시보드',
  '4단계: Getty/iStock 및 추가 플랫폼 어댑터 확장',
];

export default function HomePage() {
  return (
    <div className="page-grid">
      <section className="hero card">
        <span className="eyebrow">Stock-photo contributor SaaS</span>
        <h1>멀티 플랫폼 스톡사진 제출 운영을 한 곳에서 관리하는 SaaS</h1>
        <p className="lead">
          StockFlow OS는 스톡사진 판매자를 위한 운영 도구입니다. 사진 품질 점검, 권리/릴리스 확인,
          메타데이터 생성, 플랫폼별 제출 준비, 심사 추적까지 하나의 흐름으로 연결합니다.
        </p>
        <div className="actions">
          <Link className="button primary" href="/manual">
            기획서/매뉴얼 보기
          </Link>
          <a className="button" href="https://github.com/leejun-cloud/stockflow-os" target="_blank" rel="noreferrer">
            GitHub 저장소
          </a>
        </div>
      </section>

      <section className="card section">
        <h2>왜 이 서비스인가</h2>
        <div className="feature-grid">
          {highlights.map((item) => (
            <article key={item.title} className="feature-card">
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="card section two-col">
        <div>
          <h2>핵심 기능</h2>
          <ul className="list">
            <li>사진 품질 및 중복 위험 사전 점검</li>
            <li>모델/프로퍼티 릴리스 연결 상태 확인</li>
            <li>Adobe, Shutterstock, Alamy용 메타데이터 파생</li>
            <li>제출 상태, 반려 사유, 재업로드 히스토리 추적</li>
            <li>팀 단위 큐 관리와 역할 분리</li>
          </ul>
        </div>
        <div>
          <h2>추천 로드맵</h2>
          <ol className="list ordered">
            {roadmap.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
        </div>
      </section>
    </div>
  );
}
