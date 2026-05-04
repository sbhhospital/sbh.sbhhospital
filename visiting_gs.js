/**
 * SBH Hospital - Visiting Doctors Payment Automation (v3.0 - FINAL)
 * Features: Multiple Dates, Auto-Calculation, Daily WhatsApp Reminders.
 */

// --- CONFIGURATION ---
const ACCOUNT_TEAM_MOBILE = "9644404741";
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbybBim6gXGxKgcwpivSGWOdzW4hyA_NAG-WwzoBk3mpsfJ-rznT-U99oVj6m1qNLeKwVw/exec";
const FRONTEND_URL = "https://smile-award-sbh.vercel.app"; // Krapaya yahan apna frontend URL dalein

/**
 * Run this function ONCE to set up all necessary sheets.
 */
function setupVisitingSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. Visiting Doctors Master
  let masterSheet = ss.getSheetByName('Visiting_Master');
  if (!masterSheet) {
    masterSheet = ss.insertSheet('Visiting_Master');
    masterSheet.appendRow(['Doctor_ID', 'Name', 'Specialty', 'Mobile', 'Email', 'Status']);
    masterSheet.getRange("A1:F1").setBackground("#1a365d").setFontColor("white").setFontWeight("bold");
    masterSheet.appendRow(['DOC001', 'Dr. Ashish Mahobia', 'Ophthalmology', '9644404741', '', 'Active']);
  }

  // 2. Visiting Payments
  let paymentsSheet = ss.getSheetByName('Visiting_Payments');
  if (!paymentsSheet) {
    paymentsSheet = ss.insertSheet('Visiting_Payments');
    paymentsSheet.appendRow([
      'Payment_ID', 'Doctor_ID', 'Doctor_Name', 'Amount_To_Pay', 'Visit_Dates', 
      'Visit_Count', 'HR_Entry_Date', 'Status', 'Paid_Amount', 'Payment_Date', 'Account_Remarks', 'Reminders_Sent'
    ]);
    paymentsSheet.getRange("A1:L1").setBackground("#2E7D32").setFontColor("white").setFontWeight("bold");
  }

  // 3. Monthly Summary
  let summarySheet = ss.getSheetByName('Visiting_Monthly_Summary');
  if (!summarySheet) {
    summarySheet = ss.insertSheet('Visiting_Monthly_Summary');
  }
  summarySheet.clear();
  // Query to aggregate by Month and Doctor
  summarySheet.getRange("A1").setFormula('=QUERY(Visiting_Payments!A:L, "SELECT MONTH(G)+1, C, SUM(D), SUM(I), SUM(F) WHERE H = \'Paid\' GROUP BY MONTH(G)+1, C LABEL MONTH(G)+1 \'Month\', C \'Doctor Name\', SUM(D) \'Total Expected\', SUM(I) \'Total Paid\', SUM(F) \'Total Visits\'", 1)');
  summarySheet.getRange("A1:E1").setBackground("#e65100").setFontColor("white").setFontWeight("bold");
}

/**
 * Handle API GET requests.
 */
function doGet(e) {
  const action = e.parameter.action;
  try {
    if (action === 'get_visiting_doctors') return getVisitingDoctors();
    if (action === 'get_visiting_payments') return getVisitingPayments();
    if (action === 'get_visiting_summary') return getVisitingSummary();
  } catch (err) {
    return createJsonResponse({ success: false, error: err.toString() });
  }
  return createJsonResponse({ success: false, message: "Invalid visiting action" });
}

/**
 * Handle API POST requests.
 */
function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  const action = data.action;
  try {
    if (action === 'add_visiting_doctor') return addVisitingDoctor(data);
    if (action === 'log_payment') return logPayment(data);
    if (action === 'update_payment') return updatePayment(data);
  } catch (err) {
    return createJsonResponse({ success: false, error: err.toString() });
  }
  return createJsonResponse({ success: false, message: "Unknown visiting POST action" });
}

// --- CORE LOGIC ---

function getVisitingDoctors() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Visiting_Master');
  const data = sheet.getDataRange().getValues();
  return createJsonResponse(mapRows(data));
}

function getVisitingPayments() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Visiting_Payments');
  const data = sheet.getDataRange().getValues();
  return createJsonResponse(mapRows(data));
}

function getVisitingSummary() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Visiting_Monthly_Summary');
  const data = sheet.getDataRange().getDisplayValues();
  return createJsonResponse(mapRows(data));
}

