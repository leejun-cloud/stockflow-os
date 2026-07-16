'use client';

import { useState, useTransition } from 'react';
import type { AssetRecord, SubmissionRecord, UserRecord } from '@/lib/domain';

type AssetWithSubmissions = AssetRecord & { submissions: SubmissionRecord[] };

type Props = {
  currentUser: UserRecord | null;
  initialAssets: AssetWithSubmissions[];
};

const platforms = [
  { key: 'adobe', label: 'Adobe Stock' },
  { key: 'shutterstock', label: 'Shutterstock' },
  { key: 'alamy', label: 'Alamy' },
  { key: 'getty', label: 'Getty / iStock' },
] as const;

async function fetchAssets() {
  const response = await fetch('/api/assets', { cache: 'no-store' });
  if (!response.ok) throw new Error('자산 목록을 불러오지 못했습니다.');
  const data = await response.json();
  return data.assets as AssetWithSubmissions[];
}

export function StockDashboardClient({ currentUser, initialAssets }: Props) {
  const [user, setUser] = useState(currentUser);
  const [assets, setAssets] = useState(initialAssets);
  const [message, setMessage] = useState('');
  const [mode, setMode] = useState<'login' | 'register'>('register');
  const [isPending, startTransition] = useTransition();

  async function refresh() {
    if (!user) return;
    const nextAssets = await fetchAssets();
    setAssets(nextAssets);
  }

  async function handleAuth(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());
    const endpoint = mode === 'register' ? '/api/auth/register' : '/api/auth/login';
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) {
      setMessage(data.error || '인증 실패');
      return;
    }
    setUser(data.user);
    setMessage(mode === 'register' ? '가입 및 로그인 완료' : '로그인 완료');
    form.reset();
    const nextAssets = await fetchAssets();
    setAssets(nextAssets);
  }

  async function handleLogout() {
    await fetch('/api/auth/session', { method: 'DELETE' });
    setUser(null);
    setAssets([]);
    setMessage('로그아웃되었습니다.');
  }

  async function handleUpload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    setMessage('업로드 중...');
    const response = await fetch('/api/assets/upload', { method: 'POST', body: formData });
    const data = await response.json();
    if (!response.ok) {
      setMessage(data.error || '업로드 실패');
      return;
    }
    form.reset();
    await refresh();
    setMessage('업로드 완료');
  }

  function handleExport(assetId: string, platform: string) {
    startTransition(async () => {
      setMessage(`${platform} 패키지 생성 중...`);
      const response = await fetch(`/api/assets/${assetId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform }),
      });
      const data = await response.json();
      if (!response.ok) {
        setMessage(data.error || `${platform} 패키지 생성 실패`);
        return;
      }
      await refresh();
      setMessage(`${platform} 패키지 생성 완료`);
      window.location.href = data.downloadUrl;
    });
  }

  if (!user) {
    return (
      <section className="card section auth-shell">
        <div className="dashboard-header">
          <div>
            <h2>로그인 / 회원가입</h2>
            <p className="lead compact">사용자별 자산을 분리하려면 먼저 계정이 필요합니다.</p>
          </div>
          <div className="auth-mode-switch">
            <button type="button" className={`button ${mode === 'register' ? 'primary' : ''}`} onClick={() => setMode('register')}>
              회원가입
            </button>
            <button type="button" className={`button ${mode === 'login' ? 'primary' : ''}`} onClick={() => setMode('login')}>
              로그인
            </button>
          </div>
        </div>
        <form className="upload-form" onSubmit={(event) => void handleAuth(event)}>
          {mode === 'register' ? (
            <label>
              이름
              <input name="name" type="text" required minLength={2} />
            </label>
          ) : null}
          <label>
            이메일
            <input name="email" type="email" required />
          </label>
          <label>
            비밀번호
            <input name="password" type="password" required minLength={8} />
          </label>
          <button type="submit" className="button primary">
            {mode === 'register' ? '회원가입 후 시작' : '로그인'}
          </button>
        </form>
        {message ? <p className="status-note">{message}</p> : null}
      </section>
    );
  }

  return (
    <section className="card section">
      <div className="dashboard-header">
        <div>
          <h2>실제 업로드 / 어댑터 대시보드</h2>
          <p className="lead compact">{user.name}님 계정으로 로그인됨 · 사용자별 자산이 분리 저장됩니다.</p>
        </div>
        <div className="auth-mode-switch">
          <button type="button" className="button" onClick={() => void refresh()}>새로고침</button>
          <button type="button" className="button" onClick={() => void handleLogout()}>로그아웃</button>
        </div>
      </div>

      <form className="upload-form" onSubmit={(event) => void handleUpload(event)}>
        <label>
          이미지 파일
          <input name="file" type="file" accept="image/*" required />
        </label>
        <label>
          제목
          <input name="title" type="text" placeholder="예: Bright classroom reading scene" />
        </label>
        <label>
          설명
          <textarea name="description" rows={3} placeholder="사진 설명" />
        </label>
        <label>
          키워드
          <input name="keywords" type="text" placeholder="children, education, library" />
        </label>
        <label>
          릴리스 상태
          <select name="releaseStatus" defaultValue="none">
            <option value="none">없음 (editorial)</option>
            <option value="model_attached">모델 릴리스 첨부</option>
            <option value="property_attached">프로퍼티 릴리스 첨부</option>
            <option value="both_attached">둘 다 첨부</option>
          </select>
        </label>
        <button type="submit" className="button primary" disabled={isPending}>파일 저장</button>
      </form>

      {message ? <p className="status-note">{message}</p> : null}

      <div className="asset-grid">
        {assets.length === 0 ? (
          <div className="empty-state">아직 업로드된 자산이 없습니다.</div>
        ) : (
          assets.map((asset) => (
            <article key={asset.id} className="asset-card">
              <div className="asset-meta">
                <h3>{asset.title}</h3>
                <p>{asset.description || '설명 없음'}</p>
                <ul className="meta-list">
                  <li>파일: {asset.originalFilename}</li>
                  <li>저장: {asset.storageBackend}</li>
                  <li>크기: {asset.width ?? '?'} × {asset.height ?? '?'}</li>
                  <li>릴리스: {asset.releaseStatus}</li>
                  <li>키워드: {asset.keywords.join(', ') || '없음'}</li>
                </ul>
              </div>
              <div className="adapter-actions">
                {platforms.map((platform) => (
                  <button key={platform.key} type="button" className="button" disabled={isPending} onClick={() => handleExport(asset.id, platform.key)}>
                    {platform.label} 패키지 생성
                  </button>
                ))}
              </div>
              <div className="submission-log">
                <strong>최근 생성 패키지</strong>
                {asset.submissions.length === 0 ? (
                  <p>아직 생성된 제출 패키지가 없습니다.</p>
                ) : (
                  <ul className="meta-list">
                    {asset.submissions.slice(0, 4).map((submission) => (
                      <li key={submission.id}>
                        {submission.platform} · {submission.status} · {submission.exportBackend} · {new Date(submission.createdAt).toLocaleString('ko-KR')}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
