const User = require('../models/User');
const TeamStructure = require('../models/TeamStructure');
const PreEnrollment = require('../models/PreEnrollment');
const { PACKAGE_VOLUME } = require('../utils/constants'); // Removed commission related constants

/**
 * Find the next available open position under a given sponsor/parent.
 * Uses a breadth-first search approach, prioritizing the preferred leg if specified.
 * 
 * @param {string} sponsorId - The ID of the user to start the search from.
 * @param {string} [preferredLeg='auto'] - 'left', 'right', or 'auto'. 'auto' usually balances or follows sponsor setting.
 * @returns {Promise<{parentId: string, position: 'left'|'right'}>} - The ID of the parent where the new user should be placed and the position.
 * @throws {Error} If no sponsor structure found or no available position is found (should theoretically not happen in an infinite binary tree).
 */
exports.findNextAvailablePosition = async (sponsorId, preferredLeg = 'auto') => {
  const sponsorStructure = await TeamStructure.findOne({ user: sponsorId });
  if (!sponsorStructure) {
    // This case needs handling: What if the sponsor isn't in the structure yet?
    // Option A: Throw error
    // Option B: Place under the root/admin (requires finding root)
    // Option C: Queue for placement later?
    throw new Error(`Sponsor structure not found for sponsor ID: ${sponsorId}. Cannot determine placement.`);
    // For now, throwing error. Robust solution might need root fallback.
    // const rootUser = await User.findOne({ role: 'admin' });
    // if (!rootUser) throw new Error('Sponsor structure not found and no root user defined.');
    // sponsorId = rootUser._id; // Reassign sponsorId to root and retry or handle differently
    // sponsorStructure = await TeamStructure.findOne({ user: sponsorId });
    // if (!sponsorStructure) throw new Error('Root user structure not found.');
  }

  // 1. Check direct legs of the sponsor first, respecting preference
  if (preferredLeg === 'left' && !sponsorStructure.leftLeg) {
    return { parentId: sponsorId, position: 'left' };
  }
  if (preferredLeg === 'right' && !sponsorStructure.rightLeg) {
    return { parentId: sponsorId, position: 'right' };
  }
  // If preference is 'auto' or the preferred leg is taken, check the other direct leg
  if (!sponsorStructure.leftLeg) {
      return { parentId: sponsorId, position: 'left' };
  }
  if (!sponsorStructure.rightLeg) {
      return { parentId: sponsorId, position: 'right' };
  }

  // 2. If both direct legs are full, perform BFS starting from preferred leg (or left if auto)
  const queue = [];
  const visited = new Set(); // Prevent cycles, though unlikely in strict binary

  // Initialize queue based on preference or default order
  if (preferredLeg === 'left' || preferredLeg === 'auto') {
      if(sponsorStructure.leftLeg) queue.push(sponsorStructure.leftLeg);
      if(sponsorStructure.rightLeg) queue.push(sponsorStructure.rightLeg);
  } else { // preferredLeg === 'right'
      if(sponsorStructure.rightLeg) queue.push(sponsorStructure.rightLeg);
      if(sponsorStructure.leftLeg) queue.push(sponsorStructure.leftLeg);
  }
  
  visited.add(sponsorId.toString());
  if(sponsorStructure.leftLeg) visited.add(sponsorStructure.leftLeg.toString());
  if(sponsorStructure.rightLeg) visited.add(sponsorStructure.rightLeg.toString());

  while (queue.length > 0) {
    const currentUserId = queue.shift();

    const currentStructure = await TeamStructure.findOne({ user: currentUserId });
    if (!currentStructure) continue; // Skip if structure doesn't exist for some reason

    // Check left leg
    if (!currentStructure.leftLeg) {
      return { parentId: currentUserId, position: 'left' };
    }
    if (!visited.has(currentStructure.leftLeg.toString())) {
        queue.push(currentStructure.leftLeg);
        visited.add(currentStructure.leftLeg.toString());
    }

    // Check right leg
    if (!currentStructure.rightLeg) {
      return { parentId: currentUserId, position: 'right' };
    }
     if (!visited.has(currentStructure.rightLeg.toString())) {
        queue.push(currentStructure.rightLeg);
        visited.add(currentStructure.rightLeg.toString());
    }
  }

  // This point should ideally be unreachable in an infinitely growing binary tree
  throw new Error('No available position found. The tree might be unexpectedly full or corrupted.');
};

