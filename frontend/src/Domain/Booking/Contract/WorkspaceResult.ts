/** Safe transport outcomes without raw server diagnostics. */
export type WorkspaceResult<T> = { status: "ok"; data: T } | { status: "failed"; message: string; unauthorized: boolean };
