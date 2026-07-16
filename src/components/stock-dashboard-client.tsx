'use client';

import { useState, useTransition } from 'react';
import type { AssetRecord, SubmissionRecord } from '@/lib/domain';

type AssetWithSubmissions = AssetRecord & { submissions: SubmissionRecord[] };

type Props = {
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

export function StockDashboardClient({ initialAssets }: Props) {
  const [assets, setAssets] = useState(initialAssets);
  const [message, setMessage] = useState('');
  const [isPending, startTransition] = useTransition();

  async function refresh() {
    const nextAssets = await fetchAssets();
    setAssets(nextAssets);
  }

  async function handleUpload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    setMessage('업로드 중...');

    const response = await fetch('/api/assets/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      setMessage('업로드 실패');
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

      if (!response.ok) {
        setMessage(`${platform} 패키지 생성 실패`);
        return;
      }

      const data = await response.json();
      await refresh();
      setMessage(`${platform} 패키지 생성 완료`);
      window.location.href = data.downloadUrl;
    });
  }

  return (
    <section className="card section">
      <div className="dashboard-header">
        <div>
          <h2>실제 업로드 / 어댑터 대시보드</h2>
          <p className="lead compact">
            로컬 DB에 자산을 저장하고, 각 플랫폼용 실제 제출 패키지(zip)를 생성합니다.
          </p>
        </div>
        <button type="button" className="button" onClick={() => void refresh()}>
          새로고침
        </button>
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
        <button type="submit" className="button primary" disabled={isPending}>
          파일 저장
        </button>
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
                  <li>크기: {asset.width ?? '?'} × {asset.height ?? '?'}</li>
                  <li>릴리스: {asset.releaseStatus}</li>
                  <li>키워드: {asset.keywords.join(', ') || '없음'}</li>
                </ul>
              </div>

              <div className="adapter-actions">
                {platforms.map((platform) => (
                  <button
                    key={platform.key}
                    type="button"
                    className="button"
                    disabled={isPending}
                    onClick={() => handleExport(asset.id, platform.key)}
                  >
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
                        {submission.platform} · {submission.status} · {new Date(submission.createdAt).toLocaleString('ko-KR')}
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
