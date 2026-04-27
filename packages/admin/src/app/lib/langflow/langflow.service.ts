export class LangflowService {
  private readonly baseUrl: string;

  constructor() {
    this.baseUrl = (process.env.LANGFLOW_BASE_URL || 'http://localhost:7860').replace(/\/$/, '');
  }

  async authenticate(username: string, password: string): Promise<string> {
    const res = await fetch(`${this.baseUrl}/api/v1/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ username, password })
    });
    if (!res.ok) throw new Error(`Langflow auth failed (${res.status})`);
    const data = await res.json();
    return data.access_token;
  }

  async createUser(token: string, username: string, password: string): Promise<string> {
    const res = await fetch(`${this.baseUrl}/api/v1/users/`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    if (!res.ok) throw new Error(`Langflow createUser failed (${res.status}): ${await res.text()}`);
    const data = await res.json();
    return data.id;
  }

  async createProject(token: string, name: string, description: string): Promise<string> {
    const res = await fetch(`${this.baseUrl}/api/v1/projects/`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description })
    });
    if (!res.ok) throw new Error(`Langflow createProject failed (${res.status}): ${await res.text()}`);
    const data = await res.json();
    return data.id;
  }

  async uploadTemplate(token: string, folderId: string, templateJson: object): Promise<string> {
    const formData = new FormData();
    const blob = new Blob([JSON.stringify(templateJson)], { type: 'application/json' });
    formData.append('file', blob, 'template.json');

    const res = await fetch(`${this.baseUrl}/api/v1/flows/upload/?folder_id=${folderId}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData
    });
    if (!res.ok) throw new Error(`Langflow uploadTemplate failed (${res.status}): ${await res.text()}`);
    const data = await res.json();
    return Array.isArray(data) ? data[0].id : data.id;
  }

  async createApiKey(token: string, name: string): Promise<string> {
    const res = await fetch(`${this.baseUrl}/api/v1/api_key/`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    });
    if (!res.ok) throw new Error(`Langflow createApiKey failed (${res.status}): ${await res.text()}`);
    const data = await res.json();
    const key = data.api_key || data.key || '';
    if (!key) throw new Error('Langflow API key missing from response');
    return key;
  }
}
