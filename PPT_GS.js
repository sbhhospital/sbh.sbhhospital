const SPREADSHEET_ID = '1hWNVgwIIq8L8vdgNNwTeEIonWBTLeHuoC29glaLezuA';

/**
 * Main entry point for React Dashboard and Public Form
 */
function doPost(e) {
  try {
    const res = JSON.parse(e.postData.contents);
    const action = res.action;
    
    if (action === 'save_submission') return jsonRes(recordPPTSubmission(res));
    if (action === 'update_master') return jsonRes(updatePPTMaster(res));
    if (action === 'update_admins') return jsonRes(updatePPTAdmins(res));
    if (action === 'update_director') return jsonRes(updatePPTDirector(res));
    if (action === 'send_reminder') return jsonRes(sendPPTReminder(res));
    if (action === 'update_config') return jsonRes(updatePPTConfig(res));
    
    return jsonRes({ success: false, message: "Unknown action: " + action });
  } catch (err) {
    return jsonRes({ success: false, error: err.toString() });
  }
}

function doGet(e) {
  const action = e.parameter.action;
  if (action === 'get_ppt_data') return jsonRes(getPPTData());
  if (action === 'check_status') return jsonRes(checkSubmissionStatus(e.parameter.id, e.parameter.month));
  return jsonRes({ success: false, message: "Invalid action" });
}

function jsonRes(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/**
 * INITIAL SETUP: Run this function once to create sheets
 */
function setupPPTSheets() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheets = {
    'PPT_Master': ['Staff_ID', 'Name', 'Department', 'Mobile', 'Email', 'Status', 'Submission_Day', 'Reminder_Days', 'PPT_Type'],
    'PPT_Submissions': ['Submission_ID', 'Staff_ID', 'Month', 'Submitted_Date', 'PPT_Link', 'Status', 'Delay_Days'],
    'PPT_Admins': ['Name', 'Mobile', 'Email', 'Role'],
    'PPT_Director': ['Name', 'Mobile', 'Email'],
    'PPT_Reminders': ['Timestamp', 'Staff_ID', 'Month', 'Type', 'Target_No', 'Message_Status'],
    'PPT_Config': ['Key', 'Value']
  };
  
  Object.keys(sheets).forEach(name => {
    let sheet = ss.getSheetByName(name);
    if (!sheet) {
      sheet = ss.insertSheet(name);
      sheet.appendRow(sheets[name]);
      sheet.getRange(1, 1, 1, sheets[name].length).setFontWeight("bold").setBackground("#f3f3f3");
    } else {
      // Column validation
      const headers = sheet.getRange(1, 1, 1, Math.max(1, sheet.getLastColumn())).getValues()[0];
      sheets[name].forEach(h => {
        if (headers.indexOf(h) === -1) {
          sheet.getRange(1, sheet.getLastColumn() + 1).setValue(h).setFontWeight("bold").setBackground("#f3f3f3");
        }
      });
    }
  });

  return "System v3.2 Sheets Setup Successfully.";
}

/**
 * AUTOMATION TRIGGER: Setup a daily trigger to run this function
 */
function setupDailyTrigger() {
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(t => {
    if (t.getHandlerFunction() === 'autoCheckReminders') ScriptApp.deleteTrigger(t);
  });
  
  ScriptApp.newTrigger('autoCheckReminders')
    .timeBased()
    .everyDays(1)
    .atHour(9) // 9:00 AM
    .create();
    
  return "Daily Automation Trigger Activated (9:00 AM). Email & Escalation Protocols Live.";
}

/**
 * MAIN AUTOMATION LOGIC: Dispatches reminders based on individual user schedule
 */
