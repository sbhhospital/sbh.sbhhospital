/**
 * SBH Hospital - Visiting Doctors Payment Automation (v3.4 - DATA RECOVERY)
 * Features: Auto-Mapping, Shift Correction, detailed WhatsApp.
 */

const ACCOUNT_TEAM_MOBILE = "9644404741";
const HR_TEAM_MOBILE = "9644404741";

function setupVisitingSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let paymentsSheet = ss.getSheetByName('Visiting_Payments');
  if (!paymentsSheet) paymentsSheet = ss.insertSheet('Visiting_Payments');
  
  // Force Reset Headers for consistency
  const headers = [
    'Payment_ID', 'Doctor_ID', 'Doctor_Name', 'Gross_Amount', 'Deductions', 'Amount_To_Pay', 'Visit_Dates', 
    'Visit_Count', 'HR_Entry_Date', 'Status', 'Payment_Date', 'Account_Remarks', 'Paid_Amount', 'Reminders_Sent'
  ];
  paymentsSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  paymentsSheet.getRange(1, 1, 1, headers.length).setBackground("#2E7D32").setFontColor("white").setFontWeight("bold");

  let archiveSheet = ss.getSheetByName('Visiting_Archive');
  if (!archiveSheet) archiveSheet = ss.insertSheet('Visiting_Archive');
  archiveSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  archiveSheet.getRange(1, 1, 1, headers.length).setBackground("#1a365d").setFontColor("white").setFontWeight("bold");
  
  return "Sheets Reset Successfully!";
}

function doGet(e) {
  const action = e.parameter.action;
  try {
    if (action === 'get_visiting_doctors') return getVisitingDoctors();
    if (action === 'get_visiting_payments') return getVisitingPayments();
  } catch (err) {
    return createJsonResponse({ success: false, error: err.toString() });
  }
}

function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  const action = data.action;
  try {
    if (action === 'add_visiting_doctor') return addVisitingDoctor(data);
    if (action === 'log_payment') return logPayment(data);
    if (action === 'settle_payout') return settlePayout(data);
  } catch (err) {
    return createJsonResponse({ success: false, error: err.toString() });
  }
}

function getVisitingDoctors() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Visiting_Master');
  return createJsonResponse(mapRows(sheet.getDataRange().getValues()));
}

function getVisitingPayments() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const activeSheet = ss.getSheetByName('Visiting_Payments');
  
  const headersNeeded = [
    'Payment_ID', 'Doctor_ID', 'Doctor_Name', 'Gross_Amount', 'Deductions', 'Amount_To_Pay', 'Visit_Dates', 
    'Visit_Count', 'HR_Entry_Date', 'Status', 'Payment_Date', 'Account_Remarks', 'Paid_Amount', 'Reminders_Sent'
  ];

  if (activeSheet) {
    const currentHeaders = activeSheet.getRange(1, 1, 1, activeSheet.getLastColumn()).getValues()[0];
    if (currentHeaders.indexOf('Paid_Amount') === -1 || currentHeaders.indexOf('Amount_To_Pay') === -1) {
      activeSheet.getRange(1, 1, 1, headersNeeded.length).setValues([headersNeeded]);
      activeSheet.getRange(1, 1, 1, headersNeeded.length).setBackground("#2E7D32").setFontColor("white").setFontWeight("bold");
    }
  }

  const archiveSheet = ss.getSheetByName('Visiting_Archive');
  let combined = [];
  if (activeSheet && activeSheet.getLastRow() > 1) combined = combined.concat(mapRows(activeSheet.getDataRange().getValues()));
  if (archiveSheet && archiveSheet.getLastRow() > 1) combined = combined.concat(mapRows(archiveSheet.getDataRange().getValues()));
  return createJsonResponse(combined);
}

function logPayment(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Visiting_Payments');
  const nextId = "PAY" + (sheet.getLastRow() + 1000);
  const hrEntryDate = Utilities.formatDate(new Date(), "GMT+5:30", "dd-MM-yyyy HH:mm:ss");
  
  // Ensure no undefined values cause shifting
  const row = [
    nextId, 
    data.doctorId || '', 
    data.doctorName || '', 
    data.grossAmount || 0, 
    data.deductions || 0, 
    data.netAmount || 0, 
    data.visitDates || '', 
    data.visitCount || 0, 
    hrEntryDate, 
    'Pending', 
    '', 
    '', 
    0, // Paid_Amount
    0  // Reminders_Sent
  ];
  
  sheet.appendRow(row);
  return createJsonResponse({ success: true });
}

