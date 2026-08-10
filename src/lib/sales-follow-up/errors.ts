/** Stable API error codes for Sales Follow-Up (UI maps via i18n). */

export const SF_ERROR = {
  UNAUTHORIZED: "UNAUTHORIZED",
  PIC_NOT_LINKED: "PIC_NOT_LINKED",
  LEAD_NOT_FOUND: "LEAD_NOT_FOUND",
  LEAD_FORBIDDEN: "LEAD_FORBIDDEN",
  PHONE_REQUIRED: "PHONE_REQUIRED",
  PHONE_DUPLICATE: "PHONE_DUPLICATE",
  ADMIN_DELETE_ONLY: "ADMIN_DELETE_ONLY",
  ADMIN_DELETE_FU_ONLY: "ADMIN_DELETE_FU_ONLY",
  UPLOAD_FILE_REQUIRED: "UPLOAD_FILE_REQUIRED",
  UPLOAD_FORMAT: "UPLOAD_FORMAT",
  UPLOAD_PIC_REQUIRED: "UPLOAD_PIC_REQUIRED",
  UPLOAD_PIC_NOT_FOUND: "UPLOAD_PIC_NOT_FOUND",
  UPLOAD_PIC_UNRESOLVED: "UPLOAD_PIC_UNRESOLVED",
  UPLOAD_NO_PHONES: "UPLOAD_NO_PHONES",
  UPLOAD_FAILED: "UPLOAD_FAILED",
  GENERIC: "GENERIC",
} as const;

export type SfErrorCode = (typeof SF_ERROR)[keyof typeof SF_ERROR];

export function sfError(
  code: SfErrorCode,
  status: number,
  fallbackMessage?: string
) {
  return {
    body: {
      code,
      error: fallbackMessage || code,
    },
    status,
  };
}
