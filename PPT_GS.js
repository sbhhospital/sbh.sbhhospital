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
    'PPT_Master': ['Staff_ID', 'Name', 'Department', 'Mobile', 'Email', 'Status', 'Submission_Day', 'Reminder_Days'],
    'PPT_Submissions': ['Submission_ID', 'Staff_ID', 'Month', 'Submitted_Date', 'PPT_Link', 'Status', 'Delay_Days'],
    'PPT_Admins': ['Name', 'Mobile', 'Role'],
    'PPT_Director': ['Name', 'Mobile'],
    'PPT_Reminders': ['Timestamp', 'Staff_ID', 'Month', 'Type', 'Target_No', 'Message_Status'],
    'PPT_Config': ['Key', 'Value']
  };
  
  Object.keys(sheets).forEach(name => {
    let sheet = ss.getSheetByName(name);
    if (!sheet) {
      sheet = ss.insertSheet(name);
      sheet.appendRow(sheets[name]);
      sheet.getRange(1, 1, 1, sheets[name].length).setFontWeight("bold").setBackground("#f3f3f3");
    }
  });

  return "Sheets Setup Successfully.";
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
    
  return "Daily Automation Trigger Protocol Activated (9:00 AM).";
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
  const currentMonth = today.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  
  let count = 0;
  master.forEach(leader => {
    const userReminderDays = (leader.reminder_days || "").split(',').map(d => d.trim());
    if (!userReminderDays.includes(dayName)) return;

    // Check if submitted for current month
    const hasSubmitted = submissions.some(s => s.staff_id == leader.staff_id && s.month === currentMonth);
    
    // IF ALREADY SUBMITTED, DO NOT SEND ANY REMINDER (Standard or Director)
    if (hasSubmitted) return;
    
    sendPPTReminder({ staff_id: leader.staff_id, month: currentMonth });
    count++;
  });
  
  return `Automated dispatch complete. Sent ${count} reminders.`;
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
  
  // Check if duplicate
  const existing = getSheetData(ss, 'PPT_Submissions').find(s => s.staff_id == res.staff_id && s.month === res.month);
  if (existing) return { success: true, message: "Submission already exists and is synchronized." };

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

  // Confirmation to Leader
  const msg = `✅ *PPT SUBMISSION CONFIRMED*\n\n` +
              `Dear *${staff.name}*,\n\n` +
              `Thank you for confirming your monthly PPT submission for *${res.month}*.\n\n` +
              `Your record (ID: *${submissionId}*) has been successfully synchronized. All automated reminders for this cycle have been deactivated. 🎊\n\n` +
              `Regards,\n` +
              `SBH HOSPITAL`;
  
  const reminderSheet = ss.getSheetByName('PPT_Reminders');
  reminderSheet.appendRow([new Date(), res.staff_id, res.month, 'Confirmation', staff.mobile, 'Sent']);
  sendWhatsApp(staff.mobile, msg);

  // NOTIFICATION TO ADMINS
  const admins = getSheetData(ss, 'PPT_Admins');
  const adminMsg = `📊 *NEW PPT SUBMISSION LOGGED*\n\n` +
                   `• *Leader:* ${staff.name}\n` +
                   `• *Dept:* ${staff.department}\n` +
                   `• *Cycle:* ${res.month}\n` +
                   `• *Status:* ${delayDays > 0 ? 'Delayed ('+delayDays+' Days)' : 'On-Time ✅'}\n\n` +
                   `Reminders for Director Sir have been deactivated for this user.`;
  
  admins.forEach(admin => {
    if (admin.mobile) sendWhatsApp(admin.mobile, adminMsg);
  });
  
  return { success: true, submissionId: submissionId, message: msg };
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
  
  let type = res.manual_type || 'Pending';
  if (!res.manual_type) {
    if (delayDays >= 15) type = 'Super Alert';
    else if (delayDays >= 10) type = 'Delayed';
  }
  
  let msg = "";
  let targetNo = staff.mobile;

  if (type === 'Pending' || type === 'Manual') {
    msg = `📢 *PPT Submission Reminder*\n\n` +
          `Dear *${staff.name}*,\n\n` +
          `Hope you are doing well.\n\n` +
          `This is a gentle reminder regarding the PPT submission for the task assigned to you.\n` +
          `If you have already submitted your PPT regularly, please feel free to ignore this message — and thank you for your timely submissions. 😊\n\n` +
          `However, if the PPT submission is still pending, we kindly request you to submit it as per the details mentioned below 👇\n\n` +
          `*Department:* ${staff.department}\n` +
          `*Task:* Please Submit PPT\n` +
          `*Deadline:* ${subDay}th of ${nextMonthName}\n\n` +
          `Your cooperation and timely submission will be highly appreciated.\n` +
          `Thank you for your understanding and support.\n\n` +
          `*Confirm Here:* https://lasik-feedback.vercel.app/?type=ppt_submit&id=${staff.staff_id}&month=${encodeURIComponent(month)}\n\n` +
          `Regards,\n` +
          `SBH HOSPITAL`;
  } 
  else if (type === 'Delayed') {
    msg = `⚠️ *URGENT: PPT Submission Overdue*\n\n` +
          `Dear *${staff.name}*,\n\n` +
          `Our records indicate that your monthly PPT for *${month}* is now significantly delayed by *${delayDays} days*.\n\n` +
          `Prompt submission is required to maintain departmental reporting standards. 🕒\n\n` +
          `*Department:* ${staff.department}\n` +
          `*Action Required:* Please submit and confirm immediately via the portal.\n\n` +
          `*Submission Link:* https://lasik-feedback.vercel.app/?type=ppt_submit&id=${staff.staff_id}&month=${encodeURIComponent(month)}\n\n` +
          `Regards,\n` +
          `SBH ADMINISTRATION`;
  }
  else if (type === 'Super Alert') {
    const director = getSheetData(ss, 'PPT_Director')[0] || { name: 'Director Sir', mobile: '' };
    targetNo = director.mobile;
    msg = `🚨 *SUPER ALERT: CRITICAL PPT DELAY*\n\n` +
          `Director Sir,\n\n` +
          `This is to bring to your attention a critical delay in PPT submission.\n\n` +
          `*User:* ${staff.name}\n` +
          `*Department:* ${staff.department}\n` +
          `*Reporting Month:* ${month}\n` +
          `*Delay Status:* ${delayDays} Days Overdue\n\n` +
          `Multiple reminders have been sent to the user. Final escalation protocol initiated. 🛡️\n\n` +
          `Regards,\n` +
          `SBH CORE SYSTEM`;
  }
  
  const reminderSheet = ss.getSheetByName('PPT_Reminders');
  reminderSheet.appendRow([new Date(), staff.staff_id, month, type, targetNo, 'Sent']);
  
  sendWhatsApp(targetNo, msg);
  
  return { success: true, message: "Reminder Logged: " + type, template: msg };
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
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] == res.staff_id) {
      sheet.getRange(i + 1, 2, 1, 7).setValues([[res.name, res.department, res.mobile, res.email, 'ACTIVE', res.submission_day || 5, res.reminder_days || '']]);
      return { success: true };
    }
  }
  sheet.appendRow([res.staff_id, res.name, res.department, res.mobile, res.email, 'ACTIVE', res.submission_day || 5, res.reminder_days || '']);
  return { success: true };
}

function updatePPTAdmins(res) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('PPT_Admins');
  sheet.appendRow([res.name, res.mobile, res.role]);
  return { success: true };
}

function updatePPTDirector(res) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('PPT_Director');
  sheet.clearContents();
  sheet.appendRow(['Name', 'Mobile']);
  sheet.appendRow([res.name, res.mobile]);
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