function autoCheckReminders() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const today = new Date();
  const dayName = today.toLocaleDateString('en-US', { weekday: 'long' });
  
  const master = getSheetData(ss, 'PPT_Master');
  const submissions = getSheetData(ss, 'PPT_Submissions');
  const history = getSheetData(ss, 'PPT_Reminders');
  const currentMonth = today.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  
  let count = 0;
  master.forEach(leader => {
    // Check if submitted for current month
    const hasSubmitted = submissions.some(s => s.staff_id == leader.staff_id && s.month === currentMonth);
    if (hasSubmitted) return;

    const userReminderDays = (leader.reminder_days || "").split(',').map(d => d.trim());
    
    // Check delay for Super Alert frequency (Every 2 days to Director)
    const [mName, yStr] = currentMonth.split(' ');
    const monthIdx = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].indexOf(mName);
    const deadline = new Date(parseInt(yStr), monthIdx + 1, parseInt(leader.submission_day) || 5);
    const delayDays = Math.max(0, Math.ceil((today - deadline) / (1000 * 60 * 60 * 24)));

    if (delayDays >= 15) {
      // Super Alert Logic: Send every 2 days
      const lastAlert = history.filter(h => h.staff_id == leader.staff_id && h.month === currentMonth && h.type === 'Super Alert')
                               .sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp))[0];
      
      const shouldSendEscalation = !lastAlert || (today - new Date(lastAlert.timestamp)) / (1000 * 60 * 60 * 24) >= 2;
      
      if (shouldSendEscalation) {
        sendPPTReminder({ staff_id: leader.staff_id, month: currentMonth, manual_type: 'Super Alert' });
        count++;
      }
    } else if (userReminderDays.includes(dayName)) {
      // Standard Reminder Cycle
      sendPPTReminder({ staff_id: leader.staff_id, month: currentMonth });
      count++;
    }
  });
  
  return `Automated dispatch complete. Sent ${count} alerts.`;
}

/**
 * FETCH SYSTEM DATA
 */
function getPPTData() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  return {
    master: getSheetData(ss, 'PPT_Master'),
    submissions: getSheetData(ss, 'PPT_Submissions'),
    admins: getSheetData(ss, 'PPT_Admins'),
    director: getSheetData(ss, 'PPT_Director'),
    reminders: getSheetData(ss, 'PPT_Reminders'),
    config: getSheetData(ss, 'PPT_Config'),
    schedule: calculateSchedule()
  };
}

function checkSubmissionStatus(id, month) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const submissions = getSheetData(ss, 'PPT_Submissions');
  const master = getSheetData(ss, 'PPT_Master');
  
  const sub = submissions.find(s => s.staff_id == id && s.month === month);
  const leader = master.find(m => m.staff_id == id);
  
  return {
    isSubmitted: !!sub,
    submission: sub || null,
    leader: leader || null
  };
}

/**
 * SUBMISSION RECORDING & NOTIFICATION
 */
function recordPPTSubmission(res) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('PPT_Submissions');
  const staff = getPPTMasterById(ss, res.staff_id);
  
  if (!staff) return { success: false, message: "Leader Node Not Found" };

  const month = res.month; 
  const [mName, yStr] = month.split(' ');
  const monthIdx = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].indexOf(mName);
  
  const today = new Date();
  const subDay = parseInt(staff.submission_day) || 5;
  const deadline = new Date(parseInt(yStr), monthIdx + 1, subDay);
  const delayDays = Math.max(0, Math.ceil((today - deadline) / (1000 * 60 * 60 * 24)));
  
  const pptType = staff.ppt_type || 'Monthly PPT';

  const existing = getSheetData(ss, 'PPT_Submissions').find(s => s.staff_id == res.staff_id && s.month === res.month);
  if (existing) return { success: true, message: `Record for ${pptType} synchronized.` };

  const submissionId = "PPT-" + Date.now().toString().slice(-6);
  
  sheet.appendRow([
    submissionId,
    res.staff_id,
    res.month,
    new Date(),
    res.ppt_link || 'Portal Confirmation',
    'CONFIRMED',
    delayDays
  ]);

  // Confirmation WhatsApp
  const msg = `✅ *PPT SUBMISSION CONFIRMED*\n\n` +
              `Thank you *${staff.name}* for your *${pptType}* for *${res.month}*.\n\n` +
              `Status: ${delayDays > 0 ? 'Delayed Submission' : 'On-Time ✅'}\n` +
              `Ref: *${submissionId}*\n\n` +
              `Reminders for this cycle deactivated.`;
  
  sendWhatsApp(staff.mobile, msg);
  
  // EMAIL NOTIFICATION (To: Leader, CC: Director, Admin)
  sendPPTEmail(staff, res.month, 'Submission Confirmation', delayDays, submissionId);

  return { success: true, submissionId: submissionId, message: "Synchronized Successfully" };
}

