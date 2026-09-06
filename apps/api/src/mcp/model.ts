import { t } from 'elysia';

export const CurrentUserResponse = t.Object({
  authenticated: t.Literal(true),
  user: t.Object({
    id: t.String(),
    name: t.String(),
    email: t.String(),
    username: t.Nullable(t.String()),
  }),
});

export const uploadDocumentAssetBody = t.Object({
  filename: t.String({ minLength: 1 }),
  contentBase64: t.String({ minLength: 1 }),
  contentType: t.String({ minLength: 1 }),
});
