// ارتباط با API گیت‌هاب. اگر روزی سایت به بک‌اند دیگری رفت، فقط همین فایل عوض می‌شود.

function bytesToBase64(bytes) {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}
const textToBase64 = text => bytesToBase64(new TextEncoder().encode(text));
const base64ToText = base64 => new TextDecoder().decode(Uint8Array.from(atob(base64.replace(/\s/g, '')), c => c.charCodeAt(0)));

const github = {
  owner: 'k473nm',
  repo: 'beheshti-sari',
  branch: 'main',
  token: '',

  // درخواست عمومی به API؛ خطاها با فیلد status یا network پرتاب می‌شوند
  async request(path = '', options = {}) {
    let response;
    try {
      response = await fetch(`https://api.github.com/repos/${this.owner}/${this.repo}${path}`, {
        cache: 'no-store',   // بدون این، sha قدیمی از کش می‌آید و ثبت دوم خطای ۴۰۹ می‌دهد
        ...options,
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization: `Bearer ${this.token}`,
          'X-GitHub-Api-Version': '2022-11-28',
          ...(options.body ? { 'Content-Type': 'application/json' } : {})
        }
      });
    } catch {
      throw Object.assign(new Error('network'), { network: true });
    }
    if (!response.ok) {
      const info = await response.json().catch(() => ({}));
      throw Object.assign(new Error(info.message || `خطا ${response.status}`), { status: response.status });
    }
    return response.json();
  },

  // اطلاعات مخزن (برای بررسی توکن)
  checkAccess() {
    return this.request();
  },

  // خواندن یک فایل JSON؛ sha برای نوشتن دوباره لازم است
  async readJson(path) {
    const file = await this.request(`/contents/${path}?ref=${this.branch}`);
    return { data: JSON.parse(base64ToText(file.content)), sha: file.sha };
  },

  writeJson(path, data, sha, message) {
    return this.putFile(path, textToBase64(JSON.stringify(data, null, 2) + '\n'), message, sha);
  },

  async uploadBlob(path, blob, message) {
    return this.putFile(path, bytesToBase64(new Uint8Array(await blob.arrayBuffer())), message);
  },

  putFile(path, base64, message, sha) {
    return this.request(`/contents/${path}`, {
      method: 'PUT',
      body: JSON.stringify({ message, content: base64, branch: this.branch, ...(sha ? { sha } : {}) })
    });
  }
};
