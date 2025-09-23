import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, ArrowRight, RefreshCw, MessageCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

const OTPVerification = () => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  
  const { verifyOTP, resendOTP, registrationData, loading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const inputRefs = useRef([]);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/chat', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (!registrationData) {
      navigate('/register', { replace: true });
    }
  }, [registrationData, navigate]);

  // Timer for resend OTP
  useEffect(() => {
    let interval = null;
    if (timer > 0 && !canResend) {
      interval = setInterval(() => {
        setTimer(timer => timer - 1);
      }, 1000);
    } else if (timer === 0) {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [timer, canResend]);

  const handleOtpChange = (index, value) => {
    if (value.length > 1) {
      // Handle paste
      const pastedOtp = value.slice(0, 6).split('');
      const newOtp = [...otp];
      pastedOtp.forEach((digit, i) => {
        if (index + i < 6) {
          newOtp[index + i] = digit;
        }
      });
      setOtp(newOtp);
      
      // Focus on the last filled input or next empty input
      const nextIndex = Math.min(index + pastedOtp.length, 5);
      inputRefs.current[nextIndex]?.focus();
    } else {
      // Handle single digit input
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      // Auto-focus next input
      if (value && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const otpString = otp.join('');
    
    if (otpString.length !== 6) {
      return;
    }

    setIsSubmitting(true);
    try {
      await verifyOTP(registrationData.phone, otpString);
      navigate('/chat', { replace: true });
    } catch (error) {
      // Clear OTP on error
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    if (!canResend || isResending) return;

    setIsResending(true);
    try {
      await resendOTP(registrationData.phone);
      setTimer(60);
      setCanResend(false);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (error) {
      // Error handled by AuthContext
    } finally {
      setIsResending(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Verifying..." />;
  }

  if (!registrationData) {
    return <LoadingSpinner text="Redirecting..." />;
  }

  const otpString = otp.join('');
  const isOtpComplete = otpString.length === 6;

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-primary-600 p-3 rounded-full">
              <Shield className="w-8 h-8 text-white" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-white">Verify Your Phone</h2>
          <p className="mt-2 text-dark-300">
            We've sent a 6-digit code to
          </p>
          <p className="text-primary-400 font-medium">
            {registrationData.phone}
          </p>
        </div>

        {/* OTP Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-dark-200 mb-4 text-center">
              Enter Verification Code
            </label>
            <div className="flex justify-center space-x-3">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={el => inputRefs.current[index] = el}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]"
                  maxLength="6"
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value.replace(/\D/g, ''))}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-12 h-12 text-center text-xl font-bold border border-dark-600 rounded-lg bg-dark-800 text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={!isOtpComplete || isSubmitting}
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            {isSubmitting ? (
              <div className="flex items-center">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Verifying...
              </div>
            ) : (
              <div className="flex items-center">
                Verify & Continue
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
              </div>
            )}
          </button>

          {/* Resend OTP */}
          <div className="text-center">
            {canResend ? (
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={isResending}
                className="text-primary-400 hover:text-primary-300 font-medium transition-colors duration-200 disabled:opacity-50"
              >
                {isResending ? (
                  <div className="flex items-center justify-center">
                    <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                    Resending...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Resend Code
                  </div>
                )}
              </button>
            ) : (
              <p className="text-dark-400">
                Resend code in {timer}s
              </p>
            )}
          </div>

          <div className="text-center">
            <p className="text-dark-300">
              Wrong phone number?{' '}
              <Link
                to="/register"
                className="font-medium text-primary-400 hover:text-primary-300 transition-colors duration-200"
              >
                Go back
              </Link>
            </p>
          </div>
        </form>

        {/* Development Mode Notice */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-6 p-4 bg-yellow-900/20 border border-yellow-600/30 rounded-lg">
            <p className="text-yellow-400 text-sm text-center">
              <MessageCircle className="w-4 h-4 inline mr-1" />
              Development Mode: Check console for OTP or look for toast notification
            </p>
          </div>
        )}

        {/* Help Text */}
        <div className="mt-6 p-4 bg-dark-800 rounded-lg border border-dark-700">
          <div className="text-center">
            <h3 className="text-sm font-medium text-white mb-2">Didn't receive the code?</h3>
            <div className="space-y-1 text-xs text-dark-400">
              <p>• Check your SMS messages</p>
              <p>• Make sure you entered the correct phone number</p>
              <p>• Wait a few minutes and try resending</p>
              <p>• Check if your phone has good network coverage</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OTPVerification;