function addVisitingDoctor(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Visiting_Master');
  const nextId = "DOC" + (sheet.getLastRow() + 100);
  sheet.appendRow([nextId, data.name, data.specialty || 'General', data.mobile || '', data.email || '', 'Active']);
  return createJsonResponse({ success: true, doctorId: nextId });
}

function logPayment(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Visiting_Payments');
  const nextId = "PAY" + (sheet.getLastRow() + 1000);
  const now = new Date();
  const hrEntryDate = Utilities.formatDate(now, "GMT+5:30", "yyyy-MM-dd HH:mm:ss");
  
  sheet.appendRow([
    nextId, 
    data.doctorId, 
    data.doctorName, 
    data.amount,
    data.visitDates, // List of dates
    data.visitCount, // Number of visits
    hrEntryDate,
    'Pending',
    '',
    '',
    '',
    0
  ]);

  sendPaymentReminderToAccount(nextId, data.doctorName, data.amount, data.visitDates, data.visitCount);
  return createJsonResponse({ success: true, paymentId: nextId });
}

function updatePayment(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Visiting_Payments');
  const rows = sheet.getDataRange().getValues();
  const now = new Date();
  const payDate = data.paymentDate || Utilities.formatDate(now, "GMT+5:30", "yyyy-MM-dd");

  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === data.paymentId) {
      // Column H is Status (Index 7), Columns I, J, K are Paid_Amount, Date, Remarks
      sheet.getRange(i + 1, 8, 1, 4).setValues([[
        'Paid', 
        data.paidAmount, 
        payDate, 
        data.remarks || 'Confirmed by Account'
      ]]);
      
      // Notify HR about the confirmation
      notifyHR(rows[i][2], data.paidAmount, payDate, data.remarks);
      return createJsonResponse({ success: true });
    }
  }
  return createJsonResponse({ success: false, message: "Payment ID not found" });
}

// --- AUTOMATION & REMINDERS ---

/**
 * Run this function daily via Time-driven trigger.
 */
function dailyVisitingReminder() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Visiting_Payments');
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return;

  for (let i = 1; i < data.length; i++) {
    const status = data[i][7]; // Status is column H
    if (status === 'Pending') {
      sendPaymentReminderToAccount(data[i][0], data[i][2], data[i][3], data[i][4], data[i][5]);
      
      // Increment reminder count in column L (Index 11)
      const currentCount = parseInt(data[i][11] || 0);
      sheet.getRange(i + 1, 12).setValue(currentCount + 1);
    }
  }
}

function sendPaymentReminderToAccount(payId, name, amount, dates, count) {
  const updateUrl = FRONTEND_URL + "?type=visiting_update&paymentId=" + payId;
  const message = `🔔 *PAYMENT REMINDER (Visiting Doctor)*\n\n` +
                  `Dr. Name: *${name}*\n` +
                  `Total Amount: *₹${amount}*\n` +
                  `Visit Dates: *${dates}*\n` +
                  `Total Visits: *${count}*\n\n` +
                  `Please confirm if payment is done:\n` +
                  `🔗 ${updateUrl}\n\n` +
                  `_This is an automated reminder._`;
                  
  sendWhatsApp(ACCOUNT_TEAM_MOBILE, message);
}

function notifyHR(name, amount, date, remarks) {
  const message = `✅ *PAYMENT CONFIRMED*\n\n` +
                  `Visiting Doctor: *${name}*\n` +
                  `Amount Paid: *₹${amount}*\n` +
                  `Payment Date: *${date}*\n` +
                  `Account Remarks: ${remarks}\n\n` +
                  `- *SBH Automated System*`;
  
  sendWhatsApp(ACCOUNT_TEAM_MOBILE, message); 
}

function sendWhatsApp(mobile, message) {
  const username = "SBH HOSPITAL";
  const password = "123456789";
  const baseUrl = "https://app.messageautosender.com/message/new";
  const finalUrl = baseUrl + 
    "?username=" + encodeURIComponent(username) +
    "&password=" + encodeURIComponent(password) +
    "&receiverMobileNo=" + encodeURIComponent(mobile) +
    "&message=" + encodeURIComponent(message);

  try {
    UrlFetchApp.fetch(finalUrl);
  } catch (e) {
    console.error("WhatsApp Error: " + e.toString());
  }
}

// --- HELPERS ---

function mapRows(data) {
  if (data.length <= 1) return [];
  const headers = data[0];
  return data.slice(1).map(row => {
    let obj = {};
    headers.forEach((h, i) => {
      let val = row[i];
      if (val instanceof Date) val = Utilities.formatDate(val, "GMT+5:30", "yyyy-MM-dd");
      obj[h] = val;
    });
    return obj;
  });
}

function createJsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
