import { z } from "zod";

const titleSchema = z.string().trim().min(1).max(255);
const contentSchema = z.string().max(50_000_000);
const roleSchema = z.enum(["editor", "viewer"]);

export const createDocumentSchema = z.object({
    title: titleSchema.optional(),
    content: contentSchema.optional()
});

export const updateDocumentSchema = z.object({
    title: titleSchema.optional(),
    content: contentSchema.optional()
}).refine((data) => data.title !== undefined || data.content !== undefined, {
    message: "At least one field is required"
});

export const addCollaboratorSchema = z.object({
    email: z.email({ message: "Invalid email address" }).trim().toLowerCase(),
    role: roleSchema.default("viewer")
});

export const updateCollaboratorSchema = z.object({
    collaboratorId: z.string().trim().min(1).optional(),
    role: roleSchema
});

export const removeCollaboratorSchema = z.object({
    collaboratorId: z.string().trim().min(1).optional()
});

export type CreateDocumentInput = z.infer<typeof createDocumentSchema>;
export type UpdateDocumentInput = z.infer<typeof updateDocumentSchema>;
export type AddCollaboratorInput = z.infer<typeof addCollaboratorSchema>;
export type UpdateCollaboratorInput = z.infer<typeof updateCollaboratorSchema>;
