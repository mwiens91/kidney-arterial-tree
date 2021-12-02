// Utility function for generating both ABT and KSABT trees.
// Many of these functions use polynomial approximations to
// distributions.

// Get a random number from the standard normal distribution (using the
// Box-Muller transform)
const getRndStdNormal = () => {
  const rnd1 = Math.random();
  const rnd2 = Math.random();

  return Math.sqrt(-2 * Math.log(rnd1)) * Math.sin(2 * Math.PI * rnd2);
};

// Length of a non-afferent arteriole vessel, using the diameter of the vessel
const getLength = (diam) => {
  const rndStdNormal = getRndStdNormal();

  const p1 = 7.2059;
  const p2 = 1.8468e2;

  const len = p1 * diam + p2;
  const lenDeviation = (7.6004e-1 * len + -1.3577e2) * rndStdNormal;

  // Need to make sure this is positive
  const finalLen = len + lenDeviation;

  return finalLen > 0 ? finalLen : getLength(diam);
};

// Length of an afferent arteriole vessel using the vessel's parent
// diameter
const getAfferentLength = (parentDiam) => {
  const rndStdNormal = getRndStdNormal();

  const p1 = 1.38;
  const p2 = -6.128;

  const len = p1 * parentDiam + p2;
  const lenDeviation = (7.6004e-1 * len + -1.3577e2) * rndStdNormal;

  // Not guaranteed to be a positive number, so we'll need to keep
  // trying until we yield one
  const finalLen = len + lenDeviation;

  return finalLen > 0 ? finalLen : getAfferentLength(parentDiam);
};

// First daughter diameter, using the parent diameter
const getFirstDaughterDiam = (parentDiam) => {
  const rndStdNormal = getRndStdNormal();

  const p1 = 8.9379e-6;
  const p2 = -4.5937e-3;
  const p3 = 1.2133;
  const p4 = -7.82;

  const diam =
    p1 * parentDiam ** 3 + p2 * parentDiam ** 2 + p3 * parentDiam + p4;
  const diamDeviation = (8.7881e-2 * diam + 2.1139e-1) * rndStdNormal;

  // Need to make sure this is less than the parentDiam and positive
  const finalDiam = diam + diamDeviation;

  return finalDiam < parentDiam && finalDiam > 0
    ? finalDiam
    : getFirstDaughterDiam(parentDiam);
};

// Murray's law to calculate second daughter diameter given parent
// diameter and first daughter diameter
const getSecondDaughterDiam = (parentDiam, firstDaughterDiam) =>
  (parentDiam ** 3 - firstDaughterDiam ** 3) ** (1 / 3);

// Afferent arteriole diameter branching from a parent vessel in the
// KSABT, independent of everything
const getSegmentedAfferentDiam = () => {
  const rndStdNormal = getRndStdNormal();

  return 1.43e1 + (8.7881e-2 * 1.43e1 + 2.1139e-1) * rndStdNormal;
};

// Get next segmented afferent arteriole position in the KBAST
const getNextSegmentPosition = () => -Math.log(Math.random()) * 9.93567e1;

// Calculate endpoint of branch
const getEndPoint = (x, y, len, angle) => ({
  x: x + len * Math.sin(angle),
  y: y - len * Math.cos(angle),
});

export {
  getLength,
  getAfferentLength,
  getFirstDaughterDiam,
  getSecondDaughterDiam,
  getSegmentedAfferentDiam,
  getNextSegmentPosition,
  getEndPoint,
};
