// TORCH ATL Member Portal - Application Logic

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    // Hide preloader after short delay
    setTimeout(() => {
        document.getElementById('preloader').classList.add('hidden');
    }, 1500);

    // Check for website login redirect
    checkWebsiteLogin();

    // Check for existing session
    if (loadData() && currentMember) {
        showPortal();
    }

    // Setup navigation
    setupNavigation();

    // Setup booking form listeners
    setupBookingListeners();
});

// Check for login from main website
function checkWebsiteLogin() {
    const loginEmail = localStorage.getItem('torch_current_member');
    const loginTimestamp = localStorage.getItem('torch_login_timestamp');

    if (loginEmail && loginTimestamp) {
        // Check if login is recent (within 5 minutes)
        const elapsed = Date.now() - parseInt(loginTimestamp);
        const fiveMinutes = 5 * 60 * 1000;

        if (elapsed < fiveMinutes) {
            // Valid website login - authenticate member
            const member = DEMO_MEMBERS[loginEmail];

            if (member) {
                currentMember = member;
                saveData();

                // Clear the website login tokens
                localStorage.removeItem('torch_current_member');
                localStorage.removeItem('torch_login_timestamp');

                console.log('[TORCH] Website login authenticated:', member.name);

                // Show welcome toast after portal loads
                setTimeout(() => {
                    showToast('Welcome back, ' + member.name.split(' ')[0] + '!', 'success');
                }, 500);
            }
        } else {
            // Login expired - clear tokens
            localStorage.removeItem('torch_current_member');
            localStorage.removeItem('torch_login_timestamp');
        }
    }
}

// Setup Navigation
function setupNavigation() {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = link.dataset.section;
            showSection(section);

            // Update active state
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            link.classList.add('active');
        });
    });
}

// Handle Login
function handleLogin(event) {
    event.preventDefault();

    const email = document.getElementById('login-email').value.toLowerCase();
    const code = document.getElementById('login-code').value;

    // Check credentials
    const member = DEMO_MEMBERS[email];

    if (member && member.accessCode === code) {
        currentMember = member;
        saveData();
        showPortal();
        showToast('Welcome back, ' + member.name.split(' ')[0] + '!', 'success');
    } else {
        showToast('Invalid credentials. Please try again.', 'error');
    }
}

// Show Portal
function showPortal() {
    try {
        document.getElementById('login-screen').classList.remove('active');
        document.getElementById('portal-screen').classList.add('active');
        document.getElementById('portal-screen').style.display = 'block';
        populateDashboard();
        renderCalendar();
        populateGuestSessions();
        populateRegisteredGuests();
        populateSessionHistory();
        populateBilling();
    } catch (error) {
        console.error('[TORCH] Portal error:', error);
        // Still show the portal even if there's an error
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('portal-screen').style.display = 'block';
    }
}

// Logout
function logout() {
    clearSession();
    document.getElementById('portal-screen').classList.remove('active');
    document.getElementById('login-screen').classList.add('active');
    document.getElementById('login-form').reset();
    showToast('You have been logged out.', 'info');
}

// Show Section
function showSection(sectionId) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.getElementById(sectionId).classList.add('active');

    // Update nav
    document.querySelectorAll('.nav-link').forEach(l => {
        l.classList.toggle('active', l.dataset.section === sectionId);
    });
}

