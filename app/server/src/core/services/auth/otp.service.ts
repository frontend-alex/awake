import { OtpType } from "@shared/types/otp";
import { config } from "@shared/config/config";
import { 
  createOtp, 
  findByCodeAndType, 
  markAsUsed, 
  invalidateUserOtps, 
} from "@/infrastructure/repositories/auth/otp.repository";
import { createError } from "@/core/error/errors";
import { EmailUtils } from "@/infrastructure/email/email";

/**
 * Sends an OTP code to the user's email address
 * @param userId - The user ID to send the OTP for
 * @param email - The email address to send the OTP to
 * @param type - The type of OTP (default: EmailVerification)
 */
export const sendOtp = async (userId: string, email: string, type: OtpType = OtpType.EmailVerification) => {
  try {
    const otp = await createOtp(userId, type, 5); // 5 minutes expiry
    
    // Send email
    const otpEmail = EmailUtils.getEmailTemplate("otp");
    const html = otpEmail
      .replace("{{OTP_CODE}}", otp.code)
      .replace("{{YEAR}}", new Date().getFullYear().toString())
      .replace("{{APP_NAME}}", config.app.name);
    
    await EmailUtils.sendEmail(email, "Your OTP code", html);
    
  } catch (error) {
    throw createError("OTP_SEND_FAILED");
  }
};

/**
 * Verifies an OTP code for a user
 * @param userId - The user ID to verify the OTP for
 * @param code - The OTP code to verify
 * @param type - The type of OTP (default: EmailVerification)
 */
export const verifyOtp = async (userId: string, code: string, type: OtpType = OtpType.EmailVerification) => {
  try {
    const otp = await findByCodeAndType(code, type);
    
    if (!otp) {
      throw createError("OTP_NOT_FOUND");
    }
    
    if (otp.userId.toString() !== userId) {
      throw createError("INVALID_OTP");
    }
    
    if (otp.isExpired()) {
      throw createError("OTP_EXPIRED");
    }
    
    if (otp.isUsed) {
      throw createError("OTP_ALREADY_USED");
    }
    
    // Mark OTP as used
    await markAsUsed(otp.id);
    
  } catch (error) {
    throw error;
  }
};

/**
 * Resends an OTP code to the user's email address
 * Invalidates existing OTPs before sending a new one
 * @param userId - The user ID to resend the OTP for
 * @param email - The email address to send the OTP to
 * @param type - The type of OTP (default: EmailVerification)
 */
export const resendOtp = async (userId: string, email: string, type: OtpType = OtpType.EmailVerification) => {
  try {
    // Invalidate existing OTPs
    await invalidateUserOtps(userId, type);
    
    // Send new OTP
    return await sendOtp(userId, email, type);

  } catch (error) {
    throw error;
  }
};