/**
 * Adds a user to the team structure under a specific parent and position.
 * Also updates the volume and count up the ancestral chain.
 * 
 * @param {string} userId - The ID of the user being placed.
 * @param {string} parentId - The ID of the direct parent user.
 * @param {'left'|'right'} position - The leg under the parent.
 * @returns {Promise<object>} The created TeamStructure document.
 * @throws {Error} If parent structure not found or update fails.
 */
exports.placeUserInTeamStructure = async (userId, parentId, position) => {
  const parentStructure = await TeamStructure.findOne({ user: parentId });
  if (!parentStructure) {
    throw new Error(`Parent structure not found for parent ID: ${parentId}`);
  }

  // Check if position is already filled (should ideally be caught by findNextAvailablePosition)
  if ((position === 'left' && parentStructure.leftLeg) || (position === 'right' && parentStructure.rightLeg)) {
      throw new Error(`Placement conflict: Position ${position} under parent ${parentId} is already filled.`);
  }

  // Create the new user's team structure entry
  const newUserStructure = await TeamStructure.create({
    user: userId,
    position,
    parent: parentId,
    depth: parentStructure.depth + 1,
    enrollmentOrder: await TeamStructure.countDocuments() // Atomicity concern? Consider incrementing counter
  });

  // Update the parent's structure
  if (position === 'left') {
    parentStructure.leftLeg = userId;
  } else {
    parentStructure.rightLeg = userId;
  }
  // Incrementing counts is handled in updateAncestorCountsAndVolumes
  await parentStructure.save(); 

  // Update counts and volumes up the tree
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found during placement volume update.');
  
  await updateAncestorCountsAndVolumes(newUserStructure._id, getPackageVolume(user.package));

  console.log(`User ${userId} placed successfully under ${parentId} in ${position} leg.`);
  return newUserStructure;
};

/**
 * Updates the leg counts and volumes for all ancestors of a newly placed user.
 * 
 * @param {string} placedUserStructureId - The MongoDB _id of the TeamStructure document for the user who was just placed.
 * @param {number} volume - The volume generated by the new user's package/purchase.
 */
const updateAncestorCountsAndVolumes = async (placedUserStructureId, volume) => {
  let currentStructure = await TeamStructure.findById(placedUserStructureId);
  if (!currentStructure || !currentStructure.parent) {
    return; // Reached root or invalid structure
  }

  let childPosition = currentStructure.position;
  let parentId = currentStructure.parent;

  while (parentId) {
    const updateResult = await TeamStructure.updateOne(
      { user: parentId }, // Find the parent document by user ID
      {
        $inc: { // Increment counts and volumes atomically
          [`${childPosition}LegCount`]: 1,
          [`${childPosition}LegVolume`]: volume,
          totalTeamSize: 1
        }
      }
    );

    if (updateResult.matchedCount === 0) {
        console.error(`Ancestor update failed: Parent structure not found for user ID ${parentId}`);
        break; // Stop propagation if ancestor not found
    }
    if (updateResult.modifiedCount === 0) {
        // This might happen if concurrent updates occurred. Might need retry logic.
        console.warn(`Ancestor update for ${parentId} resulted in no modification. Possible concurrency issue?`);
    }

    // Move up to the next ancestor
    const nextParentStructure = await TeamStructure.findOne({ user: parentId }).select('parent position');
    if (!nextParentStructure || !nextParentStructure.parent) {
      break; // Reached the top
    }
    childPosition = nextParentStructure.position;
    parentId = nextParentStructure.parent;
  }
};

/**
 * Helper to get volume based on package type.
 * @param {string} packageType - e.g., 'starter', 'elite', 'pro'
 * @returns {number} Volume points.
 */
const getPackageVolume = (packageType) => {
  return PACKAGE_VOLUME[packageType] || 0;
};

/**
 * Processes the pre-enrollment queue: activates eligible users and expires old ones.
 * This is intended to be run periodically (e.g., by a cron job).
 */