function settlePayout(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Visiting_Payments');
  const archiveSheet = ss.getSheetByName('Visiting_Archive');
  const dataRange = sheet.getDataRange();
  const rows = dataRange.getValues();
  const headers = rows[0].map(h => h.toString().trim());
  const payDate = Utilities.formatDate(new Date(), "GMT+5:30", "dd-MM-yyyy HH:mm:ss");

  const idIdx = headers.indexOf('Payment_ID');
  const statusIdx = headers.indexOf('Status');
  const payDateIdx = headers.indexOf('Payment_Date');
  const remarkIdx = headers.indexOf('Account_Remarks');
  const paidAmountIdx = headers.indexOf('Paid_Amount');

  for (let i = 1; i < rows.length; i++) {
    if (rows[i][idIdx].toString() === data.paymentId.toString()) {
      const settledRow = [...rows[i]];
      if (statusIdx !== -1) settledRow[statusIdx] = 'Paid';
      if (payDateIdx !== -1) settledRow[payDateIdx] = data.paymentDate || payDate;
      if (remarkIdx !== -1) settledRow[remarkIdx] = data.remarks || 'Settled';
      if (paidAmountIdx !== -1) settledRow[paidAmountIdx] = data.paidAmount || rows[i][headers.indexOf('Amount_To_Pay')] || rows[i][headers.indexOf('Net_Amount')] || 0;
      
      archiveSheet.appendRow(settledRow);
      sheet.deleteRow(i + 1);
      
      // WhatsApp Notification
      const finalAmount = data.paidAmount || data.netAmount || 0;
      
      // Breakdown visits if possible
      const dates = String(data.visitDates || '').split(',').map(d => d.trim()).filter(d => d);
      const perVisitAmt = dates.length > 0 ? Math.round(data.grossAmount / dates.length) : data.grossAmount;
      
      let breakdownText = "";
      dates.forEach(d => {
        breakdownText += `• ${d}: *₹${perVisitAmt}*\n`;
      });

      const msgToDoctor = `*OFFICIAL FEE SETTLEMENT ADVISORY* 🏥\n\n` +
      `Dear *${data.doctorName}*,\n\n` +
      `We are pleased to inform you that your fee for *${data.visitCount} visits* has been processed.\n\n` +
      `*Visit Breakdown:*\n` +
      breakdownText + `\n` +
      `*Transaction Summary:*\n` +
      `• Gross Total: *₹${data.grossAmount}*\n` +
      `• Deductions: *₹${data.deductions}*\n` +
      `• Net Settled Amount: *₹${finalAmount}*\n\n` +
      `The amount will be credited to your registered bank account shortly.\n\n` +
      `📝 *Accounts Remark:* ${data.remarks || 'Official fee processed. Amount will be credited to your account shortly.'}\n\n` +
      `Regards,\n*SBH Hospitals Accounts Team*`;

      sendWhatsApp(data.doctorMobile, msgToDoctor);
      return createJsonResponse({ success: true });
    }
  }
  return createJsonResponse({ success: false });
}

function sendWhatsApp(mobile, message) {
  if (!mobile) return;
  const url = "https://app.messageautosender.com/message/new" + 
              "?username=" + encodeURIComponent("SBH HOSPITAL") + 
              "&password=" + encodeURIComponent("123456789") + 
              "&receiverMobileNo=" + encodeURIComponent(mobile) + 
              "&message=" + encodeURIComponent(message);
  try { UrlFetchApp.fetch(url); } catch (e) {}
}

function mapRows(data) {
  if (data.length <= 1) return [];
  const rawHeaders = data[0].map(h => h.toString().trim());
  
  return data.slice(1).map(row => {
    let obj = {};
    rawHeaders.forEach((h, i) => {
      let val = row[i];
      if (val instanceof Date) val = Utilities.formatDate(val, "GMT+5:30", "dd-MM-yyyy");
      obj[h] = val;
    });

    // --- AUTO-CORRECTION FOR SHIFTED DATA ---
    // If Status is empty but Visit_Count has "Pending", we shifted!
    if (!obj.Status && String(obj.Visit_Count).trim() === 'Pending') {
      obj.Status = 'Pending';
      obj.HR_Entry_Date = obj.Visit_Dates;
      obj.Amount_To_Pay = obj.Gross_Amount;
      obj.Deductions = 0;
      obj.Gross_Amount = obj.Amount_To_Pay;
    }

    return obj;
  });
}


/**
 * Function to be called via Time-driven Trigger (Daily)
 * Scans for PENDING payments older than 5 days and alerts Account Team.
 */
function checkPendingReminders() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Visiting_Payments");
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const rows = data.slice(1);
  
  const statusIdx = headers.indexOf("Status");
  const dateIdx = headers.indexOf("HR_Entry_Date");
  const nameIdx = headers.indexOf("Doctor_Name");
  const idIdx = headers.indexOf("Payment_ID");
  const amountIdx = headers.indexOf("Amount_To_Pay");

  const now = new Date();
  const fiveDaysInMs = 5 * 24 * 60 * 60 * 1000;
  let agingPayments = [];

  rows.forEach(row => {
    const status = String(row[statusIdx] || '').toUpperCase();
    if (status === "PENDING" || status === "DUE") {
      const entryDate = new Date(row[dateIdx]);
      if (!isNaN(entryDate.getTime())) {
        const age = now - entryDate;
        if (age >= fiveDaysInMs) {
          agingPayments.push({
            id: row[idIdx],
            name: row[nameIdx],
            amount: row[amountIdx],
            days: Math.floor(age / (24 * 60 * 60 * 1000))
          });
        }
      }
    }
  });

  if (agingPayments.length > 0) {
    let alertMsg = `*⚠️ URGENT: AGING PAYOUT ALERT* ⚠️\n\n` +
      `The following Visiting Doctor payouts have been *PENDING for more than 5 days*:\n\n`;
    
    agingPayments.forEach(p => {
      alertMsg += `• *${p.name}* (${p.id})\n   Amt: ₹${p.amount} | Pending since: ${p.days} days\n\n`;
    });
    
    alertMsg += `Please process these settlements immediately.\n*SBH Payroll System*`;
    
    // Send to Account Team / Admin
    sendWhatsApp("919516624444", alertMsg); // Admin
    sendWhatsApp("917000842261", alertMsg); // Accounts
  }
}

function createJsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
