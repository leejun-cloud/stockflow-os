import path from 'node:path';
import { getCurrentUser } from '@/lib/auth';
import { getSubmissionByIdForUser } from '@/lib/repository';
import { readStoredObject } from '@/lib/storage';

export const runtime = 'nodejs';

export async function GET(_request: Request, context: { params: Promise<{ submissionId: string }> }) {
  const user = await getCurrentUser();
  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { submissionId } = await context.params;
  const submission = await getSubmissionByIdForUser(user.id, submissionId);

  if (!submission) {
    return new Response('Not found', { status: 404 });
  }

  const file = await readStoredObject(submission.exportBackend, submission.exportPath);
  return new Response(file, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${path.basename(submission.exportPath)}"`,
    },
  });
}
