function doGet(e) {
  return ContentService.createTextOutput("Date Adjustment API is running.");
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    
    if (action === 'login') {
      return handleLogin(data);
    } else if (action === 'sync') {
      return handleSync(data);
    } else if (action === 'update') {
      return handleUpdate(data);
    } else {
      return errorResponse("Invalid action");
    }
  } catch (error) {
    return errorResponse(error.toString());
  }
}

function handleLogin(data) {
  const userId = data.userId;
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Users');
  if (!sheet) return errorResponse("Users sheet not found");
  
  const users = sheet.getRange("A:A").getValues().flat(); // Assuming IDs in Col A
  // Filter out empty rows
  const validUsers = users.filter(String);
  
  if (validUsers.includes(userId)) {
     return successResponse({ success: true, userId: userId });
  } else {
     return successResponse({ success: false, message: "Invalid User ID" });
  }
}

function handleSync(data) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Availability');
  if (!sheet) return errorResponse("Availability sheet not found");
  
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return successResponse({ availability: [] }); // No data
  
  // Columns: A=Date (YYYY-MM-DD), B=UserID
  const values = sheet.getRange(2, 1, lastRow - 1, 2).getValues();
  
  const availability = values.map(row => ({
    date: formatDate(row[0]),
    userId: row[1]
  })).filter(item => item.date && item.userId); // Basic cleanup
  
  return successResponse({ availability: availability });
}

function handleUpdate(data) {
  const { userId, date } = data; // date string YYYY-MM-DD
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Availability');
  if (!sheet) return errorResponse("Availability sheet not found");
  
  // Check if exists
  const lastRow = sheet.getLastRow();
  let rowToDelete = -1;
  
  if (lastRow >= 2) {
    const values = sheet.getRange(2, 1, lastRow - 1, 2).getValues();
    for (let i = 0; i < values.length; i++) {
      const rowDate = formatDate(values[i][0]);
      const rowUser = values[i][1];
      if (rowDate === date && rowUser === userId) {
        rowToDelete = i + 2; // 2 accounts for header and 0-index
        break;
      }
    }
  }
  
  if (rowToDelete > 0) {
    // Remove (Toggle OFF)
    sheet.deleteRow(rowToDelete);
    return successResponse({ status: 'removed', date, userId });
  } else {
    // Add (Toggle ON)
    sheet.appendRow([date, userId]);
    return successResponse({ status: 'added', date, userId });
  }
}

// Helper to standardise date strings
function formatDate(dateObj) {
  if (!dateObj) return "";
  if (typeof dateObj === 'string') return dateObj; // Already string
  return Utilities.formatDate(dateObj, Session.getScriptTimeZone(), "yyyy-MM-dd");
}

function successResponse(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function errorResponse(message) {
  return ContentService.createTextOutput(JSON.stringify({ error: message }))
    .setMimeType(ContentService.MimeType.JSON);
}

function setup() {
  // Run this once to create sheets if needed
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss.getSheetByName('Users')) {
    const s = ss.insertSheet('Users');
    s.getRange('A1').setValue('UserID');
    s.getRange('A2').setValue('user1'); // Default
    s.getRange('A3').setValue('user2'); // Default
  }
  if (!ss.getSheetByName('Availability')) {
    const s = ss.insertSheet('Availability');
    s.getRange('A1').setValue('Date');
    s.getRange('B1').setValue('UserID');
  }
}
