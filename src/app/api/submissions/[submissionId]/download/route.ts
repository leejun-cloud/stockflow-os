import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { getSubmissionById } from '@/lib/repository';

export const runtime = 'nodejs';

export async function GET(_request: Request, context: { params: Promise<{ submissionId: string }> }) {
  const { submissionId } = await context.params;
  const submission = getSubmissionById(submissionId);

  if (!submission) {
    return new Response('Not found', { status: 404 });
  }

  const file = await readFile(submission.exportPath);
  return new Response(file, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${path.basename(submission.exportPath)}"`,
    },
  });
}
