import { api } from "../services/axios";
import type { ApiSuccessResponse } from "../types/api";
import type {
  AllDocumentsPayload,
  CollaboratorRole,
  DocumentRecord,
} from "../types/document";
import { unwrapApiResponse } from "../utils/api";

export const getAllDocuments = async () => {
  const response = await api.get<ApiSuccessResponse<AllDocumentsPayload>>("/documents");
  return unwrapApiResponse(response.data);
};

export const getDocumentById = async (documentId: string) => {
  const response = await api.get<ApiSuccessResponse<{ document: DocumentRecord }>>(`/documents/${documentId}`);
  return unwrapApiResponse(response.data)?.document ?? null;
};

export const createDocument = async (payload: { title?: string; content?: string }) => {
  const response = await api.post<ApiSuccessResponse<{ document: DocumentRecord }>>("/documents", payload);
  return unwrapApiResponse(response.data)?.document ?? null;
};

export const updateDocument = async (
  documentId: string,
  payload: { title?: string; content?: string },
) => {
  const response = await api.put<ApiSuccessResponse<{ document: DocumentRecord }>>(`/documents/${documentId}`, payload);
  return unwrapApiResponse(response.data)?.document ?? null;
};

export const deleteDocument = async (documentId: string) => {
  await api.delete<ApiSuccessResponse<null>>(`/documents/${documentId}`);
};

export const addCollaborator = async (
  documentId: string,
  payload: { email: string; role: CollaboratorRole },
) => {
  const response = await api.post<ApiSuccessResponse<{ document: DocumentRecord }>>(
    `/documents/${documentId}/collaborators`,
    payload,
  );

  return unwrapApiResponse(response.data)?.document ?? null;
};

export const updateCollaboratorRole = async (
  documentId: string,
  collaboratorId: string,
  role: CollaboratorRole,
) => {
  const response = await api.patch<ApiSuccessResponse<{ document: DocumentRecord }>>(
    `/documents/${documentId}/collaborators/${collaboratorId}`,
    { role },
  );

  return unwrapApiResponse(response.data)?.document ?? null;
};

export const removeCollaborator = async (documentId: string, collaboratorId: string) => {
  const response = await api.delete<ApiSuccessResponse<{ document: DocumentRecord }>>(
    `/documents/${documentId}/collaborators/${collaboratorId}`,
  );

  return unwrapApiResponse(response.data)?.document ?? null;
};
