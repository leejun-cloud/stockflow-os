import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import { listAssetsForUser } from '@/lib/repository';
import { StockDashboardClient } from '@/components/stock-dashboard-client';
import { usingPostgres } from '@/lib/db';
import { getStorageBackend } from '@/lib/storage';

const highlights = [
  {
    title: 'PostgreSQL 대응',
    body: 'DATABASE_URL이 있으면 PostgreSQL 스키마를 자동 초기화하고 사용자/자산/제출 데이터를 분리 저장합니다.',
  },
  {
    title: '계정 기반 멀티테넌시',
    body: '회원가입/로그인 후 사용자별 자산과 제출 이력이 분리됩니다.',
  },
  {
    title: 'S3 호환 스토리지',
    body: 'MinIO/AWS S3 같은 객체 스토리지를 붙이면 업로드와 export zip을 실제 object storage에 저장합니다.',
  },
];

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const user = await getCurrentUser();
  const assets = user ? await listAssetsForUser(user.id) : [];

  return (
    <div className="page-grid">
      <section className="hero card">
        <span className="eyebrow">Stock-photo contributor SaaS</span>
        <h1>실제 업로드 + 로그인 + 사용자 분리 + PostgreSQL/S3 확장형 StockFlow OS</h1>
        <p className="lead">
          지금 이 빌드는 사용자 인증, 사용자별 자산 분리, 플랫폼별 export package 생성, PostgreSQL 전환,
          S3 호환 스토리지 연결까지 고려한 실제 서버 코드입니다.
        </p>
        <div className="actions">
          <Link className="button primary" href="/manual">
            기획서/매뉴얼 보기
          </Link>
          <a className="button" href="https://github.com/leejun-cloud/stockflow-os" target="_blank" rel="noreferrer">
            GitHub 저장소
          </a>
        </div>
        <p className="stack-note">
          활성 DB: <strong>{usingPostgres() ? 'PostgreSQL' : 'SQLite'}</strong> · 활성 스토리지: <strong>{getStorageBackend()}</strong>
        </p>
      </section>

      <section className="card section">
        <h2>이번 단계에서 실제로 추가한 것</h2>
        <div className="feature-grid">
          {highlights.map((item) => (
            <article key={item.title} className="feature-card">
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <StockDashboardClient currentUser={user} initialAssets={assets} />
    </div>
  );
}
