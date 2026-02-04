/**
 * Shared Reservation Utilities
 * Handles API calls for all reservation types (Hotel, Group, PlaneTicket)
 */

// API Base URL - Shared across all reservation modules
// Declare as const first, then also set on window for global access
const API_BASE_URL = "https://api.travelgate.co/api";
window.API_BASE_URL = API_BASE_URL;

/**
 * Validates reservation data based on reservation type
 * @param {Object} data - Reservation data
 * @returns {Object} { valid: boolean, error: string }
 */
function validateReservation(data) {
    const { reservationType, hotelId, roomType, groupId, ticketId, ticketType, amount, customerName, customerPhone, customerEmail } = data;

    if (!reservationType) {
        return { valid: false, error: 'Please select a reservation type' };
    }

    if (!amount || amount <= 0) {
        return { valid: false, error: 'Amount is required and must be greater than 0' };
    }

    // Validate customer information - REQUIRED for all reservations
    if (!customerName || customerName.trim() === '' || 
        customerName.trim().toLowerCase() === 'guest' || 
        customerName.trim().toLowerCase() === 'n/a') {
        return { valid: false, error: 'Customer name is required and cannot be "Guest" or "N/A"' };
    }

    if (!customerPhone || customerPhone.trim() === '' || 
        customerPhone.trim().toLowerCase() === 'n/a') {
        return { valid: false, error: 'Customer phone number is required and cannot be "N/A"' };
    }

    // Validate phone contains digits and is at least 5 characters
    if (customerPhone.trim().length < 5 || !/\d/.test(customerPhone)) {
        return { valid: false, error: 'Phone number must be at least 5 characters and contain digits' };
    }

    if (!customerEmail || customerEmail.trim() === '' || 
        customerEmail.trim().toLowerCase() === 'n/a') {
        return { valid: false, error: 'Customer email address is required and cannot be "N/A"' };
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerEmail.trim())) {
        return { valid: false, error: 'Please enter a valid email address' };
    }

    switch (reservationType) {
        case 'Hotel':
            if (!hotelId || !roomType) {
                return { valid: false, error: 'Hotel ID and Room Type are required for Hotel reservations' };
            }
            break;

        case 'Group':
            if (!groupId || !hotelId || !roomType) {
                return { valid: false, error: 'Group ID, Hotel ID, and Room Type are required for Group reservations' };
            }
            break;

        case 'PlaneTicket':
            if (!ticketId || !ticketType) {
                return { valid: false, error: 'Ticket ID and Ticket Type are required for Plane Ticket reservations' };
            }
            if (!['OneWay', 'TwoWay'].includes(ticketType)) {
                return { valid: false, error: 'Ticket Type must be OneWay or TwoWay' };
            }
            break;

        case 'Transfer':
            if (!data.transferId) {
                return { valid: false, error: 'Transfer ID is required for Transfer reservations' };
            }
            break;

        case 'FlightPackage':
            if (!data.flightPackageId) {
                return { valid: false, error: 'Flight Package ID is required for Flight Package reservations' };
            }
            break;

        case 'GroupProgram':
            if (!data.groupProgramId) {
                return { valid: false, error: 'Group Program ID is required for Group Program reservations' };
            }
            break;

        default:
            return { valid: false, error: 'Invalid reservation type' };
    }

    return { valid: true, error: null };
}

/**
 * Creates a reservation via the API
 * @param {Object} reservationData - Reservation data
 * @returns {Promise<Object>} Reservation response
 */
