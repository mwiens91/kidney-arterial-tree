import {
  getLength,
  getAfferentLength,
  getFirstDaughterDiam,
  getSecondDaughterDiam,
  getSegmentedAfferentDiam,
  getNextSegmentPosition,
  getEndPoint,
} from "./util.mjs";

// Initial branch function: the nextSegmentPosition attribute is just
// there to make segmentation computation easier. It doesn't really have
// a meaningful interpretation once the network is complete.
const makeInitialBranch = (diam) => {
  // Angle starts at 0
  const angle = 0;

  // Length
  const len = getLength(diam);

  // Starting and finishing positions
  const x1 = 250;
  const y1 = 500;
  const { x: x2, y: y2 } = getEndPoint(x1, y1, len, angle);

  // Return the branch
  return {
    idx: 0,
    x1: x1,
    y1: y1,
    x2: x2,
    y2: y2,
    angle: angle,
    len: len,
    diameter: diam,
    isAfferent: false,
    nextSegmentPosition: 0,
  };
};

// Makes everything. "da" is an "angle factor": use this to control
// "spread". "ada" is the "angle factor" specific for afferent
// arterioles. "ar" is a measure of randomness for the angle.
const makeBranches = (initDiam, stopDiam, da = 0.2, ar = 0.2, ada = 0.6) => {
  let branches = [];

  // "forcedLength" specifies a length to force the child branch to:
  // this is necessary when continuing a segmented branch; it defaults
  // to null
  const makeChildBranch = (
    parentBranch,
    childDiam,
    left = true,
    useParentAngle = false,
    forcedLength = null
  ) => {
    // Make left branch and recurse
    const daR = ar * Math.random() - ar * 0.5;

    // Determine if we're an afferent arteriole and get length and angle
    let len;
    let angle = parentBranch.angle + (useParentAngle ? 0 : daR);
    let isAfferent = false;

    if (childDiam <= stopDiam) {
      len = getAfferentLength(parentBranch.diameter);

      // If we were asked to use parent angle but this turned out to be
      // an afferent arteriole, make sure we *don't* use the parent
      // angle and add back in the randomness we excluded above
      angle += (left ? ada : -ada) + (useParentAngle ? daR : 0);

      isAfferent = true;
    } else {
      len = forcedLength === null ? getLength(childDiam) : forcedLength;

      if (!useParentAngle) {
        angle += left ? da : -da;
      }
    }

    // Get endpoint
    const { x: x2, y: y2 } = getEndPoint(
      parentBranch.x2,
      parentBranch.y2,
      len,
      angle
    );

    return {
      idx: branches.length,
      x1: parentBranch.x2,
      y1: parentBranch.y2,
      x2: x2,
      y2: y2,
      angle: angle,
      len: len,
      diameter: childDiam,
      isAfferent: isAfferent,
      nextSegmentPosition: parentBranch.nextSegmentPosition,
    };
  };

  const pushBranch = (branch) => {
    if (branch.isAfferent) {
      // Push the branch
      branches.push(branch);
    } else {
      // Handle possible segmentation
      let nextSegmentPosition =
        branch.nextSegmentPosition > 0
          ? branch.nextSegmentPosition
          : getNextSegmentPosition();

      // Determine whether to segment
      if (nextSegmentPosition >= branch.len) {
        // We're not segmenting, so just push the branch
        branches.push(branch);

        // Remove the length of this branch from the next segment
        // position
        nextSegmentPosition -= branch.len;

        // Make child branches
        const firstDaughterDiam = getFirstDaughterDiam(branch.diameter);
        const secondDaughterDiam = getSecondDaughterDiam(
          branch.diameter,
          firstDaughterDiam
        );

        // Randomly decide if the first daughter skews left or right
        const firstIsLeft = !!Math.round(Math.random());

        // Update the next segment position for this branch so the child
        // branches have it
        branch.nextSegmentPosition = nextSegmentPosition;

        // Recurse
        pushBranch(makeChildBranch(branch, firstDaughterDiam, firstIsLeft));
        pushBranch(makeChildBranch(branch, secondDaughterDiam, !firstIsLeft));
      } else {
        // We're going to segment: first randomly choose whether to put the
        // afferent arteriole on the left or right
        const afferentLeft = !!Math.round(Math.random());

        const afferentDiam = getSegmentedAfferentDiam();
        const daughterDiam = getSecondDaughterDiam(
          branch.diameter,
          afferentDiam
        );

        // Force the daughter branch's length to continue the length
        // remaining of this segment
        const daughterLen = branch.len - nextSegmentPosition;

        // We need to redefine the end positions and length of the
        // current branch
        branch.len = nextSegmentPosition;

        const endPoint = getEndPoint(
          branch.x1,
          branch.y1,
          branch.len,
          branch.angle
        );
        branch = { ...branch, x2: endPoint.x, y2: endPoint.y };

        // Reset the next segment position for this branch so the
        // daughter branch has it
        branch.nextSegmentPosition = 0;

        // Push this branch
        branches.push(branch);

        // Recurse
        pushBranch(makeChildBranch(branch, afferentDiam, afferentLeft));
        pushBranch(
          makeChildBranch(branch, daughterDiam, false, true, daughterLen)
        );
      }
    }
  };

  // The initial branch shouldn't have any segmentation, so this is a
  // special case. It's convenient just to write a simplified version
  // of pushBranch for this instead of adding more special cases to
  // pushBranch (which is arguably already bloated).
  const pushInitialBranch = (branch) => {
    // Push the branch
    branches.push(branch);

    // Make child branches
    const firstDaughterDiam = getFirstDaughterDiam(branch.diameter);
    const secondDaughterDiam = getSecondDaughterDiam(
      branch.diameter,
      firstDaughterDiam
    );

    // Recurse
    pushBranch(makeChildBranch(branch, firstDaughterDiam, true, false));
    pushBranch(makeChildBranch(branch, secondDaughterDiam, false, false));
  };

  // Do the recursion
  pushInitialBranch(makeInitialBranch(initDiam));

  // Drop the nextSegmentPosition attribute to keep uniformity with
  // the structure of ABT branches
  branches = branches.map(
    // eslint-disable-next-line no-unused-vars
    ({ nextSegmentPosition, ...otherProps }) => otherProps
  );

  return branches;
};

export { getEndPoint, makeBranches };
