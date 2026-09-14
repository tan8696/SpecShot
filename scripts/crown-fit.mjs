/**
 * Can a conforming photo exist at all — is there ANY head size and eye
 * position the spec allows where the crown still lands inside the frame?
 *
 * Deliberately asks about the most permissive corner of the spec (smallest
 * allowed head, lowest allowed eye line) rather than the midpoint. Several
 * specs carry an intentionally wide eye_line band because the source never
 * published one; the midpoint of such a placeholder is a number nobody
 * asserted, and warning on it cries wolf on data that is fine. When this
 * fires, the whole band is unusable — check the source, as usually the
 * eye_line was transcribed from a different document's requirements.
 *
 * 0.48 is the adult average share of head height above the eye line, so this
 * warns rather than errors: it is an approximation, and a validator that
 * fails builds on approximations is one people learn to ignore.
 */
export function crownFit(frameHeightMm, headMinMm, eyeFromBottomPctMin) {
  const available = frameHeightMm * (1 - eyeFromBottomPctMin / 100);
  const needed = headMinMm * 0.48;
  return { fits: needed <= available, needed, available };
}
