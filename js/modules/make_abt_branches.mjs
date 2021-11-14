import {
  getLength,
  getAfferentLength,
  getFirstDaughterDiam,
  getSecondDaughterDiam,
  getEndPoint,
} from "./util.mjs";

// Initial branch function
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
  };
};

// Makes everything. "da" is an "angle factor" -- use this to control
// "spread". "ada" is the "angle factor" specific for afferent
// arterioles. "ar" is a measure of randomness for the angle.
const makeBranches = (initDiam, stopDiam, da = 0.2, ar = 0.2, ada = 0.6) => {
  let branches = [];

  const makeChildBranch = (parentBranch, childDiam, left = true) => {
    // Make left branch and recurse
    const daR = ar * Math.random() - ar * 0.5;

    // Determine if we're an afferent arteriole and get length and angle
    let len;
    let angle = parentBranch.angle + daR;
    let isAfferent = false;

    if (childDiam <= stopDiam) {
      len = getAfferentLength(parentBranch.diameter);
      angle += left ? ada : -ada;
      isAfferent = true;
    } else {
      len = getLength(childDiam);
      angle += left ? da : -da;
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
    };
  };

  const pushBranch = (branch) => {
    // Push the branch
    branches.push(branch);

    // Continue branching
    if (!branch.isAfferent) {
      // Make child branches
      const firstDaughterDiam = getFirstDaughterDiam(branch.diameter);
      const secondDaughterDiam = getSecondDaughterDiam(
        branch.diameter,
        firstDaughterDiam
      );

      // Randomly decide if the first daughter skews left or right
      const firstIsLeft = !!Math.round(Math.random());

      pushBranch(makeChildBranch(branch, firstDaughterDiam, firstIsLeft));
      pushBranch(makeChildBranch(branch, secondDaughterDiam, !firstIsLeft));
    }
  };

  // Do the recursion
  pushBranch(makeInitialBranch(initDiam));

  return branches;
};

export { getEndPoint, makeBranches };