/**
 * CORE LOGIC: SEND REMINDER (Situational & User-Specific)
 */
function sendPPTReminder(res) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const staff = getPPTMasterById(ss, res.staff_id);
  if (!staff) return { success: false };
  
  const month = res.month; 
  const [mName, yStr] = month.split(' ');
  const monthIdx = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].indexOf(mName);
  const nextMonthName = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"][(monthIdx + 1) % 12];
  
  const today = new Date();
  const subDay = parseInt(staff.submission_day) || 5;
  const deadline = new Date(parseInt(yStr), monthIdx + 1, subDay);
  const delayDays = Math.max(0, Math.ceil((today - deadline) / (1000 * 60 * 60 * 24)));
  
  const pptType = staff.ppt_type || 'Monthly PPT';
  let type = res.manual_type || 'Pending';
  if (!res.manual_type) {
    if (delayDays >= 15) type = 'Super Alert';
    else if (delayDays >= 10) type = 'Delayed';
  }
  
  let msg = "";
  let targetNo = staff.mobile;

  const portalLink = `https://sbhhospital-seven.vercel.app/?type=ppt_submit&id=${staff.staff_id}&month=${encodeURIComponent(month)}`;

  if (type === 'Pending' || type === 'Manual') {
    msg = `📋 *DUE: ${pptType}*\n\n` +
          `Dear *${staff.name}*,\n` +
          `This is a reminder to submit your *${pptType}* for *${month}*.\n\n` +
          `*Deadline:* ${subDay}th ${nextMonthName}\n` +
          `*Action:* Please confirm via link below 👇\n\n` +
          `${portalLink}\n\n` +
          `SBH HOSPITAL`;
  } 
  else if (type === 'Delayed') {
    msg = `⚠️ *DELAYED: ${pptType}*\n\n` +
          `Dear *${staff.name}*,\n` +
          `Your *${pptType}* is now *${delayDays} days* overdue.\n\n` +
          `Please synchronize your submission immediately to avoid escalation.\n\n` +
          `*Link:* ${portalLink}\n\n` +
          `SBH ADMINISTRATION`;
  }
  else if (type === 'Super Alert') {
    const director = getSheetData(ss, 'PPT_Director')[0] || { name: 'Director Sir', mobile: '' };
    targetNo = director.mobile;
    msg = `🚨 *SUPER ALERT: ${pptType} CRITICAL DELAY*\n\n` +
          `Director Sir,\n` +
          `*User:* ${staff.name}\n` +
          `*PPT Type:* ${pptType}\n` +
          `*Delay:* ${delayDays} Days Overdue\n\n` +
          `Final escalation protocol active. Sending reminders every 2 days. 🛡️`;
  }
  
  const reminderSheet = ss.getSheetByName('PPT_Reminders');
  reminderSheet.appendRow([new Date(), staff.staff_id, month, type, targetNo, 'Sent']);
  
  sendWhatsApp(targetNo, msg);
  sendPPTEmail(staff, month, type, delayDays, null);
  
  return { success: true, message: `Alert Logged: ${type}` };
}

/**
 * EMAIL UTILITY (To Leader, CC Director & Admin)
 */
