// TORCH ATL Member Portal - Square Billing Integration
// =====================================================

// Square Configuration (loaded from localStorage or defaults)
const SquareBilling = {
    // Configuration
    config: {
        applicationId: '',
        locationId: '',
        environment: 'sandbox'
    },

    // State
    payments: null,
    card: null,
    initialized: false,

    // Load configuration from localStorage (shared with Operations Suite)
    loadConfig: function() {
        const savedConfig = localStorage.getItem('torch_square_config');
        if (savedConfig) {
            const config = JSON.parse(savedConfig);
            this.config.applicationId = config.applicationId || '';
            this.config.locationId = config.locationId || '';
            this.config.environment = config.environment || 'sandbox';
            return true;
        }
        return false;
    },

    // Initialize Square Payments
    init: async function() {
        // Load config
        if (!this.loadConfig()) {
            console.warn('[Square] No configuration found. Please configure Square in Operations Suite.');
            this.showConfigNotice();
            return false;
        }

        if (!this.config.applicationId) {
            console.warn('[Square] Application ID not set.');
            this.showConfigNotice();
            return false;
        }

        // Check if Square SDK is loaded
        if (typeof Square === 'undefined') {
            console.error('[Square] SDK not loaded.');
            return false;
        }

        try {
            // Initialize Square Payments
            this.payments = Square.payments(this.config.applicationId, this.config.locationId);
            this.initialized = true;
            console.log('[Square] Payments initialized successfully');
            return true;
        } catch (error) {
            console.error('[Square] Failed to initialize:', error);
            return false;
        }
    },

    // Show configuration notice
    showConfigNotice: function() {
        const notice = document.getElementById('square-config-notice');
        if (notice) {
            notice.style.display = 'block';
        }
    },

    // Initialize card input
    initCard: async function() {
        if (!this.initialized) {
            const success = await this.init();
            if (!success) return null;
        }

        try {
            // Create card payment method
            this.card = await this.payments.card();

            // Attach to container
            await this.card.attach('#card-container');

            console.log('[Square] Card input attached');
            return this.card;
        } catch (error) {
            console.error('[Square] Failed to initialize card:', error);
            this.showError('Failed to load payment form. Please try again.');
            return null;
        }
    },

    // Tokenize card
    tokenizeCard: async function() {
        if (!this.card) {
            this.showError('Payment form not initialized.');
            return null;
        }

        try {
            const result = await this.card.tokenize();

            if (result.status === 'OK') {
                console.log('[Square] Card tokenized:', result.token);
                return result.token;
            } else {
                let errorMessage = 'Payment failed.';
                if (result.errors && result.errors.length > 0) {
                    errorMessage = result.errors.map(e => e.message).join(', ');
                }
                this.showError(errorMessage);
                return null;
            }
        } catch (error) {
            console.error('[Square] Tokenization failed:', error);
            this.showError('Failed to process card. Please try again.');
            return null;
        }
    },

    // Save card on file for customer
    saveCardOnFile: async function(token, customerId) {
        const baseUrl = this.config.environment === 'production'
            ? 'https://connect.squareup.com/v2'
            : 'https://connect.squareupsandbox.com/v2';

        // Get access token from config
        const savedConfig = localStorage.getItem('torch_square_config');
        if (!savedConfig) {
            this.showError('Square not configured.');
            return null;
        }

        const config = JSON.parse(savedConfig);
        if (!config.accessToken) {
            this.showError('Square access token not set.');
            return null;
        }

        try {
            const response = await fetch(`${baseUrl}/cards`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${config.accessToken}`,
                    'Content-Type': 'application/json',
                    'Square-Version': '2024-01-18'
                },
                body: JSON.stringify({
                    idempotency_key: `torch-card-${Date.now()}`,
                    source_id: token,
                    card: {
                        customer_id: customerId
                    }
                })
            });

            const data = await response.json();

            if (response.ok) {
                console.log('[Square] Card saved:', data.card);
                return data.card;
            } else {
                const errorMsg = data.errors?.[0]?.detail || 'Failed to save card.';
                this.showError(errorMsg);
                return null;
            }
        } catch (error) {
            console.error('[Square] Save card failed:', error);
            this.showError('Network error. Please try again.');
            return null;
        }
    },

    // Create or get customer
    getOrCreateCustomer: async function(member) {
        const baseUrl = this.config.environment === 'production'
            ? 'https://connect.squareup.com/v2'
            : 'https://connect.squareupsandbox.com/v2';

        const savedConfig = localStorage.getItem('torch_square_config');
        if (!savedConfig) return null;

        const config = JSON.parse(savedConfig);
        if (!config.accessToken) return null;

        // First, search for existing customer
        try {
            const searchResponse = await fetch(`${baseUrl}/customers/search`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${config.accessToken}`,
                    'Content-Type': 'application/json',
                    'Square-Version': '2024-01-18'
                },
                body: JSON.stringify({
                    query: {
                        filter: {
                            email_address: {
                                exact: member.email
                            }
                        }
                    }
                })
            });

            const searchData = await searchResponse.json();

            if (searchData.customers && searchData.customers.length > 0) {
                console.log('[Square] Found existing customer');
                return searchData.customers[0];
            }

            // Create new customer
            const createResponse = await fetch(`${baseUrl}/customers`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${config.accessToken}`,
                    'Content-Type': 'application/json',
                    'Square-Version': '2024-01-18'
                },
                body: JSON.stringify({
                    idempotency_key: `torch-customer-${member.id}-${Date.now()}`,
                    given_name: member.name.split(' ')[0],
                    family_name: member.name.split(' ').slice(1).join(' '),
                    email_address: member.email,
                    phone_number: member.phone,
                    reference_id: `TORCH-${member.id}`,
                    note: `Tier: ${member.tier} | Founding: ${member.founding ? 'Yes' : 'No'}`
                })
            });

            const createData = await createResponse.json();

            if (createResponse.ok) {
                console.log('[Square] Created customer:', createData.customer);
                return createData.customer;
            }

            return null;
        } catch (error) {
            console.error('[Square] Customer operation failed:', error);
            return null;
        }
    },

    // Get customer's saved cards
    getCustomerCards: async function(customerId) {
        const baseUrl = this.config.environment === 'production'
            ? 'https://connect.squareup.com/v2'
            : 'https://connect.squareupsandbox.com/v2';

        const savedConfig = localStorage.getItem('torch_square_config');
        if (!savedConfig) return [];

        const config = JSON.parse(savedConfig);
        if (!config.accessToken) return [];

        try {
            const response = await fetch(`${baseUrl}/cards?customer_id=${customerId}`, {
                headers: {
                    'Authorization': `Bearer ${config.accessToken}`,
                    'Square-Version': '2024-01-18'
                }
            });

            const data = await response.json();
            return data.cards || [];
        } catch (error) {
            console.error('[Square] Get cards failed:', error);
            return [];
        }
    },

    // Show error message
    showError: function(message) {
        const errorEl = document.getElementById('card-errors');
        if (errorEl) {
            errorEl.textContent = message;
            errorEl.style.display = 'block';
        }
    },

    // Clear error message
    clearError: function() {
        const errorEl = document.getElementById('card-errors');
        if (errorEl) {
            errorEl.textContent = '';
            errorEl.style.display = 'none';
        }
    }
};

// Handle payment method submission
async function handlePaymentMethod() {
    const button = document.getElementById('card-button');
    button.disabled = true;
    button.textContent = 'Processing...';

    SquareBilling.clearError();

    try {
        // Tokenize the card
        const token = await SquareBilling.tokenizeCard();

        if (!token) {
            button.disabled = false;
            button.textContent = 'Save Card';
            return;
        }

        // Get or create customer in Square
        if (!currentMember) {
            SquareBilling.showError('Not logged in.');
            button.disabled = false;
            button.textContent = 'Save Card';
            return;
        }

        const customer = await SquareBilling.getOrCreateCustomer(currentMember);

        if (!customer) {
            SquareBilling.showError('Failed to create customer profile.');
            button.disabled = false;
            button.textContent = 'Save Card';
            return;
        }

        // Save card on file
        const card = await SquareBilling.saveCardOnFile(token, customer.id);

        if (card) {
            // Update UI
            updateCardDisplay(card);
            hideUpdatePayment();
            showToast('Payment method saved successfully!', 'success');

            // Store customer ID for future use
            currentMember.squareCustomerId = customer.id;
            saveData();
        }

    } catch (error) {
        console.error('[Square] Payment method error:', error);
        SquareBilling.showError('An error occurred. Please try again.');
    }

    button.disabled = false;
    button.textContent = 'Save Card';
}

// Update card display in UI
function updateCardDisplay(card) {
    const brandEl = document.querySelector('.card-brand');
    const numberEl = document.querySelector('.card-number');
    const expiryEl = document.querySelector('.card-expiry');

    if (brandEl) brandEl.textContent = card.card_brand || 'Card';
    if (numberEl) numberEl.textContent = `•••• •••• •••• ${card.last_4}`;
    if (expiryEl) expiryEl.textContent = `Expires ${card.exp_month}/${card.exp_year.toString().slice(-2)}`;
}

// Override showUpdatePayment to initialize Square card
const originalShowUpdatePayment = window.showUpdatePayment;
window.showUpdatePayment = async function() {
    document.getElementById('payment-method-display').style.display = 'none';
    document.getElementById('update-payment-form').style.display = 'block';

    // Initialize Square card input
    if (!SquareBilling.card) {
        await SquareBilling.initCard();
    }
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
    // Wait a bit for Square SDK to load
    setTimeout(async () => {
        await SquareBilling.init();
    }, 1000);
});

console.log('[Square Billing] Module loaded');
