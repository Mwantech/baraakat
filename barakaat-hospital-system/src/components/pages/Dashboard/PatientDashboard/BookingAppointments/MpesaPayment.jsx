import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { 
  FaMoneyBillWave, 
  FaPhoneAlt, 
  FaCheckCircle, 
  FaTimesCircle,
  FaSpinner
} from 'react-icons/fa';
import styles from './MpesaPayment.module.css';
import { useAuth, API_BASE_URL } from '../../../../../contexts/AuthContext';

const MpesaPayment = ({ appointmentId, appointmentDetails, onSuccess, onBack }) => {
  const { getToken } = useAuth();
  const navigate = useNavigate();
  
  const [phoneNumber, setPhoneNumber] = useState('');
  const [formattedPhoneNumber, setFormattedPhoneNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [transactionDetails, setTransactionDetails] = useState(null);
  const [showInstructions, setShowInstructions] = useState(false);
  const [pollingCount, setPollingCount] = useState(0);
  
  // Format phone number for display
  useEffect(() => {
    if (phoneNumber) {
      // For Kenya phone numbers, convert to international format (254...)
      let formatted = phoneNumber;
      
      // Remove any non-digit characters
      formatted = formatted.replace(/\D/g, '');
      
      // Handle different formats
      if (formatted.startsWith('0') && formatted.length === 10) {
        // Convert 07XXXXXXXX to 2547XXXXXXXX
        formatted = '254' + formatted.substring(1);
      } else if (formatted.startsWith('7') && formatted.length === 9) {
        // Convert 7XXXXXXXX to 2547XXXXXXXX
        formatted = '254' + formatted;
      } else if (formatted.startsWith('+254')) {
        // Remove the + from +254
        formatted = formatted.substring(1);
      }
      
      setFormattedPhoneNumber(formatted);
    }
  }, [phoneNumber]);
  
  // Poll for payment status - updated to 30 seconds
  useEffect(() => {
    let pollInterval;
    
    if (paymentStatus === 'pending') {
      pollInterval = setInterval(async () => {
        try {
          setPollingCount(prev => prev + 1);
          await checkPaymentStatus();
        } catch (error) {
          console.error('Error polling payment status:', error);
        }
      }, 3000); 
    }
    
    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [paymentStatus]);
  
  const handlePhoneNumberChange = (e) => {
    setPhoneNumber(e.target.value);
    setErrorMessage(''); // Clear error when user types
  };
  
  const initiatePayment = async (e) => {
    e.preventDefault();
    
    if (!formattedPhoneNumber || formattedPhoneNumber.length < 12) {
      setErrorMessage('Please enter a valid phone number');
      return;
    }
    
    try {
      setIsSubmitting(true);
      setErrorMessage('');
      setPollingCount(0);
      
      const token = getToken();
      const response = await axios.post(
        `${API_BASE_URL}/payments/mpesa/initiate`,
        {
          appointmentId,
          phoneNumber: formattedPhoneNumber
        },
        {
          headers: {
            'x-auth-token': token,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.data && response.data.success) {
        setPaymentStatus('pending');
        setTransactionDetails(response.data.data);
        setShowInstructions(true);
        
        // Check status after initial delay (15 seconds)
        setTimeout(() => {
          checkPaymentStatus();
        }, 15000);
      } else {
        setErrorMessage(response.data.message || 'Failed to initiate payment');
      }
    } catch (error) {
      console.error('Payment initiation error:', error);
      setErrorMessage(
        error.response?.data?.message || 
        'An error occurred while initiating payment'
      );
    } finally {
      setIsSubmitting(false);
    }
  };
  
 // Updated checkPaymentStatus function for the frontend
const checkPaymentStatus = async () => {
  try {
    const token = getToken();
    const response = await axios.get(
      `${API_BASE_URL}/payments/mpesa/status/${appointmentId}`,
      {
        headers: {
          'x-auth-token': token
        }
      }
    );
    
    console.log('Payment status response:', response.data);
    
    if (response.data && response.data.success) {
      const status = response.data.data.status;
      console.log('Current payment status:', status);
      
      setPaymentStatus(status);
      
      if (status === 'completed') {
        // Payment was successful
        setTransactionDetails({
          ...transactionDetails,
          receiptNumber: response.data.data.receiptNumber || 'N/A',
          timestamp: response.data.data.timestamp || new Date().toISOString()
        });
        
        // Notify parent component
        if (onSuccess) {
          onSuccess();
        }
      } else if (status === 'failed') {
        setErrorMessage(response.data.data.description || 'Payment failed');
      }
    }
  } catch (error) {
    console.error('Error checking payment status:', error);
    // Don't show error to user during automatic polling
    if (!pollingCount) {
      setErrorMessage('Unable to check payment status. Please try again later.');
    }
  }
};
  const handleManualStatusCheck = () => {
    checkPaymentStatus();
  };
  
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0
    }).format(amount);
  };
  
  return (
    <div className={styles.paymentContainer}>
      <div className={styles.paymentHeader}>
        <h3 className={styles.paymentTitle}>
          <FaMoneyBillWave style={{ marginRight: '10px' }} />
          M-Pesa Payment
        </h3>
      </div>
      
      <div className={styles.paymentSummary}>
        <p className={styles.paymentAmount}>
          Amount: {formatCurrency(appointmentDetails.fee || 0)}
        </p>
        <p className={styles.paymentReference}>
          Reference: MED_APT_{appointmentId.substring(0, 8)}
        </p>
      </div>
      
      {paymentStatus === 'completed' ? (
        <div className={styles.paymentSuccess}>
          <FaCheckCircle size={50} className={styles.successIcon} />
          <h3>Payment Successful!</h3>
          {transactionDetails && transactionDetails.receiptNumber && (
            <p className={styles.receiptNumber}>
              Receipt Number: {transactionDetails.receiptNumber}
            </p>
          )}
          <p>Your appointment has been confirmed.</p>
          <button
            className={styles.buttonPrimary}
            onClick={() => navigate('/patient/appointments')}
          >
            View My Appointments
          </button>
        </div>
      ) : paymentStatus === 'failed' ? (
        <div className={styles.paymentFailed}>
          <FaTimesCircle size={50} className={styles.failedIcon} />
          <h3>Payment Failed</h3>
          <p>{errorMessage || 'Your payment could not be processed'}</p>
          <div className={styles.paymentActions}>
            <button 
              className={styles.buttonSecondary}
              onClick={() => setPaymentStatus('')}
            >
              Try Again
            </button>
            <button
              className={styles.buttonPrimary}
              onClick={onBack}
            >
              Go Back
            </button>
          </div>
        </div>
      ) : paymentStatus === 'pending' ? (
        <div className={styles.paymentPending}>
          <div className={styles.pendingAnimation}>
            <FaSpinner className={styles.spinner} />
          </div>
          <h3>Payment Processing</h3>
          <p>
            Please check your phone and enter your M-Pesa PIN when prompted.
          </p>
          
          {showInstructions && (
            <div className={styles.instructions}>
              <h4>Instructions:</h4>
              <ol>
                <li>You will receive an M-Pesa prompt on your phone</li>
                <li>Enter your M-Pesa PIN to authorize payment</li>
                <li>Wait for confirmation</li>
              </ol>
            </div>
          )}
          
          <p className={styles.waitMessage}>
            Please wait while we confirm your payment...
          </p>
          <p className={styles.pollingInfo}>
            Status checks every 30 seconds
          </p>
          
          <button 
            className={styles.buttonSecondary}
            onClick={handleManualStatusCheck}
          >
            Check Status Now
          </button>
        </div>
      ) : (
        <form onSubmit={initiatePayment} className={styles.paymentForm}>
          <div className={styles.formGroup}>
            <label htmlFor="phoneNumber">
              <FaPhoneAlt style={{ marginRight: '8px' }} />
              M-Pesa Phone Number
            </label>
            <input
              type="tel"
              id="phoneNumber"
              value={phoneNumber}
              onChange={handlePhoneNumberChange}
              placeholder="e.g. 07XX XXX XXX"
              className={styles.input}
              required
            />
            <small className={styles.inputHelp}>
              Enter the phone number registered with M-Pesa
            </small>
          </div>
          
          {formattedPhoneNumber && (
            <p className={styles.formattedNumber}>
              Will send payment request to: <strong>{formattedPhoneNumber}</strong>
            </p>
          )}
          
          {errorMessage && (
            <div className={styles.errorMessage}>
              {errorMessage}
            </div>
          )}
          
          <div className={styles.paymentActions}>
            <button
              type="button"
              className={styles.buttonSecondary}
              onClick={onBack}
              disabled={isSubmitting}
            >
              Back
            </button>
            <button
              type="submit"
              className={styles.buttonPrimary}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Processing...' : 'Pay Now'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default MpesaPayment;