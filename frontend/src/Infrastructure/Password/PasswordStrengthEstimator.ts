import { ZxcvbnFactory } from "@zxcvbn-ts/core";
import * as common from "@zxcvbn-ts/language-common";
import * as english from "@zxcvbn-ts/language-en";
import { IPasswordStrengthEstimator } from "#ui-domain/Identity/OutsourceContract/IPasswordStrengthEstimator";

/** Local pattern-aware estimator; the full sensitive library result is discarded. */
export class PasswordStrengthEstimator implements IPasswordStrengthEstimator {
  private readonly estimator = new ZxcvbnFactory({
    dictionary: { ...common.dictionary, ...english.dictionary },
    graphs: common.adjacencyGraphs,
    maxLength: 72,
  });

  /**
   * Projects a local estimate to a non-sensitive numeric score.
   * @param password - Current password field, never sent to a third-party service.
   * @param userInputs - Account-related public terms to include in matching.
   * @returns An approximate score, or null when an estimate cannot be produced.
   */
  public estimate(password: string, userInputs: readonly string[]): 0 | 1 | 2 | 3 | 4 | null {
    try {
      return this.estimator.check(password, [...userInputs]).score;
    } catch { return null; }
  }
}