function sendPPTEmail(staff, month, type, delayDays, subId) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const director = getSheetData(ss, 'PPT_Director')[0] || { email: '' };
  const admin = getSheetData(ss, 'PPT_Admins')[0] || { email: '' };
  
  if (!staff.email) return;

  const pptType = staff.ppt_type || 'Monthly PPT';
  const portalLink = `https://sbhhospital-seven.vercel.app/?type=ppt_submit&id=${staff.staff_id}&month=${encodeURIComponent(month)}`;
  
  let subject = "";
  let body = "";

  if (type === 'Submission Confirmation') {
    subject = `✅ PPT Submission Synchronized: ${staff.name} - ${month}`;
    body = `Dear ${staff.name},\n\nYour ${pptType} for ${month} has been successfully logged (ID: ${subId}).\n\nStatus: ${delayDays > 0 ? 'Delayed by ' + delayDays + ' days' : 'Submitted On-Time'}\n\nThank you,\nSBH HOSPITAL`;
  } else {
    subject = `🔔 [${type}] PPT Submission Requirement: ${pptType}`;
    body = `Dear ${staff.name},\n\nThis is an official notification regarding your ${pptType} for ${month}.\n\nStatus: ${type}\nDelay: ${delayDays} Days\n\nPlease finalize your submission at: ${portalLink}\n\nRegards,\nSBH MANAGEMENT`;
  }

  const ccList = [director.email, admin.email].filter(e => e).join(',');
  
  try {
    MailApp.sendEmail({
      to: staff.email,
      cc: ccList,
      subject: subject,
      body: body
    });
  } catch (e) { console.log("Email Error: " + e.toString()); }
}

/**
 * WHATSAPP GATEWAY (Custom API)
 */
function sendWhatsApp(mobile, message) {
  if (!mobile) return;
  const cleanMobile = String(mobile).replace(/\D/g, '');
  const finalMobile = cleanMobile.startsWith('91') ? cleanMobile : '91' + cleanMobile;
  
  const url = "https://app.messageautosender.com/message/new" + 
              "?username=" + encodeURIComponent("SBH HOSPITAL") + 
              "&password=" + encodeURIComponent("123456789") + 
              "&receiverMobileNo=" + encodeURIComponent(finalMobile) + 
              "&message=" + encodeURIComponent(message);
  try { UrlFetchApp.fetch(url); } catch (e) {}
}

/**
 * HELPERS & CONFIG
 */
function updatePPTConfig(res) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('PPT_Config');
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === res.key) {
      sheet.getRange(i + 1, 2).setValue(res.value);
      return { success: true };
    }
  }
  sheet.appendRow([res.key, res.value]);
  return { success: true };
}

function updatePPTMaster(res) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('PPT_Master');
  const data = sheet.getDataRange().getValues();
  
  const rowData = [
    res.staff_id, res.name, res.department, res.mobile, res.email, 
    'ACTIVE', res.submission_day || 5, res.reminder_days || '', res.ppt_type || ''
  ];

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] == res.staff_id) {
      sheet.getRange(i + 1, 1, 1, rowData.length).setValues([rowData]);
      return { success: true };
    }
  }
  sheet.appendRow(rowData);
  return { success: true };
}

function updatePPTAdmins(res) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('PPT_Admins');
  sheet.appendRow([res.name, res.mobile, res.email, res.role]);
  return { success: true };
}

function updatePPTDirector(res) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('PPT_Director');
  sheet.clearContents();
  sheet.appendRow(['Name', 'Mobile', 'Email']);
  sheet.appendRow([res.name, res.mobile, res.email]);
  return { success: true };
}

function getPPTMasterById(ss, id) {
  const data = getSheetData(ss, 'PPT_Master');
  return data.find(r => r.staff_id == id);
}

function getSheetData(ss, name) {
  const sheet = ss.getSheetByName(name);
  if (!sheet) return [];
  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) return [];
  const headers = values[0].map(h => h.toString().toLowerCase().trim());
  return values.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => obj[h] = row[i]);
    return obj;
  });
}

function calculateSchedule() {
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();
  const getDayOccurrences = (targetDay) => {
    const dates = [];
    for (let d = 1; d <= 31; d++) {
      const date = new Date(year, month, d);
      if (date.getMonth() !== month) break;
      if (date.getDay() === targetDay) dates.push(new Date(date));
    }
    return dates;
  };
  const fridays = getDayOccurrences(5);
  const wednesdays = getDayOccurrences(3);
  return {
    "2nd Fri": fridays[1] ? fridays[1].toDateString() : 'N/A',
    "3rd Fri": fridays[2] ? fridays[2].toDateString() : 'N/A',
    "4th Fri": fridays[3] ? fridays[3].toDateString() : 'N/A',
    "3rd Wed": wednesdays[2] ? wednesdays[2].toDateString() : 'N/A',
    "4th Wed": wednesdays[3] ? wednesdays[3].toDateString() : 'N/A'
  };
}
