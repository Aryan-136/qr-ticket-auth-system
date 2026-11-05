/**
 * ============================================================================
 * QR Event Pass & Token Authentication System - Backend Engine
 * Author: Aryan Pandya (Developed for THM Surat)
 * ============================================================================
 */

const SHEET_NAME = 'Form Responses 1';
const TOKEN_PREFIX = 'THMFOOD';

/**
 * Trigger: On Form Submit
 * Automatically assigns a sequential, standardized Token ID to new registrations.
 */
function assignFoodTokenNumber(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sheet) {
    Logger.log("Target sheet not found: " + SHEET_NAME);
    return;
  }

  const lastRow = sheet.getLastRow();
  
  // Ensure "Token ID" column exists at Column 1
  if (sheet.getRange(1, 1).getValue() !== "Token ID") {
    sheet.insertColumnBefore(1);
    sheet.getRange(1, 1).setValue("Token ID");
    sheet.getRange(1, sheet.getLastColumn() + 1).setValue("Status");
    sheet.getRange(1, sheet.getLastColumn() + 2).setValue("Check-In Time");
  }
  
  const lastToken = sheet.getRange(lastRow - 1, 1).getValue();
  let nextNumber = 1;

  if (lastRow > 2 && lastToken && typeof lastToken === 'string') {
    const match = lastToken.match(/\d+/);
    if (match) {
      nextNumber = parseInt(match[0], 10) + 1;
    }
  }

  const formattedToken = TOKEN_PREFIX + ("000" + nextNumber).slice(-3);
  sheet.getRange(lastRow, 1).setValue(formattedToken);
  Logger.log("Assigned Token: " + formattedToken + " to Row: " + lastRow);
}

/**
 * Webhook Endpoint: POST /exec
 * Handles real-time QR token verification from scanner gates.
 */
function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(10000); // Concurrency protection against race-condition check-ins

  try {
    const rawData = e.postData.contents;
    const request = JSON.parse(rawData);
    const token = (request.token || "").trim().toUpperCase();

    if (!token) {
      return respondJson({ status: "ERROR", message: "Token parameter missing" }, 400);
    }

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    const data = sheet.getDataRange().getValues();

    let foundRow = -1;
    let attendeeName = "";
    let isRedeemed = false;
    let checkedInTimestamp = "";

    // Search for token in Column A (Index 0)
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]).trim().toUpperCase() === token) {
        foundRow = i + 1; // 1-based index
        attendeeName = data[i][2] || "Attendee"; // Column C: Name
        isRedeemed = String(data[i][data[i].length - 2]).toUpperCase() === "CHECKED_IN";
        checkedInTimestamp = data[i][data[i].length - 1];
        break;
      }
    }

    // Case 1: Token Not Found
    if (foundRow === -1) {
      return respondJson({ status: "INVALID_TOKEN", message: "Token does not exist in registry" }, 404);
    }

    // Case 2: Token Already Redeemed (Replay / Fraud Attempt)
    if (isRedeemed) {
      return respondJson({
        status: "ALREADY_USED",
        message: "Pass already redeemed",
        attendee: attendeeName,
        checkedInAt: checkedInTimestamp
      }, 409);
    }

    // Case 3: Valid Token -> Mark as Checked In
    const now = new Date().toISOString();
    const statusCol = data[0].length - 1; // 0-based for second last
    const timeCol = data[0].length;      // 0-based for last

    sheet.getRange(foundRow, statusCol).setValue("CHECKED_IN");
    sheet.getRange(foundRow, timeCol).setValue(now);

    return respondJson({
      status: "SUCCESS",
      message: "Pass verified and admitted",
      token: token,
      attendee: attendeeName,
      timestamp: now
    }, 200);

  } catch (err) {
    return respondJson({ status: "ERROR", message: err.toString() }, 500);
  } finally {
    lock.releaseLock();
  }
}

function respondJson(obj, statusCode) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
