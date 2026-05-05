/**
 * SBH Hospital - Staff Salary Management (SBH Family)
 * FINAL STABLE VERSION
 */

const ACCOUNT_TEAM_MOBILE = "9644404741";

function setupStaffSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. Staff Master
  let masterSheet = ss.getSheetByName('Staff_Master');
  if (!masterSheet) {
    masterSheet = ss.insertSheet('Staff_Master');
    masterSheet.appendRow(['Staff_ID', 'Name', 'Designation', 'Department', 'Unit', 'Mobile', 'Account_Number', 'IFSC_Code', 'Base_Salary', 'Joining_Date', 'Resignation_Date', 'CL_Total', 'EL_Total', 'Status']);
    masterSheet.getRange("A1:N1").setBackground("#1a365d").setFontColor("white").setFontWeight("bold");
  }

  // 2. Salary Ledger
  let ledgerSheet = ss.getSheetByName('Salary_Ledger');
  if (!ledgerSheet) {
    ledgerSheet = ss.insertSheet('Salary_Ledger');
    ledgerSheet.getRange("A1:P1").setValues([[
      'Salary_ID', 'Staff_ID', 'Staff_Name', 'Unit', 'Month', 'Year', 'Days_Worked', 
      'Gross_Salary', 'Incentives', 'Deductions', 'Net_Salary', 'Status', 
      'HR_Submit_Date', 'Account_Confirm_Date', 'Account_Remarks', 'Notification_Sent'
    ]]);
    ledgerSheet.getRange("A1:P1").setBackground("#2E7D32").setFontColor("white").setFontWeight("bold");
  }

  // 3. Config Sheet
  let configSheet = ss.getSheetByName('Config');
  if (!configSheet) {
    configSheet = ss.insertSheet('Config');
    configSheet.appendRow(['Units', 'Departments']);
    configSheet.getRange("A1:B1").setBackground("#444").setFontColor("white").setFontWeight("bold");
    const units = ['SBH', 'SBH Women', 'SBH Eye', 'SBH Fafadih', 'SBH pharmacy', 'SBH Lab', 'SBH Cosmetic'];
    const depts = ['Nursing', 'Front Desk', 'Account', 'HR', 'Housekeeping', 'Pharmacy', 'Laboratory', 'OT', 'General'];
    const maxLen = Math.max(units.length, depts.length);
    for (let i = 0; i < maxLen; i++) {
      configSheet.appendRow([units[i] || '', depts[i] || '']);
    }
  }
}

function doGet(e) {
  const action = e.parameter.action;
  try {
    if (action === 'get_staff_master') return getStaffMaster();
    if (action === 'get_salary_ledger') return getSalaryLedger();
    if (action === 'get_config') return getConfig();
    return createJsonResponse({ success: false, message: "Unknown action: " + action });
  } catch (err) {
    return createJsonResponse({ success: false, error: err.toString() });
  }
}

function doPost(e) {
  let contents;
  try {
    contents = JSON.parse(e.postData.contents);
  } catch (err) {
    return createJsonResponse({ success: false, error: "Invalid JSON" });
  }
  
  const action = contents.action;
  try {
    if (action === 'add_staff') return addStaff(contents);
    if (action === 'submit_salary') return submitSalary(contents);
    if (action === 'settle_salary') return settleSalary(contents);
    return createJsonResponse({ success: false, message: "Unknown post action: " + action });
  } catch (err) {
    return createJsonResponse({ success: false, error: err.toString() });
  }
}

function getConfig() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Config');
  if (!sheet) return createJsonResponse({ units: [], depts: [] });
  const data = sheet.getDataRange().getValues();
  const units = data.slice(1).map(row => row[0]).filter(v => v !== "");
  const depts = data.slice(1).map(row => row[1]).filter(v => v !== "");
  return createJsonResponse({ units, depts });
}

function getStaffMaster() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Staff_Master');
  if (!sheet) return createJsonResponse([]);
  const data = sheet.getDataRange().getValues();
  return createJsonResponse(mapRows(data));
}

function getSalaryLedger() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Salary_Ledger');
  if (!sheet) return createJsonResponse([]);
  const data = sheet.getDataRange().getValues();
  return createJsonResponse(mapRows(data));
}

function addStaff(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Staff_Master');
  const nextId = "STF" + (sheet.getLastRow() + 100);
  sheet.appendRow([
    nextId, 
    data.name || "Unknown", 
    data.designation || "", 
    data.department || "", 
    data.unit || "",
    data.mobile || "", 
    data.accountNumber || "", 
    data.ifscCode || "", 
    data.baseSalary || 0,
    data.joiningDate || "", 
    "", // Resignation
    data.clTotal || 0, 
    data.elTotal || 0, 
    'Active'
  ]);
  return createJsonResponse({ success: true, staffId: nextId });
}

