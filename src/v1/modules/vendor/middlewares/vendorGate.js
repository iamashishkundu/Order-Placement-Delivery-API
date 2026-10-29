const ApiError = require('../../../../common/utils/ApiError');
const ERROR_CODES = require('../../../../common/constants/errorCodes');
const VENDOR_STATUS = require('../../../../common/constants/vendorStatus');

/**
 * Gate levels:
 * - 'AUTHENTICATED': vendor is logged in (used for getStatus)
 * - 'APPROVED': vendor is verified and approved by admin (used for profile routes)
 * - 'PROFILE_COMPLETE': vendor is verified, approved, and profileCompleted === true (used for products, orders, dashboard)
 */
const vendorGate = (requiredLevel = 'PROFILE_COMPLETE') => {
  return (req, res, next) => {
    const user = req.user;

    if (!user) {
      return next(ApiError.unauthorized(ERROR_CODES.UNAUTHORIZED, 'Authentication required.'));
    }

    // 1. Level: AUTHENTICATED (only getStatus is accessible by unverified/pending/rejected/blocked vendors)
    if (requiredLevel === 'AUTHENTICATED') {
      return next();
    }

    // 2. Check Verification
    if (!user.isPhoneVerified || !user.isEmailVerified) {
      const missing = [];
      if (!user.isPhoneVerified) missing.push('phone');
      if (!user.isEmailVerified) missing.push('email');
      return next(
        ApiError.forbidden(
          ERROR_CODES.VERIFICATION_REQUIRED,
          `Verification required: ${missing.join(' and ')} not verified.`,
          { unverified: missing }
        )
      );
    }

    // 3. Check Vendor Status
    if (user.status === VENDOR_STATUS.PENDING) {
      return next(
        ApiError.forbidden(
          ERROR_CODES.APPROVAL_PENDING,
          'Your vendor account is pending admin approval.'
        )
      );
    }

    if (user.status === VENDOR_STATUS.REJECTED) {
      return next(
        ApiError.forbidden(
          ERROR_CODES.VENDOR_REJECTED,
          `Your vendor account was rejected. Reason: ${user.rejectionReason || 'No reason specified.'}`,
          { rejectionReason: user.rejectionReason }
        )
      );
    }

    if (user.status === VENDOR_STATUS.BLOCKED) {
      return next(
        ApiError.forbidden(
          ERROR_CODES.VENDOR_BLOCKED,
          'Your vendor account has been blocked by admin.'
        )
      );
    }

    // 4. Level: APPROVED (createProfile, getProfile, updateProfile)
    if (requiredLevel === 'APPROVED') {
      return next();
    }

    // 5. Level: PROFILE_COMPLETE (products, orders, dashboard)
    if (!user.profileCompleted) {
      return next(
        ApiError.forbidden(
          ERROR_CODES.PROFILE_INCOMPLETE,
          'Please complete your vendor profile before accessing this resource.'
        )
      );
    }

    return next();
  };
};

module.exports = vendorGate;

