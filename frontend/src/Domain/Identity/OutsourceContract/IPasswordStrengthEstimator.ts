/** Optional local strength estimate; the server remains the acceptance authority. */
export interface IPasswordStrengthEstimator {
  /**
   * Estimates guessability locally without issuing network requests.
   * @param password - Current field value; never retained in the returned result.
   * @param userInputs - Public account-related terms to penalize in the estimate.
   * @returns A score from zero to four, or null if the estimator is unavailable.
   */
  estimate(password: string, userInputs: readonly string[]): 0 | 1 | 2 | 3 | 4 | null;
}
