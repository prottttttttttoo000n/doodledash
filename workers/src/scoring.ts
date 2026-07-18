/**
 * Calculate score for a correct guess.
 * Faster guesses earn more points.
 *
 * @param timeRemaining - Seconds left on the timer when guessed
 * @param totalTime - Total round duration in seconds
 * @returns Points awarded (minimum 50, maximum 200)
 */
export function calculateGuessScore(timeRemaining: number, totalTime: number): number {
  if (totalTime <= 0) return 50;
  const ratio = Math.max(0, Math.min(1, timeRemaining / totalTime));
  return Math.max(50, Math.floor(ratio * 150));
}

/**
 * Calculate score for the doodler based on how many players guessed correctly.
 *
 * @param correctGuessCount - Number of players who guessed the word
 * @param totalGuessers - Total number of players who could guess (excludes doodler)
 * @returns Points awarded (minimum 0, maximum 200)
 */
export function calculateDoodlerScore(correctGuessCount: number, totalGuessers: number): number {
  if (totalGuessers <= 0) return 0;
  const ratio = Math.max(0, Math.min(1, correctGuessCount / totalGuessers));
  return Math.max(0, Math.floor(ratio * 200));
}