// Populate Dashboard
function populateDashboard() {
    if (!currentMember) return;

    const tier = TIERS[currentMember.tier];
    const hoursRemaining = tier.hours - currentMember.hoursUsed - currentMember.hoursScheduled;

    // Header info
    document.getElementById('header-member-name').textContent = currentMember.name.split(' ')[0];
    document.getElementById('header-member-tier').textContent = currentMember.tier;

    // Welcome banner
    document.getElementById('welcome-name').textContent = currentMember.name.split(' ')[0];
    document.getElementById('hours-remaining').textContent = hoursRemaining;

    // Next session
    const nextSession = currentMember.sessions.find(s => new Date(s.date) >= new Date());
    if (nextSession) {
        const date = new Date(nextSession.date);
        document.getElementById('next-session').textContent = formatShortDate(date);
    } else {
        document.getElementById('next-session').textContent = 'None';
    }

    // Membership card
    document.getElementById('tier-badge').textContent = currentMember.tier.toUpperCase();
    document.getElementById('member-avatar').textContent = getInitials(currentMember.name);
    document.getElementById('member-full-name').textContent = currentMember.name;
    document.getElementById('member-since').textContent = 'Member since ' + formatMonthYear(new Date(currentMember.joinDate));
    document.getElementById('monthly-hours').textContent = tier.hours;
    document.getElementById('booking-window').textContent = tier.bookingWindow;
    document.getElementById('guest-limit').textContent = tier.guestLimit;
    document.getElementById('access-code').textContent = '••••' + currentMember.accessCode.slice(-4);

    // Hours circle
    const usedPercent = (currentMember.hoursUsed / tier.hours) * 100;
    const circumference = 2 * Math.PI * 45;
    const offset = circumference - (usedPercent / 100) * circumference;

    document.getElementById('hours-progress').style.strokeDasharray = circumference;
    document.getElementById('hours-progress').style.strokeDashoffset = offset;
    document.getElementById('hours-used').textContent = currentMember.hoursUsed;
    document.getElementById('hours-total').textContent = tier.hours;

    // Hours breakdown
    document.getElementById('breakdown-used').textContent = currentMember.hoursUsed + ' hrs';
    document.getElementById('breakdown-scheduled').textContent = currentMember.hoursScheduled + ' hrs';
    document.getElementById('breakdown-available').textContent = hoursRemaining + ' hrs';

    // Upcoming sessions
    const upcomingHtml = currentMember.sessions.map(s => `
        <div class="session-item">
            <div>
                <div class="session-date">${formatDate(new Date(s.date))}</div>
                <div class="session-time">${formatTime(s.startTime)} - ${formatTime(s.endTime)}</div>
            </div>
            <span class="session-hours">${s.hours} hrs</span>
        </div>
    `).join('');
    document.getElementById('upcoming-list').innerHTML = upcomingHtml || '<p style="color: var(--text-muted); text-align: center; padding: 20px;">No upcoming sessions</p>';

    // Hours page stats
    document.getElementById('hours-remaining-big').textContent = hoursRemaining;
    document.getElementById('stat-allocated').textContent = tier.hours;
    document.getElementById('stat-used').textContent = currentMember.hoursUsed;
    document.getElementById('stat-scheduled').textContent = currentMember.hoursScheduled;
    document.getElementById('stat-available').textContent = hoursRemaining;

    // Large hours circle
    const progressLarge = document.getElementById('hours-progress-large');
    if (progressLarge) {
        progressLarge.style.strokeDasharray = circumference;
        progressLarge.style.strokeDashoffset = offset;
    }
}

