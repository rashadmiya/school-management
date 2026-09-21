// src/lib/downloadFile.js
import { server } from '@/utils/server';

/**
 * Download a file from an authenticated endpoint.
 *
 * @param {string} path       — relative path, e.g. `/pdf/receipt/123`
 * @param {string} filename   — suggested download name
 * @param {string} token      — bearer token
 * @param {object} [opts]     — { openInNewTab?: boolean }
 */
export async function downloadAuthenticatedFile(path, filename, token, opts = {}) {
    const url = path.startsWith('http') ? path : `${server}${path}`;

    const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(text || `Download failed (${res.status})`);
    }

    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);

    if (opts.openInNewTab) {
        window.open(blobUrl, '_blank');
        // Revoke later
        setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
        return;
    }

    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename || 'download';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(blobUrl);
}