async function createReservation(reservationData) {
    // Validate reservation data
    const validation = validateReservation(reservationData);
    if (!validation.valid) {
        throw new Error(validation.error);
    }

    // Map reservation type string to enum value (backend supports both string and numeric)
    // Using string enum names since JsonStringEnumConverter is configured
    const reservationTypeMap = {
        'Hotel': 'Hotel',
        'Group': 'Group',
        'PlaneTicket': 'PlaneTicket',
        'Transfer': 'Transfer',
        'FlightPackage': 'FlightPackage',
        'GroupProgram': 'GroupProgram'
    };

    const reservationType = reservationTypeMap[reservationData.reservationType] || reservationData.reservationType;

    // Build payload based on reservation type
    // Customer info is required - no fallback values
    const payload = {
        reservationType: reservationType,
        amount: reservationData.amount,
        customerName: reservationData.customerName?.trim() || '',
        customerPhone: reservationData.customerPhone?.trim() || '',
        customerEmail: reservationData.customerEmail?.trim() || '',
        notes: reservationData.notes || null,
        // Add date fields (optional)
        checkInDate: reservationData.checkInDate || null,
        checkOutDate: reservationData.checkOutDate || null,
        departureDate: reservationData.departureDate || null,
        returnDate: reservationData.returnDate || null,
        travelDate: reservationData.travelDate || null
    };

    // Add fields based on reservation type
    if (reservationData.reservationType === 'Hotel' || reservationData.reservationType === 'Group') {
        payload.hotelId = reservationData.hotelId;
        payload.roomType = reservationData.roomType;
        payload.hotelName = reservationData.hotelName || '';
        payload.city = reservationData.city || '';
        payload.country = reservationData.country || '';
    }

    if (reservationData.reservationType === 'Group') {
        payload.groupId = reservationData.groupId;
    }

    if (reservationData.reservationType === 'PlaneTicket') {
        payload.ticketId = reservationData.ticketId;
        payload.ticketType = reservationData.ticketType;
    }

    if (reservationData.reservationType === 'Transfer') {
        // Ensure transferId is a valid non-empty string
        const transferIdStr = reservationData.transferId ? String(reservationData.transferId).trim() : '';
        if (!transferIdStr || transferIdStr === 'null' || transferIdStr === 'undefined') {
            console.error('[Reservation] Invalid transferId:', {
                original: reservationData.transferId,
                type: typeof reservationData.transferId,
                stringified: transferIdStr
            });
            throw new Error('Transfer ID is required for Transfer reservations');
        }
        payload.transferId = transferIdStr;
        
        // Add optional city/country for transfers
        if (reservationData.city) {
            payload.city = reservationData.city;
        }
        if (reservationData.country) {
            payload.country = reservationData.country;
        }
        if (reservationData.hotelName) {
            payload.hotelName = reservationData.hotelName; // Use as service name
        }
    }

    if (reservationData.reservationType === 'FlightPackage') {
        // Ensure flightPackageId is a valid non-empty string
        const flightPackageIdStr = reservationData.flightPackageId ? String(reservationData.flightPackageId).trim() : '';
        if (!flightPackageIdStr || flightPackageIdStr === 'null' || flightPackageIdStr === 'undefined') {
            console.error('[Reservation] Invalid flightPackageId:', {
                original: reservationData.flightPackageId,
                type: typeof reservationData.flightPackageId,
                stringified: flightPackageIdStr
            });
            throw new Error('Flight Package ID is required for Flight Package reservations');
        }
        payload.flightPackageId = flightPackageIdStr;
        
        // Add optional city/country for flight packages
        if (reservationData.city) {
            payload.city = reservationData.city;
        }
        if (reservationData.country) {
            payload.country = reservationData.country;
        }
        if (reservationData.hotelName) {
            payload.hotelName = reservationData.hotelName; // Use as flight description
        }
    }

    if (reservationData.reservationType === 'GroupProgram') {
        // Ensure groupProgramId is a valid non-empty string
        const groupProgramIdStr = reservationData.groupProgramId ? String(reservationData.groupProgramId).trim() : '';
        if (!groupProgramIdStr || groupProgramIdStr === 'null' || groupProgramIdStr === 'undefined') {
            console.error('[Reservation] Invalid groupProgramId:', {
                original: reservationData.groupProgramId,
                type: typeof reservationData.groupProgramId,
                stringified: groupProgramIdStr
            });
            throw new Error('Group Program ID is required for Group Program reservations');
        }
        
        // For GroupProgram, we'll use FlightPackage type temporarily and use FlightPackageId field
        // The backend will need to be updated to support GroupProgram properly
        payload.reservationType = 'FlightPackage'; // Temporary: use FlightPackage type
        payload.flightPackageId = groupProgramIdStr; // Use FlightPackageId field to store groupProgramId
        
        // Add optional city/country for group programs
        if (reservationData.city) {
            payload.city = reservationData.city;
        }
        if (reservationData.country) {
            payload.country = reservationData.country;
        }
        if (reservationData.programName || reservationData.hotelName) {
            payload.hotelName = reservationData.programName || reservationData.hotelName; // Use as program name
        }
    }

    // Log the payload for debugging
    console.log('[Reservation] Sending payload:', JSON.stringify(payload, null, 2));

    try {
        const response = await fetch(`${API_BASE_URL}/payment/create-hotel-reservation`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            let errorData = {};
            try {
                const responseText = await response.text();
                console.error('[Reservation] Error response text:', responseText);
                if (responseText) {
                    errorData = JSON.parse(responseText);
                }
            } catch (parseError) {
                console.error('[Reservation] Failed to parse error response:', parseError);
            }
            
            // Try multiple possible error message fields
            const errorMessage = errorData.message || 
                                errorData.Message || 
                                errorData.error ||
                                errorData.Error ||
                                `HTTP ${response.status}: ${response.statusText}`;
            
            console.error('[Reservation] Error details:', {
                status: response.status,
                statusText: response.statusText,
                errorData: errorData,
                errorMessage: errorMessage
            });
            throw new Error(errorMessage);
        }

        const data = await response.json();
        
        if (!data.success) {
            // Extract message from response
            const errorMessage = data.message || data.Message || 'Failed to create reservation';
            throw new Error(errorMessage);
        }

        return data;
    } catch (error) {
        console.error('Error creating reservation:', error);
        throw error;
    }
}

