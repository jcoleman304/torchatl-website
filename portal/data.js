// TORCH ATL Member Portal - Data Layer

// Membership Tier Configuration
const TIERS = {
    Session: {
        name: 'Session',
        monthlyRate: 2200,
        foundingRate: 1870,
        hours: 32,
        bookingWindow: 14,
        guestLimit: 2,
        overageRate: 69,
        priority: 4,
        color: '#8b5cf6'
    },
    Member: {
        name: 'Member',
        monthlyRate: 3500,
        foundingRate: 2975,
        hours: 64,
        bookingWindow: 30,
        guestLimit: 4,
        overageRate: 55,
        priority: 3,
        color: '#3b82f6'
    },
    Residency: {
        name: 'Residency',
        monthlyRate: 5000,
        foundingRate: 4250,
        hours: 120,
        bookingWindow: 60,
        guestLimit: 6,
        overageRate: 42,
        priority: 2,
        color: '#D4AF37'
    },
    Ambassador: {
        name: 'Ambassador',
        monthlyRate: 5000,
        foundingRate: 4250,
        hours: 120,
        bookingWindow: 90,
        guestLimit: 8,
        overageRate: 42,
        priority: 1,
        color: '#D4AF37'
    }
};

// Demo Member Data
const DEMO_MEMBERS = {
    'joi@torchatl.com': {
        id: 'TM000',
        email: 'joi@torchatl.com',
        accessCode: 'JOI2026',
        name: 'Joi Coleman',
        tier: 'Ambassador',
        founding: true,
        joinDate: '2026-03-15',
        phone: '(404) 555-0100',
        company: 'Torch Music Corporation',
        hoursUsed: 0,
        hoursScheduled: 0,
        sessions: [],
        guests: [],
        history: []
    },
    'derrick@example.com': {
        id: 'TM001',
        email: 'derrick@example.com',
        accessCode: 'TORCH2026',
        name: 'Derrick Milano',
        tier: 'Ambassador',
        founding: true,
        joinDate: '2026-03-15',
        phone: '(404) 555-0101',
        company: 'Milano Music Group',
        hoursUsed: 24,
        hoursScheduled: 16,
        sessions: [
            { id: 'S001', date: '2026-03-18', startTime: '14:00', endTime: '22:00', type: 'recording', hours: 8, status: 'confirmed' },
            { id: 'S002', date: '2026-03-22', startTime: '12:00', endTime: '20:00', type: 'writing', hours: 8, status: 'confirmed' }
        ],
        guests: [
            { name: 'Marcus Thompson', session: 'S001', email: 'marcus@email.com' },
            { name: 'Sarah Chen', session: 'S001', email: 'sarah@email.com' }
        ],
        history: [
            { date: '2026-03-10', type: 'Recording', hours: 8 },
            { date: '2026-03-08', type: 'Writing', hours: 6 },
            { date: '2026-03-05', type: 'Recording', hours: 10 }
        ]
    },
    'member@torch.com': {
        id: 'TM002',
        email: 'member@torch.com',
        accessCode: 'DEMO2026',
        name: 'Demo Member',
        tier: 'Member',
        founding: true,
        joinDate: '2026-03-15',
        phone: '(404) 555-0102',
        company: 'Independent',
        hoursUsed: 12,
        hoursScheduled: 8,
        sessions: [
            { id: 'S003', date: '2026-03-20', startTime: '10:00', endTime: '18:00', type: 'recording', hours: 8, status: 'confirmed' }
        ],
        guests: [],
        history: [
            { date: '2026-03-12', type: 'Recording', hours: 6 },
            { date: '2026-03-09', type: 'Mixing', hours: 6 }
        ]
    }
};

// Operating Hours
const OPERATING_HOURS = {
    start: 10, // 10 AM
    end: 26,   // 2 AM (next day)
    minSession: 4,
    maxSession: 12,
    transitionBuffer: 30 // minutes
};

// Announcements
const ANNOUNCEMENTS = [
    {
        date: '2026-02-09',
        title: 'Grand Opening: March 15, 2026',
        content: 'Founding members receive 15% off locked forever. Secure your spot now.'
    },
    {
        date: '2026-02-05',
        title: 'New Equipment Arriving',
        content: 'Upgraded monitoring system installation scheduled for late February.'
    },
    {
        date: '2026-01-28',
        title: 'Founding Member Applications',
        content: 'Limited spots available for founding members. Reach out to your sponsor.'
    }
];

// Concierge Responses
const CONCIERGE_RESPONSES = {
    greetings: [
        "Hello! I'm your Torch Concierge. How can I assist you today?",
        "Welcome back! What can I help you with?",
        "Good to see you! How may I be of service?"
    ],
    booking: [
        "I can help you with booking! You can use the 'Book Session' tab to select your preferred date and time. Would you like me to walk you through it?",
        "To book a session, navigate to the 'Book Session' tab, select your date on the calendar, then choose your preferred time slot. Your hours will be automatically deducted from your monthly allocation."
    ],
    hours: [
        "You can view your hour balance in the 'My Hours' tab. Remember, unused hours don't roll over to the next month, so plan your sessions accordingly!",
        "Your hours are tracked in real-time. Check the 'My Hours' section for a detailed breakdown of used, scheduled, and available hours."
    ],
    guests: [
        "All guests must be pre-registered at least 24 hours before your session. Use the 'Guests' tab to register them. Don't forget, your tier determines your guest limit!",
        "To register guests, go to the 'Guests' tab, select your upcoming session, and enter your guest's information. They'll need to show valid ID upon arrival."
    ],
    rules: [
        "Our house rules are designed to protect every member's experience. You can review them in the 'House Rules' tab. Key points: no walk-ins, pre-register guests, maintain privacy at all times.",
        "The most important rules to remember: always book in advance, register guests 24 hours before, never share our address, and respect other members' privacy."
    ],
    general: [
        "I'm here to help! You can ask me about booking sessions, checking your hours, registering guests, or understanding our house rules.",
        "Feel free to explore the portal. If you need any assistance, I'm always here. Is there something specific you'd like help with?"
    ]
};

// Current Member State (will be set on login)
let currentMember = null;
let selectedDate = null;
let currentCalendarMonth = new Date(2026, 2, 1); // March 2026

// Local Storage Keys
const STORAGE_KEYS = {
    currentMember: 'torch_current_member',
    bookings: 'torch_bookings',
    guests: 'torch_guests'
};

// Save to localStorage
function saveData() {
    if (currentMember) {
        localStorage.setItem(STORAGE_KEYS.currentMember, JSON.stringify(currentMember));
    }
}

// Load from localStorage
function loadData() {
    const saved = localStorage.getItem(STORAGE_KEYS.currentMember);
    if (saved) {
        currentMember = JSON.parse(saved);
        return true;
    }
    return false;
}

// Clear session
function clearSession() {
    currentMember = null;
    localStorage.removeItem(STORAGE_KEYS.currentMember);
}

console.log('[TORCH] Data layer initialized');
