import { Elysia } from 'elysia';
import {
  assertAttachmentUploadAllowed,
  decodeAttachmentBase64,
  safeAttachmentFilename,
} from '#modules/attachments/storage';
import { DocumentAssetResponse, documentParams } from '#modules/documents/model';
import { assertDocumentAssetUploadTarget } from '#modules/documents/service';
import {
  NotificationPageResponse,
  UnreadCountResponse,
  listNotificationsQuery,
  unreadCountQuery,
} from '#modules/notifications/model';
import {
  listNotifications,
  unreadCount,
  NOTIFICATION_TYPES,
  type NotificationFilters,
  type NotificationType,
} from '#modules/notifications/service';
import { requireUser } from '#shared/access';
import { authContext } from '#shared/auth-context';
import { guards } from '#shared/guards';
import { HttpError } from '#shared/lib';
import { isMcpRequest } from '#shared/mcp-request';
import { commonErrors, errors } from '#shared/responses';
import { mcpTool } from './generate';
import { CurrentUserResponse, uploadDocumentAssetBody } from './model';
import { saveDocumentAsset } from './document-asset';

export const mcpToolRoutes = new Elysia({ name: 'mcp-tools', detail: { tags: ['System'] } })
  .use(authContext)
  .use(guards)
  .get(
    '/mcp-tools/current-user',
    ({ user }) => {
      requireUser(user);
      return {
        authenticated: true as const,
        user: {
          id: user!.id,
          name: user!.name,
          email: user!.email,
          username: user!.username ?? null,
        },
      };
    },
    {
      response: { 200: CurrentUserResponse, ...errors(401) },
      detail: {
        summary: 'Get the current MCP user',
        description: 'Return the user authenticated for this MCP connection.',
        ...mcpTool('get_current_user'),
      },
    },
  )
  .get(
    '/mcp-tools/notifications',
    ({ user, query, request }) => {
      const limit = query.limit != null ? Number(query.limit) : 30;
      let before = null;
      if (query.cursor) {
        try {
          before = JSON.parse(query.cursor);
        } catch {
          // Match the inbox endpoint: a malformed cursor starts from the first page.
        }
      }
      const filters: NotificationFilters = { mcpOnly: isMcpRequest(request.headers) };
      if (query.types) {
        const types = query.types
          .split(',')
          .filter((value): value is NotificationType =>
            (NOTIFICATION_TYPES as readonly string[]).includes(value),
          );
        if (types.length) filters.types = types;
      }
      if (query.from) filters.fromUserId = query.from;
      if (query.projectId) filters.projectId = Number(query.projectId);
      filters.includeRead = query.includeRead !== 'false';
      filters.includeSnoozed = query.includeSnoozed === 'true';
      return listNotifications(requireUser(user).id, { before, limit, filters });
    },
    {
      query: listNotificationsQuery,
      response: { 200: NotificationPageResponse, ...errors(401) },
      detail: {
        summary: 'List MCP-visible inbox notifications',
        description: "List the current user's notifications from projects where MCP is enabled.",
        ...mcpTool('list_notifications'),
      },
    },
  )
  .get(
    '/mcp-tools/notifications/unread',
    async ({ user, query, request }) => ({
      unread: await unreadCount(
        requireUser(user).id,
        query.projectId ? Number(query.projectId) : undefined,
        isMcpRequest(request.headers),
      ),
    }),
    {
      query: unreadCountQuery,
      response: { 200: UnreadCountResponse, ...errors(401) },
      detail: {
        summary: 'Get the MCP-visible unread notification count',
        description:
          "Count the current user's unread notifications from projects where MCP is enabled.",
        ...mcpTool('get_unread_notification_count'),
      },
    },
  )
  .post(
    '/mcp-tools/projects/:projectKey/documents/:documentId/assets',
    async ({ project, params, user, body, set }) => {
      const userId = requireUser(user).id;
      if (!(await assertDocumentAssetUploadTarget(project.id, params.documentId, userId))) {
        throw new HttpError(404, 'Document not found');
      }
      const bytes = decodeAttachmentBase64(body.contentBase64);
      const filename = safeAttachmentFilename(body.filename);
      await assertAttachmentUploadAllowed(project.id, bytes.length, body.contentType);
      const asset = await saveDocumentAsset({
        projectId: project.id,
        projectKey: project.key,
        documentId: params.documentId,
        userId,
        filename,
        contentType: body.contentType,
        bytes,
      });
      set.status = 201;
      return asset;
    },
    {
      permission: ['documents', 'edit'],
      params: documentParams,
      body: uploadDocumentAssetBody,
      response: { 201: DocumentAssetResponse, ...commonErrors, ...errors(409, 413, 502) },
      detail: {
        summary: 'Upload a document asset from base64',
        description:
          'Upload an image or other allowed file to an active, unlocked Docs page. Send the bytes as base64 in `contentBase64`; when embedding the result, prefix the returned `url` with `/protected-media`.',
        ...mcpTool('upload_document_asset'),
      },
    },
  );
