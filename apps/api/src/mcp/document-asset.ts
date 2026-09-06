import {
  attachmentObjectKey,
  deleteAttachmentObject,
  storeAttachmentObject,
} from '#modules/attachments/storage';
import { createDocumentAsset, type DocumentAssetRow } from '#modules/documents/service';
import { HttpError } from '#shared/lib';

function documentAssetDto(projectKey: string, documentId: number, asset: DocumentAssetRow) {
  return {
    id: asset.publicId,
    filename: asset.filename,
    contentType: asset.contentType,
    sizeBytes: asset.sizeBytes,
    uploadedByUserId: asset.uploadedByUserId,
    createdAt: asset.createdAt,
    url: `/projects/${encodeURIComponent(projectKey)}/documents/${documentId}/assets/${asset.publicId}/raw`,
  };
}

export async function saveDocumentAsset(input: {
  projectId: number;
  projectKey: string;
  documentId: number;
  userId: string;
  filename: string;
  contentType: string;
  bytes: Buffer;
}) {
  const key = attachmentObjectKey(input.projectId, 'documents', input.documentId, input.filename);
  await storeAttachmentObject(key, input.bytes, input.contentType);
  try {
    const asset = await createDocumentAsset({
      projectId: input.projectId,
      documentId: input.documentId,
      userId: input.userId,
      s3Key: key,
      filename: input.filename,
      contentType: input.contentType,
      sizeBytes: input.bytes.length,
    });
    if (!asset) throw new HttpError(404, 'Document not found');
    return documentAssetDto(input.projectKey, input.documentId, asset);
  } catch (error) {
    await deleteAttachmentObject(key);
    throw error;
  }
}
