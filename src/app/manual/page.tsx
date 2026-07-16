import { readFile } from 'node:fs/promises';
import path from 'node:path';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

async function getManual() {
  const filePath = path.join(process.cwd(), 'docs', 'product-plan.md');
  return readFile(filePath, 'utf8');
}

export default async function ManualPage() {
  const markdown = await getManual();

  return (
    <article className="card markdown-page">
      <div className="manual-header">
        <span className="eyebrow">Internal manual</span>
        <h1>StockFlow OS 기획서 / 운영 매뉴얼</h1>
        <p>
          서버에 저장된 Markdown 원본을 직접 렌더링합니다. 제품 방향, 운영 플로우, 데이터 모델,
          어댑터 구조를 한 곳에서 확인할 수 있습니다.
        </p>
      </div>
      <div className="markdown-body">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
      </div>
    </article>
  );
}
