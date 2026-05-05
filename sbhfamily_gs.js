/**
 * SBH Hospital - Staff Salary Management (SBH Family)
 * Features: Staff Master, Salary Ledger, Account Settlement, WhatsApp Reminders.
 */

const ACCOUNT_TEAM_MOBILE = "9644404741";

/**
 * Setup necessary sheets for SBH Family.
 */
function setupStaffSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. Staff Master
  let masterSheet = ss.getSheetByName('Staff_Master');
  if (!masterSheet) {
    masterSheet = ss.insertSheet('Staff_Master');
    masterSheet.appendRow(['Staff_ID', 'Name', 'Designation', 'Department', 'Mobile', 'Account_Number', 'IFSC_Code', 'Base_Salary', 'Status']);
    masterSheet.getRange("A1:I1").setBackground("#1a365d").setFontColor("white").setFontWeight("bold");
  }

  // 2. Salary Ledger
  let ledgerSheet = ss.getSheetByName('Salary_Ledger');
  if (!ledgerSheet) {
    ledgerSheet = ss.insertSheet('Salary_Ledger');
    ledgerSheet.getRange("A1:O1").setValues([[
      'Salary_ID', 'Staff_ID', 'Staff_Name', 'Month', 'Year', 'Days_Worked', 
      'Gross_Salary', 'Incentives', 'Deductions', 'Net_Salary', 'Status', 
      'HR_Submit_Date', 'Account_Confirm_Date', 'Account_Remarks', 'Notification_Sent'
    ]]);
    ledgerSheet.getRange("A1:O1").setBackground("#2E7D32").setFontColor("white").setFontWeight("bold");
  }
}

function doGet(e) {
  const action = e.parameter.action;
  try {
    if (action === 'get_staff_master') return getStaffMaster();
    if (action === 'get_salary_ledger') return getSalaryLedger();
  } catch (err) {
    return createJsonResponse({ success: false, error: err.toString() });
  }
}

function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  const action = data.action;
  try {
    if (action === 'add_staff') return addStaff(data);
    if (action === 'submit_salary') return submitSalary(data);
    if (action === 'settle_salary') return settleSalary(data);
  } catch (err) {
    return createJsonResponse({ success: false, error: err.toString() });
  }
}

function getStaffMaster() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Staff_Master');
  const data = sheet.getDataRange().getValues();
  return createJsonResponse(mapRows(data));
}

function getSalaryLedger() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Salary_Ledger');
  const data = sheet.getDataRange().getValues();
  return createJsonResponse(mapRows(data));
}

function addStaff(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Staff_Master');
  const nextId = "STF" + (sheet.getLastRow() + 100);
  sheet.appendRow([
    nextId, data.name, data.designation, data.department, 
    data.mobile, data.accountNumber, data.ifscCode, data.baseSalary, 'Active'
  ]);
  return createJsonResponse({ success: true, staffId: nextId });
}

function submitSalary(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Salary_Ledger');
  const nextId = "SAL" + (sheet.getLastRow() + 1000);
  const now = new Date();
  const hrSubmitDate = Utilities.formatDate(now, "GMT+5:30", "yyyy-MM-dd HH:mm:ss");
  
  sheet.appendRow([
    nextId, data.staffId, data.staffName, data.month, data.year, data.daysWorked,
    data.grossSalary, data.incentives, data.deductions, data.netSalary, 'Pending',
    hrSubmitDate, '', '', 'No'
  ]);
  return createJsonResponse({ success: true, salaryId: nextId });
}

function settleSalary(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Salary_Ledger');
  const dataRange = sheet.getDataRange().getValues();
  const now = new Date();
  const confirmDate = Utilities.formatDate(now, "GMT+5:30", "yyyy-MM-dd HH:mm:ss");

  for (let i = 1; i < dataRange.length; i++) {
    if (dataRange[i][0] === data.salaryId) {
      sheet.getRange(i + 1, 11).setValue('Settled');
      sheet.getRange(i + 1, 13).setValue(confirmDate);
      sheet.getRange(i + 1, 14).setValue(data.remarks || 'Salary Credited');
      
      // Notify Staff via WhatsApp
      const staffMobile = data.staffMobile;
      const message = `✨ *SALARY CREDITED - SBH FAMILY*\n\n` +
                      `Name: *${data.staffName}*\n` +
                      `Month: *${data.month} ${data.year}*\n` +
                      `Net Salary: *₹${data.netSalary}*\n` +
                      `Days Worked: *${data.daysWorked}*\n` +
                      `Deductions: *₹${data.deductions}*\n\n` +
                      `Your salary has been successfully processed and credited. Thank you for your hard work!\n\n` +
                      `- *SBH Administration*`;
      
      sendWhatsApp(staffMobile, message);
      sheet.getRange(i + 1, 15).setValue('Yes');
      return createJsonResponse({ success: true });
    }
  }
  return createJsonResponse({ success: false, message: "Salary ID not found" });
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
