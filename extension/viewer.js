/** Renders the dashboard the worker stored, and lets it be saved or printed. */
(async () => {
  const { 'viewer:html': html } = await chrome.storage.local.get('viewer:html');
  const frame = document.getElementById('frame');

  if (!html) {
    frame.hidden = true;
    document.getElementById('empty').hidden = false;
    return;
  }
  frame.srcdoc = html;

  const blobUrl = () => URL.createObjectURL(new Blob([html], { type: 'text/html' }));

  document.getElementById('save').addEventListener('click', () => {
    const url = blobUrl();
    const a = Object.assign(document.createElement('a'), {
      href: url, download: `canvas-briefs-${new Date().toISOString().slice(0, 10)}.html`,
    });
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30_000);
  });

  // The frame is sandboxed with no privileges at all, so the parent cannot
  // reach into it to print. A plain tab on the same blob can print itself.
  document.getElementById('tab').addEventListener('click', () => {
    window.open(blobUrl(), '_blank', 'noopener');
  });
})();
