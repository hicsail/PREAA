import { LangflowService } from '@/app/lib/langflow/langflow.service';
import { randomBytes } from 'crypto';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
  const body = await request.json();
  const { projectName, clientEmail, isFirstTime } = body as {
    projectName: string;
    clientEmail: string;
    isFirstTime: boolean;
  };

  if (!projectName || !clientEmail) {
    return new Response('Missing projectName or clientEmail', { status: 400 });
  }

  const langflow = new LangflowService();

  try {
    const superuser = process.env.LANGFLOW_SUPERUSER || 'langflow';
    const superuserPassword = process.env.LANGFLOW_SUPERUSER_PASSWORD || 'langflow';
    const token = await langflow.authenticate(superuser, superuserPassword);

    let langflowUserId: string | undefined;
    let langflowPassword: string | undefined;

    if (isFirstTime) {
      // Generate a secure password for the new Langflow user
      langflowPassword = randomBytes(16).toString('hex');
      langflowUserId = await langflow.createUser(token, clientEmail, langflowPassword);
    }

    const folderId = await langflow.createProject(
      token,
      projectName,
      `Chatbot project for ${clientEmail}`
    );

    // Load RAG template — bundled into the admin package at build/run time
    const templatePaths = [
      path.join(process.cwd(), 'src/assets/embedded-chat-default.json'),
      path.join(process.cwd(), '../../scripts/embedded-chat-default.json')
    ];

    let templateJson: object | undefined;
    for (const p of templatePaths) {
      if (fs.existsSync(p)) {
        templateJson = JSON.parse(fs.readFileSync(p, 'utf-8'));
        break;
      }
    }
    if (!templateJson) {
      return new Response('RAG template not found', { status: 500 });
    }

    const flowId = await langflow.uploadTemplate(token, folderId, templateJson);

    return Response.json({
      langflowUserId,
      langflowPassword,
      folderId,
      flowId
    });
  } catch (err) {
    console.error('[onboarding/provision]', err);
    return new Response((err as Error).message || 'Provision failed', { status: 500 });
  }
}
