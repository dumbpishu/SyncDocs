import type { User } from "./auth";

export type CollaboratorRole = "editor" | "viewer";

export type Collaborator = {
  user: User;
  role: CollaboratorRole;
  _id?: string;
};

export type DocumentRecord = {
  _id: string;
  title: string;
  content: string;
  owner: User;
  collaborators: Collaborator[];
  version: number;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
};

export type SharedDocuments = {
  editor: DocumentRecord[];
  viewer: DocumentRecord[];
};

export type AllDocumentsPayload = {
  ownedDocuments: DocumentRecord[];
  sharedDocuments: SharedDocuments;
};

export type OnlineParticipant = {
  socketId: string;
  userId: string;
  username: string;
  email: string;
  color: string;
};

export type RemoteCursor = {
  userId: string;
  username: string;
  color: string;
  x: number;
  y: number;
  height: number;
};