function submitSalary(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Salary_Ledger');
  const nextId = "SAL" + (sheet.getLastRow() + 1000);
  const hrSubmitDate = Utilities.formatDate(new Date(), "GMT+5:30", "yyyy-MM-dd HH:mm:ss");
  
  sheet.appendRow([
    nextId, 
    data.staffId || "", 
    data.staffName || "", 
    data.unit || "", 
    data.month || "", 
    data.year || "", 
    data.daysWorked || 0,
    data.grossSalary || 0, 
    data.incentives || 0, 
    data.deductions || 0, 
    data.netSalary || 0, 
    'Pending',
    hrSubmitDate, 
    '', // Confirm Date
    '', // Remarks
    'No' // Notif Sent
  ]);
  return createJsonResponse({ success: true, salaryId: nextId });
}

function settleSalary(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Salary_Ledger');
  const dataRange = sheet.getDataRange().getValues();
  const confirmDate = Utilities.formatDate(new Date(), "GMT+5:30", "yyyy-MM-dd HH:mm:ss");

  for (let i = 1; i < dataRange.length; i++) {
    if (dataRange[i][0] == data.salaryId) {
      sheet.getRange(i + 1, 12).setValue('Settled');
      sheet.getRange(i + 1, 14).setValue(data.paymentDate || confirmDate);
      sheet.getRange(i + 1, 15).setValue(data.remarks || 'Salary Credited');
      
      try {
        const message = `*SALARY CREDIT CONFIRMATION* 🏦\n\n` +
                        `Dear *${data.staffName}*,\n\n` +
                        `Your salary for *${data.month} ${data.year}* has been successfully processed.\n\n` +
                        `📅 *Period:* ${data.month} ${data.year}\n` +
                        `🔢 *Days Worked:* ${data.daysWorked}\n` +
                        `💰 *Net Amount Paid:* ₹${data.netSalary}\n` +
                        `➖ *Deductions:* ₹${data.deductions}\n\n` +
                        `📝 *Accounts Remark:* ${data.remarks || 'Salary successfully credited.'}\n\n` +
                        `Thank you for your hard work.\n` +
                        `*SBH Hospitals Accounts Team*`;
        sendWhatsApp(data.staffMobile, message);
        sheet.getRange(i + 1, 16).setValue('Yes');
      } catch (e) {}
      
      return createJsonResponse({ success: true });
    }
  }
  return createJsonResponse({ success: false, message: "Salary ID not found: " + data.salaryId });
}

function sendWhatsApp(mobile, message) {
  if (!mobile) return;
  const username = "SBH HOSPITAL";
  const password = "123456789";
  const baseUrl = "https://app.messageautosender.com/message/new";
  const finalUrl = baseUrl + 
    "?username=" + encodeURIComponent(username) +
    "&password=" + encodeURIComponent(password) +
    "&receiverMobileNo=" + encodeURIComponent(mobile) +
    "&message=" + encodeURIComponent(message);
  UrlFetchApp.fetch(finalUrl);
}

function mapRows(data) {
  if (data.length <= 1) return [];
  const headers = data[0].map(h => h.toString().trim());
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


/**
 * Function to be called via Time-driven Trigger (Daily)
 * Scans for PENDING salaries older than 5 days and alerts Account Team.
 */
function checkPendingReminders() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Salary_Ledger");
  if (!sheet) return;
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const rows = data.slice(1);
  
  const statusIdx = headers.indexOf("Status");
  const dateIdx = headers.indexOf("HR_Submit_Date");
  const nameIdx = headers.indexOf("Staff_Name");
  const idIdx = headers.indexOf("Salary_ID");
  const amountIdx = headers.indexOf("Net_Salary");

  const now = new Date();
  const fiveDaysInMs = 5 * 24 * 60 * 60 * 1000;
  let agingPayments = [];

  rows.forEach(row => {
    const status = String(row[statusIdx] || '').toUpperCase();
    if (status === "PENDING") {
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
    let alertMsg = `*⚠️ URGENT: SBH FAMILY AGING SALARY ALERT* ⚠️\n\n` +
      `The following Staff Salarie(s) have been *PENDING for more than 5 days*:\n\n`;
    
    agingPayments.forEach(p => {
      alertMsg += `• *${p.name}* (${p.id})\n   Net: ₹${p.amount} | Pending since: ${p.days} days\n\n`;
    });
    
    alertMsg += `Please process these settlements immediately.\n*SBH Payroll System*`;
    
    // Send to Account Team / Admin
    sendWhatsApp("919516624444", alertMsg); // Admin
    sendWhatsApp("917000842261", alertMsg); // Accounts
  }
}

function createJsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
