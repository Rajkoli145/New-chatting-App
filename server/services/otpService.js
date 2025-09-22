const twilio = require('twilio');

class OTPService {
  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    
    // Initialize Twilio only if credentials are provided
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      this.twilioClient = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );
      this.twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
    }
  }

  async sendOTP(phone, otpCode) {
    try {
      const message = `Your Cross-Lingo Chat verification code is: ${otpCode}. This code will expire in 10 minutes.`;

      if (this.isDevelopment) {
        // In development mode, just log the OTP
        console.log(`🔐 OTP for ${phone}: ${otpCode}`);
        console.log(`📱 SMS Message: ${message}`);
        return {
          success: true,
          message: 'OTP sent successfully (Development Mode)',
          sid: 'dev_mode_' + Date.now()
        };
      }

      // Production mode - send actual SMS
      if (!this.twilioClient) {
        throw new Error('Twilio not configured for production SMS sending');
      }

      const result = await this.twilioClient.messages.create({
        body: message,
        from: this.twilioPhoneNumber,
        to: phone
      });

      return {
        success: true,
        message: 'OTP sent successfully',
        sid: result.sid
      };

    } catch (error) {
      console.error('OTP sending error:', error);
      
      if (this.isDevelopment) {
        // In development, still show OTP even if there's an error
        console.log(`🔐 FALLBACK - OTP for ${phone}: ${otpCode}`);
        return {
          success: true,
          message: 'OTP sent successfully (Development Fallback)',
          sid: 'dev_fallback_' + Date.now()
        };
      }

      throw new Error('Failed to send OTP: ' + error.message);
    }
  }

  formatPhoneNumber(phone) {
    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '');
    
    // Add country code if not present
    if (cleaned.length === 10) {
      return '+91' + cleaned; // Default to India
    } else if (cleaned.length === 12 && cleaned.startsWith('91')) {
      return '+' + cleaned;
    } else if (cleaned.startsWith('+')) {
      return phone;
    } else {
      return '+' + cleaned;
    }
  }

  validatePhoneNumber(phone) {
    const phoneRegex = /^[+]?[1-9]\d{1,14}$/;
    const formatted = this.formatPhoneNumber(phone);
    return phoneRegex.test(formatted.replace('+', ''));
  }
}

module.exports = new OTPService();
