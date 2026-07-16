import Link from 'next/link';
import { listAssets } from '@/lib/repository';
import { StockDashboardClient } from '@/components/stock-dashboard-client';

const highlights = [
  {
    title: '실제 파일 업로드',
    body: '이미지를 서버 디스크와 로컬 DB에 저장하고 자산 목록으로 관리합니다.',
  },
  {
    title: '플랫폼별 메타데이터 변환',
    body: 'Adobe, Shutterstock, Alamy, Getty/iStock용 payload를 실제 코드로 생성합니다.',
  },
  {
    title: '실제 제출 패키지 생성',
    body: '원본 파일 + metadata.json + 플랫폼별 payload를 zip으로 묶어 바로 다운로드합니다.',
  },
];

const roadmap = [
  '로컬 저장 기반 운영 → 추후 PostgreSQL/S3로 확장',
  '플랫폼별 export package → 추후 인증/브라우저 자동화 연결',
  '반려 사유/승인율 학습 엔진 추가',
  '팀 계정 및 워크플로우 분리',
];

export const dynamic = 'force-dynamic';

export default function HomePage() {
  const assets = listAssets();

  return (
    <div className="page-grid">
      <section className="hero card">
        <span className="eyebrow">Stock-photo contributor SaaS</span>
        <h1>실제 업로드, 실제 스키마, 실제 어댑터가 들어간 StockFlow OS</h1>
        <p className="lead">
          지금 이 빌드는 단순 소개 페이지가 아니라 동작하는 프로토타입입니다. 자산 업로드, DB 저장,
          플랫폼별 메타데이터 변환, 제출 패키지 export까지 실제로 실행됩니다.
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
        <h2>현재 구현된 실제 기능</h2>
        <div className="feature-grid">
          {highlights.map((item) => (
            <article key={item.title} className="feature-card">
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <StockDashboardClient initialAssets={assets} />

      <section className="card section two-col">
        <div>
          <h2>핵심 구현 범위</h2>
          <ul className="list">
            <li>SQLite 스키마 (`assets`, `submissions`, `submission_attempts`)</li>
            <li>실제 이미지 업로드 API와 디스크 저장</li>
            <li>플랫폼별 metadata payload 생성기</li>
            <li>zip export 및 다운로드 API</li>
            <li>UI 기반 asset/submission 확인</li>
          </ul>
        </div>
        <div>
          <h2>다음 확장 순서</h2>
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
