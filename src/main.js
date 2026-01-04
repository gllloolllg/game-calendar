// main.js
import { getStoredUser, setStoredUser, renderLoginScreen } from './components/Auth.js';
import { loginUser, fetchAvailability, toggleAvailability } from './components/Api.js';
import { renderCalendar } from './components/Calendar.js';

const app = document.getElementById('app');

const state = {
    currentUserId: null,
    viewYear: new Date().getFullYear(),
    viewMonth: new Date().getMonth(), // 0-indexed
    availability: []
};

async function init() {
    const storedUser = getStoredUser();
    if (storedUser) {
        // Verify validity or just trust?
        // Let's verify silently.
        await attemptLogin(storedUser);
    } else {
        showLogin();
    }
}

function showLogin() {
    renderLoginScreen(app, async (userId) => {
        await attemptLogin(userId);
    });
}

async function attemptLogin(userId) {
    showLoading(true);
    const result = await loginUser(userId);
    showLoading(false);

    if (result.success) {
        state.currentUserId = userId;
        setStoredUser(userId);
        loadCalendarView();
    } else {
        localStorage.removeItem('date_app_user_id'); // Clear invalid token
        alert("ログイン失敗: " + (result.message || "IDが間違っています"));
        showLogin(); // Always show login screen on failure
    }
}

async function loadCalendarView() {
    showLoading(true);
    await refreshData();
    showLoading(false);
    render();
}

async function refreshData() {
    const res = await fetchAvailability();
    if (res.availability) {
        state.availability = res.availability;
    }
    render();
}

async function handleDateClick(date) {
    const { currentUserId, availability } = state;

    // 1. Optimistic Update
    const index = availability.findIndex(
        a => a.date === date && a.userId === currentUserId
    );

    if (index > -1) {
        // Remove
        state.availability.splice(index, 1);
    } else {
        // Add
        state.availability.push({ date, userId: currentUserId });
    }

    // 2. Render immediately
    render();

    // 3. Background Sync
    try {
        await toggleAvailability(currentUserId, date);
    } catch (e) {
        console.error("Sync failed", e);
    }
}

function render() {
    renderCalendar(
        app,
        {
            year: state.viewYear,
            month: state.viewMonth,
            availability: state.availability,
            currentUserId: state.currentUserId
        },
        (monthDelta) => {
            // Month Navigation
            state.viewMonth += monthDelta;
            if (state.viewMonth > 11) {
                state.viewMonth = 0;
                state.viewYear++;
            } else if (state.viewMonth < 0) {
                state.viewMonth = 11;
                state.viewYear--;
            }
            render();
        },
        (date) => {
            // Updated Callback for interactions
            handleDateClick(date);
        },
        () => {
            // Logout
            setStoredUser(null);
            localStorage.removeItem('date_app_user_id'); // Explicit
            state.currentUserId = null;
            state.availability = [];
            showLogin();
        }
    );
}

function showLoading(isLoading) {
    const existing = document.querySelector('.loading-overlay');
    if (isLoading) {
        if (!existing) {
            const overlay = document.createElement('div');
            overlay.className = 'loading-overlay';
            overlay.innerHTML = '<div class="spinner"></div>';
            app.appendChild(overlay);
        }
    } else {
        if (existing) existing.remove();
    }
}

init();
