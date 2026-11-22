/** Editable descriptive input; schedule size is supplied only during creation. */
export interface IResourceDraft {
  /** Display name. */
  name: string;
  /** Maximum occupants. */
  capacity: number;
  /** Resource kind. */
  type: "ROOM" | "DESK";
  /** Plain-text description. */
  description: string;
  /** Plain-text location. */
  location: string;
  /** Distinct equipment labels. */
  equipment: string[];
}
