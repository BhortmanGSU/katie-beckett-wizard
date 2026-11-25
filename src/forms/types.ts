import type { Profile } from '../profile';

export interface SignatureImage {
  /** PNG bytes of the parent's signature (transparent background). */
  png: Uint8Array;
  width: number;
  height: number;
}

export interface FillContext {
  profile: Profile;
  /** Date written next to the parent's signature, already formatted MM/DD/YYYY. */
  signDate: string;
  /** The parent's saved signature. Only placed when the parent approved that form. */
  parentSignature: SignatureImage | null;
  /** When true, the doctor's sections are pre-filled as a draft for the doctor to review. */
  draftDoctorSections: boolean;
}

/**
 * Coordinates are PDF points (1/72 inch), origin at the bottom-left of the page.
 * `page` is 0-based. For text, (x, y) is the left end of the text baseline.
 * For checks, (x, y) is the center of the checkbox.
 */
export type FieldSpec =
  | {
      kind: 'text';
      label: string;
      page: number;
      x: number;
      y: number;
      size?: number; // default 9
      maxWidth?: number; // shrink-to-fit (single line) or wrap width (multi-line)
      maxLines?: number; // >1 wraps text; extra text is truncated with an ellipsis
      lineHeight?: number;
      /** 'doctor' fields are only filled when draftDoctorSections is on. */
      section?: 'parent' | 'doctor';
      value: (c: FillContext) => string;
    }
  | {
      kind: 'check';
      label: string;
      page: number;
      x: number;
      y: number;
      size?: number; // default 7
      section?: 'parent' | 'doctor';
      when: (c: FillContext) => boolean;
    }
  | {
      kind: 'signature';
      label: string;
      page: number;
      x: number; // left
      y: number; // bottom
      width: number;
      height: number;
    };

export interface FormMap {
  formId: string;
  fields: FieldSpec[];
}
