import { AuditLog } from '../models/AuditLog';

interface AuditLogParams {
  model: string;
  documentId: any;
  action: string;
  changedBy: string;
  role: string;
  context: string;
  changes: any;
}

export const logAudit = async ({
  model,
  documentId,
  action,
  changedBy,
  role,
  context,
  changes
}: AuditLogParams) => {
  if (process.env.ENABLE_AUDIT_LOG === 'true') {
    await AuditLog.create({
      model,
      documentId,
      action,
      changedBy,
      role,
      timestamp: new Date(),
      context,
      changes
    });
  }
};
