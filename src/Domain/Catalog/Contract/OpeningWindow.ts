/** One local weekday window, indexed Sunday (0) through Saturday (6). */
export interface OpeningWindow {
  /** Inclusive minute of day; 0 with close 0 disables the day. */
  readonly open: number;
  /** Exclusive minute of day, 1440 denotes the following midnight. */
  readonly close: number;
}