// Render Calendar
function renderCalendar() {
    const year = currentCalendarMonth.getFullYear();
    const month = currentCalendarMonth.getMonth();

    document.getElementById('calendar-month-year').textContent =
        new Date(year, month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    let html = '';
    // Use a date in March 2026 for demo purposes
    const today = new Date(2026, 2, 15);

    // Previous month days
    for (let i = firstDay - 1; i >= 0; i--) {
        const day = daysInPrevMonth - i;
        html += `<div class="calendar-day other-month disabled">${day}</div>`;
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const dateStr = formatDateISO(date);
        const isPast = date < new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const isToday = date.toDateString() === today.toDateString();
        const isBooked = currentMember?.sessions.some(s => s.date === dateStr);
        const isSelected = selectedDate === dateStr;

        let classes = 'calendar-day';
        if (isPast) classes += ' disabled';
        if (isToday) classes += ' today';
        if (isBooked) classes += ' booked';
        if (isSelected) classes += ' selected';

        html += `<div class="${classes}" onclick="selectDate('${dateStr}', ${!isPast})">${day}</div>`;
    }

    // Next month days
    const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;
    const remainingCells = totalCells - firstDay - daysInMonth;
    for (let i = 1; i <= remainingCells; i++) {
        html += `<div class="calendar-day other-month disabled">${i}</div>`;
    }

    document.getElementById('calendar-days').innerHTML = html;
}

// Change Calendar Month
function changeCalendarMonth(delta) {
    currentCalendarMonth.setMonth(currentCalendarMonth.getMonth() + delta);
    renderCalendar();
}

// Select Date
function selectDate(dateStr, enabled) {
    if (!enabled) return;

    selectedDate = dateStr;
    renderCalendar();

    const date = new Date(dateStr);
    document.getElementById('selected-date-text').textContent =
        date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

// Setup Booking Listeners
function setupBookingListeners() {
    const startSelect = document.getElementById('booking-start');
    const endSelect = document.getElementById('booking-end');

    if (startSelect && endSelect) {
        startSelect.addEventListener('change', updateBookingSummary);
        endSelect.addEventListener('change', updateBookingSummary);
    }
}

// Update Booking Summary
function updateBookingSummary() {
    const startTime = document.getElementById('booking-start').value;
    const endTime = document.getElementById('booking-end').value;

    if (startTime && endTime) {
        const start = parseInt(startTime.split(':')[0]);
        let end = parseInt(endTime.split(':')[0]);
        if (end < start) end += 24; // Handle overnight sessions

        const hours = end - start;
        document.getElementById('summary-duration').textContent = hours + ' hours';

        if (currentMember) {
            const tier = TIERS[currentMember.tier];
            const remaining = tier.hours - currentMember.hoursUsed - currentMember.hoursScheduled - hours;
            document.getElementById('summary-remaining').textContent = remaining + ' hours remaining';
        }
    }
}

// Submit Booking
function submitBooking(event) {
    event.preventDefault();

    if (!selectedDate) {
        showToast('Please select a date first.', 'error');
        return;
    }

    const startTime = document.getElementById('booking-start').value;
    const endTime = document.getElementById('booking-end').value;
    const type = document.getElementById('booking-type').value;
    const guests = parseInt(document.getElementById('booking-guests').value);
    const notes = document.getElementById('booking-notes').value;

    if (!startTime || !endTime) {
        showToast('Please select start and end times.', 'error');
        return;
    }

    // Calculate hours
    const start = parseInt(startTime.split(':')[0]);
    let end = parseInt(endTime.split(':')[0]);
    if (end < start) end += 24;
    const hours = end - start;

    // Check guest limit
    const tier = TIERS[currentMember.tier];
    if (guests > tier.guestLimit) {
        showToast(`Your tier allows maximum ${tier.guestLimit} guests.`, 'error');
        return;
    }

    // Check hours
    const available = tier.hours - currentMember.hoursUsed - currentMember.hoursScheduled;
    if (hours > available) {
        showToast(`You only have ${available} hours available.`, 'error');
        return;
    }

    // Create booking
    const booking = {
        id: 'S' + Date.now(),
        date: selectedDate,
        startTime: startTime,
        endTime: endTime,
        type: type,
        hours: hours,
        guests: guests,
        notes: notes,
        status: 'confirmed'
    };

    currentMember.sessions.push(booking);
    currentMember.hoursScheduled += hours;
    saveData();

    // Reset form
    document.getElementById('booking-form').reset();
    selectedDate = null;
    document.getElementById('selected-date-text').textContent = 'Select a date';

    showToast('Session booked successfully!', 'success');
    populateDashboard();
    renderCalendar();
    populateGuestSessions();
}

// Populate Guest Sessions Dropdown
function populateGuestSessions() {
    if (!currentMember) return;

    const select = document.getElementById('guest-session');
    if (!select) return;

    const options = currentMember.sessions.map(s =>
        `<option value="${s.id}">${formatDate(new Date(s.date))} - ${formatTime(s.startTime)}</option>`
    ).join('');

    select.innerHTML = '<option value="">Choose a session</option>' + options;
}

// Register Guest
function registerGuest(event) {
    event.preventDefault();

    const sessionId = document.getElementById('guest-session').value;
    const name = document.getElementById('guest-name').value;
    const email = document.getElementById('guest-email').value;
    const phone = document.getElementById('guest-phone').value;

    if (!sessionId || !name) {
        showToast('Please select a session and enter guest name.', 'error');
        return;
    }

    // Check guest limit
    const session = currentMember.sessions.find(s => s.id === sessionId);
    const tier = TIERS[currentMember.tier];
    const currentGuests = currentMember.guests.filter(g => g.session === sessionId).length;

    if (currentGuests >= tier.guestLimit) {
        showToast(`Maximum ${tier.guestLimit} guests allowed for your tier.`, 'error');
        return;
    }

    // Add guest
    currentMember.guests.push({
        name: name,
        session: sessionId,
        email: email || '',
        phone: phone || ''
    });

    saveData();
    document.getElementById('guest-form').reset();
    showToast('Guest registered successfully!', 'success');
    populateRegisteredGuests();
}

// Populate Registered Guests
function populateRegisteredGuests() {
    if (!currentMember) return;

    const container = document.getElementById('registered-guests');
    if (!container) return;

    if (currentMember.guests.length === 0) {
        container.innerHTML = '<p style="color: var(--text-muted); text-align: center; padding: 20px;">No guests registered</p>';
        return;
    }

    const html = currentMember.guests.map(g => {
        const session = currentMember.sessions.find(s => s.id === g.session);
        return `
            <div class="guest-item">
                <div>
                    <div class="guest-name">${g.name}</div>
                    <div class="guest-session">${session ? formatDate(new Date(session.date)) : 'Unknown session'}</div>
                </div>
                <button class="btn-icon" onclick="removeGuest('${g.name}', '${g.session}')">✕</button>
            </div>
        `;
    }).join('');

    container.innerHTML = html;
}

// Remove Guest
function removeGuest(name, sessionId) {
    currentMember.guests = currentMember.guests.filter(g => !(g.name === name && g.session === sessionId));
    saveData();
    populateRegisteredGuests();
    showToast('Guest removed.', 'info');
}

// Populate Session History
function populateSessionHistory() {
    if (!currentMember) return;

    const container = document.getElementById('session-history');
    if (!container) return;

    if (currentMember.history.length === 0) {
        container.innerHTML = '<p style="color: var(--text-muted); text-align: center; padding: 20px;">No session history</p>';
        return;
    }

    const html = currentMember.history.map(h => `
        <div class="history-item">
            <div>
                <div class="history-date">${formatDate(new Date(h.date))}</div>
                <div class="history-type">${h.type}</div>
            </div>
            <span class="history-hours">${h.hours} hrs</span>
        </div>
    `).join('');

    container.innerHTML = html;
}

// Concierge Functions
function openConcierge() {
    document.getElementById('concierge-modal').classList.add('active');
}

function closeConcierge() {
    document.getElementById('concierge-modal').classList.remove('active');
}

function sendMessage(event) {
    event.preventDefault();

    const input = document.getElementById('chat-input');
    const message = input.value.trim();

    if (!message) return;

    // Add user message
    addChatMessage(message, 'user');
    input.value = '';

    // Generate response
    setTimeout(() => {
        const response = generateConciergeResponse(message);
        addChatMessage(response, 'bot');
    }, 500);
}

function addChatMessage(text, sender) {
    const container = document.getElementById('chat-messages');
    const div = document.createElement('div');
    div.className = `message ${sender}`;
    div.innerHTML = `<p>${text}</p>`;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}

function generateConciergeResponse(message) {
    const lower = message.toLowerCase();

    if (lower.includes('book') || lower.includes('session') || lower.includes('reserve')) {
        return CONCIERGE_RESPONSES.booking[Math.floor(Math.random() * CONCIERGE_RESPONSES.booking.length)];
    }
    if (lower.includes('hour') || lower.includes('time') || lower.includes('allocation')) {
        return CONCIERGE_RESPONSES.hours[Math.floor(Math.random() * CONCIERGE_RESPONSES.hours.length)];
    }
    if (lower.includes('guest') || lower.includes('visitor') || lower.includes('bring')) {
        return CONCIERGE_RESPONSES.guests[Math.floor(Math.random() * CONCIERGE_RESPONSES.guests.length)];
    }
    if (lower.includes('rule') || lower.includes('policy') || lower.includes('allowed')) {
        return CONCIERGE_RESPONSES.rules[Math.floor(Math.random() * CONCIERGE_RESPONSES.rules.length)];
    }
    if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) {
        return CONCIERGE_RESPONSES.greetings[Math.floor(Math.random() * CONCIERGE_RESPONSES.greetings.length)];
    }

    return CONCIERGE_RESPONSES.general[Math.floor(Math.random() * CONCIERGE_RESPONSES.general.length)];
}

// Toast Notifications
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <span>${type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}</span>
        <span>${message}</span>
    `;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Utility Functions
function getInitials(name) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
}

function formatDate(date) {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatShortDate(date) {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatMonthYear(date) {
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

function formatDateISO(date) {
    return date.toISOString().split('T')[0];
}

function formatTime(timeStr) {
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes || '00'} ${ampm}`;
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal.active').forEach(modal => {
            modal.classList.remove('active');
        });
    }
});