exports.processPreEnrollmentQueue = async () => {
  const now = new Date();
  console.log(`Processing pre-enrollment queue at ${now.toISOString()}`);

  // --- Process Activations --- 
  // Find waiting pre-enrollments that are not expired and whose users are now marked active
  const enrollmentsToActivate = await PreEnrollment.find({
    status: 'waiting',
    expiryDate: { $gt: now }
  }).populate('user'); // Populate user to check isActive

  let activatedCount = 0;
  for (const enrollment of enrollmentsToActivate) {
    if (enrollment.user && enrollment.user.isActive && enrollment.user.role === 'promoter') {
      // Check if already has a team structure record (shouldn't happen if logic is correct)
      const existingStructure = await TeamStructure.findOne({ user: enrollment.user._id });
      if (existingStructure) {
          console.warn(`User ${enrollment.user._id} is active but already has a team structure record. Skipping placement, marking pre-enrollment as converted.`);
          enrollment.status = 'converted';
          await enrollment.save();
          continue;
      }

      console.log(`Activating user ${enrollment.user._id} from pre-enrollment queue.`);
      enrollment.status = 'processing';
      await enrollment.save();

      // --- Determine Placement --- 
      let parentId = enrollment.tentativeParent;
      let position = enrollment.tentativePosition;
      let placementFound = false;

      if (parentId && position) {
          try {
              const parentStructure = await TeamStructure.findOne({ user: parentId });
              // Verify the spot is still open
              if (parentStructure && !((position === 'left' && parentStructure.leftLeg) || (position === 'right' && parentStructure.rightLeg))) {
                  placementFound = true;
              } else {
                  console.warn(`Tentative placement for ${enrollment.user._id} (Parent: ${parentId}, Pos: ${position}) is taken. Finding new spot.`);
              }
          } catch (err) {
              console.error(`Error verifying tentative placement for ${enrollment.user._id}:`, err);
          }
      }

      // If no valid tentative placement or it was taken, find a new one
      if (!placementFound) {
          let sponsorId = enrollment.user.sponsor || null;
          if (!sponsorId) {
              const rootUser = await User.findOne({ role: 'admin' });
              sponsorId = rootUser?._id;
          }
          if (!sponsorId) {
              console.error(`CRITICAL: Cannot place user ${enrollment.user._id} - no sponsor or root user found.`);
              enrollment.status = 'waiting'; // Revert status
              await enrollment.save();
              continue; // Skip this user
          }
          try {
              const placement = await this.findNextAvailablePosition(sponsorId, enrollment.placementPreference || 'auto');
              parentId = placement.parentId;
              position = placement.position;
              placementFound = true;
          } catch (err) {
              console.error(`Error finding new placement for user ${enrollment.user._id}:`, err);
              enrollment.status = 'waiting'; // Revert status
              await enrollment.save();
              continue; // Skip this user
          }
      }

      // --- Place User --- 
      if (placementFound) {
          try {
              await this.placeUserInTeamStructure(enrollment.user._id, parentId, position);
              enrollment.status = 'converted';
              await enrollment.save();
              activatedCount++;
          } catch (placementError) {
              console.error(`Failed to place activated user ${enrollment.user._id} in structure:`, placementError);
              enrollment.status = 'waiting'; // Revert status on error
              await enrollment.save();
          }
      }
    }
  }
  console.log(`Successfully processed and placed ${activatedCount} activated pre-enrollees.`);

  // --- Process Expirations --- 
  const expirationResult = await PreEnrollment.updateMany(
    { expiryDate: { $lte: now }, status: 'waiting' },
    { $set: { status: 'expired' } }
  );

  if (expirationResult.modifiedCount > 0) {
      console.log(`Expired ${expirationResult.modifiedCount} pre-enrollment records.`);
      // Optionally: Update the corresponding User records back to inactive or delete them?
      // const expiredEnrollments = await PreEnrollment.find({ status: 'expired', expiryDate: { $lte: now } }).select('user');
      // const userIdsToExpire = expiredEnrollments.map(e => e.user);
      // await User.updateMany({ _id: { $in: userIdsToExpire }, isActive: false, role: 'pre-enrollee' }, { $set: { role: 'expired-pre-enrollee' } }); // Example status change
  }

  console.log('Pre-enrollment queue processing finished.');
};

// --- Commission Processing Stubs (Excluded) --- 

// exports.processTeamCommissions = async () => {
//   console.log('processTeamCommissions called - Logic excluded.');
//   // Logic for calculating and paying team cycle bonuses would go here.
// };

// exports.processMegaMatchingBonuses = async () => {
//   console.log('processMegaMatchingBonuses called - Logic excluded.');
//   // Logic for calculating and paying matching bonuses would go here.
// };

// exports.processLeadershipPool = async () => {
//   console.log('processLeadershipPool called - Logic excluded.');
//   // Logic for calculating and distributing leadership pool shares would go here.
// };
