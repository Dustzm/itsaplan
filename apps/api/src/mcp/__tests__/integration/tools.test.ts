import { beforeEach, describe, expect, it } from 'bun:test';
import { auth } from '@repo/auth';
import { db, oauthAccessToken, oauthApplication } from '@repo/db';
import { dispatchTool } from '#mcp/dispatch';
import { routeTools, type McpRouteTool } from '#mcp/generate';
import { app, authedApi } from '#tests/helpers/app';
import { signUpTestUser } from '#tests/helpers/auth';
import { teamOf } from '#tests/helpers/agents';
import { resetDb } from '#tests/helpers/db';

function tool(name: string): McpRouteTool {
  const match = routeTools(app).find((candidate) => candidate.name === name);
  if (!match) throw new Error(`${name} tool not found`);
  return match;
}

async function createApiKey(userId: string): Promise<string> {
  return (
    await auth.api.createApiKey({
      body: { userId, name: 'MCP tools test' },
    })
  ).key;
}

async function createOAuthToken(userId: string): Promise<string> {
  const clientId = crypto.randomUUID();
  const accessToken = crypto.randomUUID();
  const now = new Date();
  await db.insert(oauthApplication).values({
    id: crypto.randomUUID(),
    name: 'Test OAuth client',
    clientId,
    clientSecret: '',
    redirectUrls: 'http://127.0.0.1/callback',
    type: 'public',
    disabled: false,
    createdAt: now,
    updatedAt: now,
  });
  await db.insert(oauthAccessToken).values({
    id: crypto.randomUUID(),
    accessToken,
    refreshToken: crypto.randomUUID(),
    accessTokenExpiresAt: new Date(now.getTime() + 60_000),
    refreshTokenExpiresAt: new Date(now.getTime() + 120_000),
    clientId,
    userId,
    scopes: 'openid profile email',
    createdAt: now,
    updatedAt: now,
  });
  return accessToken;
}

describe('MCP extension tools', () => {
  beforeEach(resetDb);

  it('registers the four tools and resolves the OAuth user', async () => {
    const user = await signUpTestUser({ name: 'Alice' });
    const result = await dispatchTool(
      app,
      tool('get_current_user'),
      {},
      { kind: 'oauth', accessToken: await createOAuthToken(user.userId) },
      { viaMcpEndpoint: true },
    );

    expect(tool('list_notifications').annotations.readOnlyHint).toBe(true);
    expect(tool('get_unread_notification_count').annotations.readOnlyHint).toBe(true);
    expect(tool('upload_document_asset').inputSchema.required).toEqual(
      expect.arrayContaining([
        'projectKey',
        'documentId',
        'filename',
        'contentBase64',
        'contentType',
      ]),
    );
    expect(result.isError).toBe(false);
    expect(JSON.parse(result.text)).toEqual({
      authenticated: true,
      user: { id: user.userId, name: 'Alice', email: user.email, username: user.username },
    });
  });

  it.each([
    [true, true, 1],
    [true, false, 0],
    [false, true, 0],
  ] as const)(
    'filters notifications with team enabled=%s and project enabled=%s',
    async (enabled, projectEnabled, expectedCount) => {
      const owner = await signUpTestUser();
      const asOwner = authedApi(owner.cookie);
      await asOwner.projects.post({ key: 'MKT', name: 'Marketing' });
      const board = await asOwner.projects({ projectKey: 'MKT' }).get();
      const member = await signUpTestUser();
      const invite = await asOwner
        .projects({ projectKey: 'MKT' })
        .invites.post({ email: member.email, role: 'member' });
      const asMember = authedApi(member.cookie);
      await asMember.invites({ token: invite.data!.token }).accept.post();
      await asOwner.projects({ projectKey: 'MKT' }).issues.post({
        columnId: board.data!.columns[0].id,
        title: 'Assigned task',
        assigneeUserId: member.userId,
      });
      const teamId = await teamOf(asOwner, 'MKT');
      const settings = await asOwner.teams({ teamId }).mcp.patch({
        enabled,
        projects: [{ projectId: board.data!.project.id, enabled: projectEnabled }],
      });
      expect(settings.status).toBe(200);
      const apiKey = await createApiKey(member.userId);

      expect((await asMember.notifications.get({ query: {} })).data!.items).toHaveLength(1);
      const listed = await dispatchTool(
        app,
        tool('list_notifications'),
        {},
        { kind: 'api-key', apiKey },
        { viaMcpEndpoint: true },
      );
      const unread = await dispatchTool(
        app,
        tool('get_unread_notification_count'),
        {},
        { kind: 'api-key', apiKey },
        { viaMcpEndpoint: true },
      );
      const internal = await dispatchTool(
        app,
        tool('list_notifications'),
        {},
        { kind: 'api-key', apiKey },
        { viaMcpEndpoint: false },
      );
      expect(listed.isError).toBe(false);
      expect(unread.isError).toBe(false);
      expect(JSON.parse(listed.text).items).toHaveLength(expectedCount);
      expect(JSON.parse(unread.text)).toEqual({ unread: expectedCount });
      expect(JSON.parse(internal.text).items).toHaveLength(1);
    },
  );

  it('uploads an asset to the named team, returns a stable URL and rejects invalid base64', async () => {
    const owner = await signUpTestUser();
    const asOwner = authedApi(owner.cookie);
    await asOwner.projects.post({ key: 'MKT', name: 'Marketing' });
    const team = (await asOwner.teams.post({ name: 'Second', slug: 'second' })).data!;
    const project = await asOwner.teams({ teamId: team.id }).projects.post({
      key: 'MKT',
      name: 'Second marketing',
    });
    expect(project.status).toBe(201);
    const projectKey = 'second.MKT';
    const page = (await asOwner.projects({ projectKey }).documents.post({ title: 'Guide' })).data!;
    const apiKey = await createApiKey(owner.userId);
    const credential = { kind: 'api-key' as const, apiKey };
    const upload = tool('upload_document_asset');
    const uploaded = await dispatchTool(
      app,
      upload,
      {
        projectKey,
        documentId: page.id,
        filename: '../diagram.png',
        contentBase64: Buffer.from('asset bytes').toString('base64'),
        contentType: 'image/png',
      },
      credential,
      { viaMcpEndpoint: true },
    );
    const asset = JSON.parse(uploaded.text);

    expect(uploaded.isError).toBe(false);
    expect(asset).toMatchObject({
      filename: 'diagram.png',
      contentType: 'image/png',
      sizeBytes: 11,
    });
    expect(asset.url).toBe(`/projects/${team.id}.MKT/documents/${page.id}/assets/${asset.id}/raw`);
    expect((await asOwner.teams({ teamId: team.id }).patch({ slug: 'renamed' })).status).toBe(200);
    const raw = await app.handle(
      new Request(`http://localhost${asset.url}`, { headers: { 'x-api-key': apiKey } }),
    );
    expect(raw.status).toBe(200);
    expect(await raw.text()).toBe('asset bytes');

    const invalid = await dispatchTool(
      app,
      upload,
      {
        projectKey: `${team.id}.MKT`,
        documentId: page.id,
        filename: 'invalid.png',
        contentBase64: 'not base64',
        contentType: 'image/png',
      },
      credential,
      { viaMcpEndpoint: true },
    );
    expect(invalid.isError).toBe(true);
    expect(JSON.parse(invalid.text)).toEqual({
      error: 'contentBase64 must contain valid base64-encoded file content',
    });
  });
});