/**
 * Creates a payment and redirects to payment gateway
 * @param {Object} paymentData - Payment data
 * @returns {Promise<Object>} Payment response with formUrl
 */
async function createPayment(paymentData) {
    const {
        amount,
        currency = 'IQD',
        locale = 'ar_IQ',
        invoiceId,
        finishPaymentUrl,
        notificationUrl,
        ...additionalData
    } = paymentData;

    const finishUrl = finishPaymentUrl || `${window.location.origin}/payment-finish.html?invoiceId=${encodeURIComponent(invoiceId)}`;
    const notifyUrl = notificationUrl || `${API_BASE_URL}/payment/webhook`;

    const payload = {
        amount,
        currency,
        locale,
        finishPaymentUrl: finishUrl,
        notificationUrl: notifyUrl,
        invoiceId,
        ...additionalData
    };

    try {
        const response = await fetch(`${API_BASE_URL}/payment/create-payment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `HTTP ${response.status}`);
        }

        const data = await response.json();
        
        if (!data.success || !data.formUrl) {
            throw new Error(data.message || 'Failed to create payment');
        }

        return data;
    } catch (error) {
        console.error('Error creating payment:', error);
        throw error;
    }
}

/**
 * Complete reservation and payment flow
 * @param {Object} reservationData - Reservation data
 * @param {Object} options - Additional options
 * @returns {Promise<void>}
 */
async function completeReservationFlow(reservationData, options = {}) {
    try {
        // Step 0: Check daily reservation limit BEFORE creating reservation
        console.log('[Reservation] Checking daily reservation limit...');
        try {
            const limitCheckResponse = await fetch(`${API_BASE_URL}/payment/check-reservation-limit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount: reservationData.amount })
            });
            
            if (limitCheckResponse.ok) {
                const limitData = await limitCheckResponse.json();
                if (!limitData.allowed) {
                    const errorMessage = limitData.message || 'Sorry, we can\'t accept any reservation today. The daily limit has been reached. Please try again tomorrow.';
                    console.warn('[Reservation] Daily limit reached. Current total:', limitData.currentTotal, 'Limit:', limitData.limit);
                    throw new Error(errorMessage);
                }
                console.log('[Reservation] ✓ Daily limit check passed. Remaining:', limitData.remaining);
            } else {
                console.warn('[Reservation] Failed to check limit, proceeding anyway...');
                // Continue if limit check fails (don't block reservation)
            }
        } catch (limitError) {
            // If limit check fails with an error (like limit reached or disabled), throw it
            const errorMsg = limitError.message?.toLowerCase() || '';
            if (errorMsg.includes('daily limit') || 
                errorMsg.includes("can't accept") || 
                errorMsg.includes('limit has been reached') ||
                errorMsg.includes('try again tomorrow') ||
                errorMsg.includes('reservations are currently disabled') ||
                errorMsg.includes('reservations disabled') ||
                errorMsg.includes('try again later')) {
                throw limitError;
            }
            // Otherwise, continue (limit check endpoint might be down)
            console.warn('[Reservation] Limit check error, proceeding:', limitError.message);
        }
        
        // Step 1: Create reservation
        const reservationResult = await createReservation(reservationData);
        
        const invoiceId = reservationResult.invoiceId;
        const paymentId = reservationResult.paymentId;

        // Store reservation info for later use
        // Keep original reservation type for display (GroupProgram), not the mapped type (FlightPackage)
        const pendingReservation = {
            invoiceId,
            paymentId,
            reservationType: reservationData.reservationType, // Keep original type (GroupProgram) for display
            amount: reservationData.amount,
            customerName: reservationData.customerName?.trim() || '',
            customerPhone: reservationData.customerPhone?.trim() || '',
            customerEmail: reservationData.customerEmail?.trim() || '',
            timestamp: new Date().toISOString(),
            ...reservationData
        };

        localStorage.setItem('lastReservation', JSON.stringify(pendingReservation));

        // Step 2: Create payment
        const paymentResult = await createPayment({
            amount: reservationData.amount,
            invoiceId,
            ...options.paymentData
        });

        // Step 3: Redirect to payment gateway
        if (options.onSuccess) {
            options.onSuccess(paymentResult);
        } else {
            window.location.href = paymentResult.formUrl;
        }
    } catch (error) {
        if (options.onError) {
            options.onError(error);
        } else {
            throw error;
        }
    }
}

