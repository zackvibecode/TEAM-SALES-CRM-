import type { AppCopy } from "@/lib/i18n/get-copy";
import { SF_ERROR, type SfErrorCode } from "./errors";

type Sf = AppCopy["salesFollowUp"];

const CODE_TO_KEY: Record<SfErrorCode, keyof Sf | null> = {
  [SF_ERROR.UNAUTHORIZED]: "errUnauthorized",
  [SF_ERROR.PIC_NOT_LINKED]: "errPicNotLinked",
  [SF_ERROR.LEAD_NOT_FOUND]: "errLeadNotFound",
  [SF_ERROR.LEAD_FORBIDDEN]: "errLeadForbidden",
  [SF_ERROR.PHONE_REQUIRED]: "phoneRequired",
  [SF_ERROR.PHONE_DUPLICATE]: "errPhoneDuplicate",
  [SF_ERROR.ADMIN_DELETE_ONLY]: "errAdminDeleteOnly",
  [SF_ERROR.ADMIN_DELETE_FU_ONLY]: "errAdminDeleteFuOnly",
  [SF_ERROR.UPLOAD_FILE_REQUIRED]: "fileRequired",
  [SF_ERROR.UPLOAD_FORMAT]: "errUploadFormat",
  [SF_ERROR.UPLOAD_PIC_REQUIRED]: "assignToPicRequired",
  [SF_ERROR.UPLOAD_PIC_NOT_FOUND]: "errPicNotFound",
  [SF_ERROR.UPLOAD_PIC_UNRESOLVED]: "errUploadPicUnresolved",
  [SF_ERROR.UPLOAD_NO_PHONES]: "errUploadNoPhones",
  [SF_ERROR.UPLOAD_FAILED]: "uploadFail",
  [SF_ERROR.GENERIC]: "errGeneric",
};

/** Map API `{ code, error }` to localized UI message. */
export function mapSalesFollowUpApiError(
  sf: Sf,
  payload: { code?: string; error?: string } | null | undefined,
  fallbackKey: keyof Sf = "errGeneric"
): string {
  const code = payload?.code as SfErrorCode | undefined;
  if (code && CODE_TO_KEY[code]) {
    const key = CODE_TO_KEY[code];
    if (key) return String(sf[key]);
  }
  // Legacy BM server messages → map common ones
  const raw = payload?.error || "";
  if (/sudah berada/i.test(raw)) return sf.errPhoneDuplicate;
  if (/telefon diperlukan/i.test(raw)) return sf.phoneRequired;
  if (/tidak dijumpai/i.test(raw) && /lead/i.test(raw)) return sf.errLeadNotFound;
  if (/belum dipautkan/i.test(raw)) return sf.errPicNotLinked;
  if (/hanya admin boleh padam lead/i.test(raw)) return sf.errAdminDeleteOnly;
  if (/hanya admin boleh padam follow/i.test(raw)) return sf.errAdminDeleteFuOnly;
  if (raw) return raw;
  return String(sf[fallbackKey]);
}
