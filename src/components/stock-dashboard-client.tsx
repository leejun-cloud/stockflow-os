'use client';

import { useEffect, useState, useTransition } from 'react';
import type { AgencyCredentialRecord, AssetRecord, ContributorProfile, SubmissionRecord, UserRecord } from '@/lib/domain';
import type { W8BenFields } from '@/lib/tax/w8ben';

type AssetWithSubmissions = AssetRecord & { submissions: SubmissionRecord[] };
type SafeCredential = Omit<AgencyCredentialRecord, 'encryptedPassword'>;

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

// Platforms with a configured FTP/SFTP endpoint (getty has none yet).
const ftpPlatforms = [
  { key: 'adobe', label: 'Adobe Stock' },
  { key: 'shutterstock', label: 'Shutterstock' },
  { key: 'alamy', label: 'Alamy' },
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
  const [profile, setProfile] = useState<ContributorProfile | null>(null);
  const [w8ben, setW8ben] = useState<W8BenFields | null>(null);
  const [credentials, setCredentials] = useState<SafeCredential[]>([]);
  const [isPending, startTransition] = useTransition();

  async function refresh() {
    if (!user) return;
    const nextAssets = await fetchAssets();
    setAssets(nextAssets);
  }

  async function loadOnboarding() {
    const [profileRes, credsRes] = await Promise.all([
      fetch('/api/profile', { cache: 'no-store' }),
      fetch('/api/credentials', { cache: 'no-store' }),
    ]);
    if (profileRes.ok) {
      const data = await profileRes.json();
      setProfile(data.profile);
      if (data.profile) {
        const w8Res = await fetch('/api/profile/w8ben', { cache: 'no-store' });
        setW8ben(w8Res.ok ? (await w8Res.json()).w8ben : null);
      }
    }
    if (credsRes.ok) setCredentials((await credsRes.json()).credentials);
  }

  useEffect(() => {
    if (user) void loadOnboarding();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function handleProfileSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const f = new FormData(form);
    const payload = {
      legalNameFull: String(f.get('legalNameFull') || ''),
      displayName: String(f.get('displayName') || ''),
      country: String(f.get('country') || 'KR'),
      phone: String(f.get('phone') || ''),
      address: {
        line1: String(f.get('line1') || ''),
        line2: String(f.get('line2') || ''),
        city: String(f.get('city') || ''),
        region: String(f.get('region') || ''),
        postalCode: String(f.get('postalCode') || ''),
        country: String(f.get('addressCountry') || ''),
      },
      tax: { foreignTin: String(f.get('foreignTin') || ''), usTin: String(f.get('usTin') || '') },
      payment: { method: String(f.get('method') || ''), payoutEmail: String(f.get('payoutEmail') || '') },
    };
    const response = await fetch('/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) {
      setMessage(data.error || '프로필 저장 실패');
      return;
    }
    await loadOnboarding();
    setMessage('프로필 저장 완료');
  }

  async function handleCredentialSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const f = new FormData(form);
    const payload = {
      platform: String(f.get('platform') || ''),
      protocol: String(f.get('protocol') || ''),
      host: String(f.get('host') || ''),
      port: Number(f.get('port') || 0),
      username: String(f.get('username') || ''),
      password: String(f.get('password') || ''),
    };
    const response = await fetch('/api/credentials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) {
      setMessage(data.error || '자격증명 저장 실패');
      return;
    }
    form.reset();
    await loadOnboarding();
    setMessage('FTP 자격증명 저장 완료');
  }

  function handleUploadFtp(assetId: string, form: HTMLFormElement) {
    const selected = Array.from(form.querySelectorAll<HTMLInputElement>('input[name="platform"]:checked')).map((el) => el.value);
    if (selected.length === 0) {
      setMessage('업로드할 플랫폼을 하나 이상 선택하세요.');
      return;
    }
    startTransition(async () => {
      setMessage('에이전시 업로드 중...');
      const response = await fetch(`/api/assets/${assetId}/upload-ftp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platforms: selected }),
      });
      const data = await response.json();
      if (!response.ok) {
        setMessage(data.error || '에이전시 업로드 실패');
        return;
      }
      await refresh();
      const summary = (data.results as { platform: string; status: string }[]).map((r) => `${r.platform}:${r.status}`).join(', ');
      setMessage(`업로드 결과 — ${summary}`);
    });
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

      <div className="section">
        <h3>온보딩 — 마스터 프로필</h3>
        <form className="upload-form" onSubmit={(event) => void handleProfileSave(event)}>
          <label>법적 이름 (전체)<input name="legalNameFull" type="text" required defaultValue={profile?.identity.legalNameFull ?? ''} /></label>
          <label>표시 이름<input name="displayName" type="text" required defaultValue={profile?.identity.displayName ?? ''} /></label>
          <label>국가 코드<input name="country" type="text" defaultValue={profile?.identity.country ?? 'KR'} /></label>
          <label>전화번호<input name="phone" type="text" defaultValue={profile?.identity.phone ?? ''} /></label>
          <label>주소 1<input name="line1" type="text" defaultValue={profile?.address.line1 ?? ''} /></label>
          <label>주소 2<input name="line2" type="text" defaultValue={profile?.address.line2 ?? ''} /></label>
          <label>도시<input name="city" type="text" defaultValue={profile?.address.city ?? ''} /></label>
          <label>지역/시도<input name="region" type="text" defaultValue={profile?.address.region ?? ''} /></label>
          <label>우편번호<input name="postalCode" type="text" defaultValue={profile?.address.postalCode ?? ''} /></label>
          <label>주소 국가<input name="addressCountry" type="text" defaultValue={profile?.address.country ?? 'KR'} /></label>
          <label>Foreign TIN (해외 납세자번호)<input name="foreignTin" type="text" defaultValue={profile?.tax.foreignTin ?? ''} /></label>
          <label>US TIN<input name="usTin" type="text" defaultValue={profile?.tax.usTin ?? ''} /></label>
          <label>지급 방식<input name="method" type="text" placeholder="paypal / bank" defaultValue={profile?.payment.method ?? ''} /></label>
          <label>지급 이메일<input name="payoutEmail" type="text" defaultValue={profile?.payment.payoutEmail ?? ''} /></label>
          <button type="submit" className="button primary">프로필 저장</button>
        </form>
        {w8ben ? (
          <div className="submission-log">
            <strong>W-8BEN 자동 채움 (미리보기)</strong>
            <ul className="meta-list">
              <li>이름: {w8ben.name}</li>
              <li>시민권 국가: {w8ben.countryOfCitizenship}</li>
              <li>영구 주소: {w8ben.permanentAddress || '없음'}</li>
              <li>Foreign TIN: {w8ben.foreignTin || '없음'}</li>
              <li>조약 국가: {w8ben.treatyCountry || '없음'}</li>
              <li>조약 조항: {w8ben.treatyArticle || '없음'}</li>
              <li>원천징수율: {w8ben.withholdingRate}%</li>
              <li>소득 유형: {w8ben.incomeType || '없음'}</li>
            </ul>
            {w8ben.warnings.length > 0 ? (
              <ul className="meta-list">
                {w8ben.warnings.map((warning) => (
                  <li key={warning}>⚠️ {warning}</li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="section">
        <h3>FTP 자격증명</h3>
        <form className="upload-form" onSubmit={(event) => void handleCredentialSave(event)}>
          <label>
            플랫폼
            <select name="platform" defaultValue="adobe">
              {platforms.map((platform) => (
                <option key={platform.key} value={platform.key}>{platform.label}</option>
              ))}
            </select>
          </label>
          <label>
            프로토콜
            <select name="protocol" defaultValue="sftp">
              <option value="ftp">FTP</option>
              <option value="ftps">FTPS</option>
              <option value="sftp">SFTP</option>
            </select>
          </label>
          <label>호스트<input name="host" type="text" required /></label>
          <label>포트<input name="port" type="number" defaultValue={22} required /></label>
          <label>사용자명<input name="username" type="text" required /></label>
          <label>비밀번호<input name="password" type="password" required /></label>
          <button type="submit" className="button primary">자격증명 저장</button>
        </form>
        {credentials.length > 0 ? (
          <ul className="meta-list">
            {credentials.map((credential) => (
              <li key={credential.id}>{credential.platform} · {credential.protocol} · {credential.host}:{credential.port} · {credential.username}</li>
            ))}
          </ul>
        ) : null}
      </div>

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
              <form
                className="adapter-actions"
                onSubmit={(event) => {
                  event.preventDefault();
                  handleUploadFtp(asset.id, event.currentTarget);
                }}
              >
                {ftpPlatforms.map((platform) => (
                  <label key={platform.key}>
                    <input type="checkbox" name="platform" value={platform.key} /> {platform.label}
                  </label>
                ))}
                <button type="submit" className="button primary" disabled={isPending}>에이전시로 업로드</button>
              </form>
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