// ============================================
// BILLING FUNCTIONS
// ============================================

// Populate billing section
function populateBilling() {
    if (!currentMember) return;

    const tier = TIERS[currentMember.tier];
    const rate = currentMember.founding ? tier.foundingRate : tier.monthlyRate;

    // Update billing display
    const tierNameEl = document.getElementById('billing-tier-name');
    const amountEl = document.getElementById('billing-amount');
    const memberSinceEl = document.getElementById('billing-member-since');

    if (tierNameEl) tierNameEl.textContent = currentMember.tier + ' Membership';
    if (amountEl) amountEl.textContent = '$' + rate.toLocaleString();
    if (memberSinceEl) memberSinceEl.textContent = formatDate(new Date(currentMember.joinDate));
}

// Show update payment form
function showUpdatePayment() {
    document.getElementById('payment-method-display').style.display = 'none';
    document.getElementById('update-payment-form').style.display = 'block';
}

// Hide update payment form
function hideUpdatePayment() {
    document.getElementById('payment-method-display').style.display = 'flex';
    document.getElementById('update-payment-form').style.display = 'none';
}

// Save payment method
function savePaymentMethod() {
    const cardNumber = document.getElementById('new-card-number').value;
    const expiry = document.getElementById('new-card-expiry').value;
    const cvv = document.getElementById('new-card-cvv').value;
    const name = document.getElementById('new-card-name').value;

    if (!cardNumber || !expiry || !cvv || !name) {
        showToast('Please fill in all card details.', 'error');
        return;
    }

    // In production, this would call Square API
    // For demo, we'll just show success
    showToast('Payment method updated successfully!', 'success');
    hideUpdatePayment();

    // Update display with last 4 digits
    const last4 = cardNumber.replace(/\s/g, '').slice(-4);
    document.querySelector('.card-number').textContent = '•••• •••• •••• ' + last4;
    document.querySelector('.card-expiry').textContent = 'Expires ' + expiry;
}

// Download invoices
function downloadInvoices() {
    showToast('Preparing invoice download...', 'info');

    // In production, this would generate/download PDFs
    setTimeout(() => {
        showToast('Invoices downloaded to your device.', 'success');
    }, 1500);
}

// Format card number with spaces
document.addEventListener('DOMContentLoaded', () => {
    const cardInput = document.getElementById('new-card-number');
    if (cardInput) {
        cardInput.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\s/g, '').replace(/\D/g, '');
            value = value.match(/.{1,4}/g)?.join(' ') || value;
            e.target.value = value;
        });
    }

    const expiryInput = document.getElementById('new-card-expiry');
    if (expiryInput) {
        expiryInput.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length >= 2) {
                value = value.slice(0, 2) + '/' + value.slice(2);
            }
            e.target.value = value;
        });
    }
});

console.log('[TORCH] Member Portal initialized');
console.log('[TORCH] Demo login: member@torch.com / DEMO2026');
console.log('[TORCH] Owner login: joi@torchatl.com / JOI2026');