/**
 * Downloads invoice PDF for a reservation
 * @param {string} invoiceId - Optional invoice ID. If not provided, gets from localStorage
 */
function downloadInvoice(invoiceId) {
    try {
        // Get invoice ID from parameter or localStorage
        let targetInvoiceId = invoiceId;
        
        if (!targetInvoiceId) {
            const reservation = JSON.parse(localStorage.getItem('lastReservation') || '{}');
            targetInvoiceId = reservation.invoiceId;
        }

        if (!targetInvoiceId) {
            console.error('Invoice ID not found');
            alert('Invoice not found. Please complete a reservation first.');
            return;
        }

        // Build PDF URL and open in new tab/window
        const pdfUrl = `${API_BASE_URL}/payment/invoice/${encodeURIComponent(targetInvoiceId)}/pdf`;
        window.open(pdfUrl, '_blank');
    } catch (error) {
        console.error('Error downloading invoice:', error);
        alert('Failed to download invoice. Please try again later.');
    }
}

/**
 * Shows success modal with invoice ID
 * @param {string} invoiceId - Invoice ID to display
 */
function showSuccessModal(invoiceId) {
    const invoiceIdElement = document.getElementById('successInvoiceId');
    if (invoiceIdElement) {
        invoiceIdElement.textContent = invoiceId;
    }
    
    const successModal = new bootstrap.Modal(document.getElementById('successModal'));
    successModal.show();
}

// Export functions and constants
window.reservationUtils = {
    validateReservation,
    createReservation,
    createPayment,
    completeReservationFlow,
    downloadInvoice,
    showSuccessModal,
    API_BASE_URL
};

// Make downloadInvoice globally available
window.downloadInvoice = downloadInvoice;

