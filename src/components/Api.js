// Api.js
const MOCK_MODE = false; // Set to false when deploying connected to GAS
const GAS_URL = "https://script.google.com/macros/s/AKfycbxF8mOPnApcBJPARmbpR98zHPubrYzqXo21ODkFsGWlNQJUlaV54t6_RSNY6fVTTrlt/exec";

const MOCK_DATA = {
  users: ['user1', 'user2'],
  availability: [
    { date: '2026-01-10', userId: 'user1' },
    { date: '2026-01-12', userId: 'user2' },
    { date: '2026-01-15', userId: 'user1' },
    { date: '2026-01-15', userId: 'user2' } // Match
  ]
};

// Simulate network delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export async function loginUser(userId) {
  if (MOCK_MODE) {
    await delay(500);
    if (MOCK_DATA.users.includes(userId)) {
      return { success: true, userId };
    }
    return { success: false, message: "Invalid ID (Mock)" };
  }

  try {
    const response = await fetch(GAS_URL, {
      method: "POST",
      body: JSON.stringify({ action: "login", userId })
    });
    return await response.json();
  } catch (e) {
    console.error(e);
    return { success: false, message: "Network Error" };
  }
}

export async function fetchAvailability() {
  if (MOCK_MODE) {
    await delay(500);
    return { availability: [...MOCK_DATA.availability] };
  }

  try {
    const response = await fetch(GAS_URL, {
      method: "POST",
      body: JSON.stringify({ action: "sync" })
    });
    return await response.json();
  } catch (e) {
    console.error(e);
    return { availability: [] };
  }
}

export async function toggleAvailability(userId, date) {
  if (MOCK_MODE) {
    await delay(300);
    const index = MOCK_DATA.availability.findIndex(
      item => item.date === date && item.userId === userId
    );

    let status = 'added';
    if (index > -1) {
      MOCK_DATA.availability.splice(index, 1);
      status = 'removed';
    } else {
      MOCK_DATA.availability.push({ date, userId });
      status = 'added';
    }
    return { success: true, status, date, userId };
  }

  try {
    const response = await fetch(GAS_URL, {
      method: "POST",
      body: JSON.stringify({ action: "update", userId, date })
    });
    return await response.json();
  } catch (e) {
    console.error(e);
    return { success: false, message: "Network Error" };
  }
}
