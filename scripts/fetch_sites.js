import fs from 'fs';

async function main() {
  try {
    // 1. Fetch Site 1 with POST
    const body = new URLSearchParams({ pw: '8M0Du3TdqG4LzJgtn9vy' });
    const res1 = await fetch('https://nonhoi-3d.cloudflare-stattty-id.workers.dev/n145edff35a5e2696dba65a0827a912ce251bd24d/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
      redirect: 'manual'
    });
    console.log('Site 1 POST status:', res1.status);
    const cookie = res1.headers.get('set-cookie');
    console.log('Site 1 set-cookie:', cookie);
    let html1 = await res1.text();

    if (res1.status >= 300 && res1.status < 400) {
      const loc = res1.headers.get('location') || 'https://nonhoi-3d.cloudflare-stattty-id.workers.dev/n145edff35a5e2696dba65a0827a912ce251bd24d/';
      console.log('Redirecting to:', loc);
      const res1Follow = await fetch(new URL(loc, 'https://nonhoi-3d.cloudflare-stattty-id.workers.dev/n145edff35a5e2696dba65a0827a912ce251bd24d/'), {
        headers: { Cookie: cookie || '' }
      });
      console.log('Site 1 follow status:', res1Follow.status);
      html1 = await res1Follow.text();
    }
    console.log('Site 1 content length:', html1.length);
    fs.writeFileSync('site1.html', html1);
  } catch (e) {
    console.error('Site 1 error:', e);
  }

  try {
    // 2. Fetch Site 2
    const res2 = await fetch('https://toyohashi-pokefuta-tour.keenbasil73.chatgpt.site/nonhoi/');
    const html2 = await res2.text();
    fs.writeFileSync('site2_raw.html', html2);

    const match = html2.match(/srcdoc="([^"]+)"/);
    if (match) {
      let srcdoc = match[1]
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&#x27;/g, "'");
      fs.writeFileSync('site2.html', srcdoc);
      console.log('Site 2 decoded length:', srcdoc.length);
    } else {
      fs.writeFileSync('site2.html', html2);
      console.log('Site 2 length:', html2.length);
    }
  } catch (e) {
    console.error('Site 2 error:', e);
  }
}

main();
