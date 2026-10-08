import {
  attachmentObjectKey,
  deleteAttachmentObject,
  storeAttachmentObject,
} from '#modules/attachments/storage';
import {
  createDocumentAsset,
  documentAssetPath,
  type DocumentAssetRow,
} from '#modules/documents/service';
import { HttpError } from '#shared/lib';

function documentAssetDto(
  project: { teamId: number; key: string },
  documentId: number,
  asset: DocumentAssetRow,
) {
  return {
    id: asset.publicId,
    filename: asset.filename,
    contentType: asset.contentType,
    sizeBytes: asset.sizeBytes,
    uploadedByUserId: asset.uploadedByUserId,
    createdAt: asset.createdAt,
    url: documentAssetPath(project, documentId, asset.publicId),
  };
}

export async function saveDocumentAsset(input: {
  project: { id: number; teamId: number; key: string };
  documentId: number;
  userId: string;
  filename: string;
  contentType: string;
  bytes: Buffer;
}) {
  const key = attachmentObjectKey(input.project.id, 'documents', input.documentId, input.filename);
  await storeAttachmentObject(key, input.bytes, input.contentType);
  try {
    const asset = await createDocumentAsset({
      projectId: input.project.id,
      documentId: input.documentId,
      userId: input.userId,
      s3Key: key,
      filename: input.filename,
      contentType: input.contentType,
      sizeBytes: input.bytes.length,
    });
    if (!asset) throw new HttpError(404, 'Document not found');
    return documentAssetDto(input.project, input.documentId, asset);
  } catch (error) {
    await deleteAttachmentObject(key);
    throw error;
  }
}
