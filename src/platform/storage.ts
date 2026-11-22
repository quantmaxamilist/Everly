import { randomUUID } from 'node:crypto';

/**
 * Saves an uploaded file and returns its public URL.
 * Live: Vercel Blob (BLOB_READ_WRITE_TOKEN is set automatically when a Blob store is connected in Vercel → Storage).
 * Local development without Blob: stored inline as a data URL so everything still works.
 */
export const MAX_UPLOAD = 4 * 1024 * 1024; // Vercel limits request bodies to ~4.5 MB
export const storageConfigured = () => !!process.env.BLOB_READ_WRITE_TOKEN;

export async function storeFile(file: File, folder: string): Promise<string> {
  if (!file || !file.size) throw new Error('No file chosen');
  if (file.size > MAX_UPLOAD) throw new Error('That file is over 4 MB — please choose a smaller one');
  const safe = (file.name || 'file').toLowerCase().replace(/[^a-z0-9.]+/g, '-').slice(-60);
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const { put } = await import('@vercel/blob');
    const r = await put(`${folder}/${randomUUID()}-${safe}`, file, { access: 'public', contentType: file.type || undefined });
    return r.url;
  }
  if (process.env.NODE_ENV !== 'production' || process.env.ALLOW_INLINE_UPLOADS === '1') {
    const b64 = Buffer.from(await file.arrayBuffer()).toString('base64');
    return `data:${file.type || 'application/octet-stream'};base64,${b64}`;
  }
  throw new Error('File storage isn’t connected yet — connect a Blob store in Vercel');
}

export async function deleteFile(url: string | null | undefined) {
  if (!url || url.startsWith('data:') || !process.env.BLOB_READ_WRITE_TOKEN) return;
  try { const { del } = await import('@vercel/blob'); await del(url); } catch { /* already gone */ }
}
