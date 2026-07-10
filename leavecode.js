/**
 * Senior Leave Reminder System - Single GS File
 *
 * 1. Paste this full file in Apps Script.
 * 2. Run setupLeaveSystem() once.
 * 3. Deploy as Web App.
 * 4. Put the Web App URL in vercel/index.html as APPS_SCRIPT_URL.
 */

const SPREADSHEET_ID = '18oxdkoN5IQEO98hZbsmAlNWpNf3bQPH906qv83wqK_o';

const SHEETS = {
  LEAVE: 'Leave Records',
  STAFF: 'Staff Contacts',
  LOG: 'Reminder Log',
  SETTINGS: 'Settings'
};

const LEAVE_HEADERS = [
  'Timestamp',
  'Person Name',
  'Designation',
  'Leave Type',
  'Start Date',
  'End Date',
  'Total Days',
  'Reason / Note',
  'Submitted By',
  'Submitted Email',
  'Email Sent To',
  'WhatsApp Sent To',
  'Status'
];

const STAFF_HEADERS = ['Name', 'Mobile Number', 'Email ID', 'WhatsApp', 'Email'];
const LOG_HEADERS = ['Timestamp', 'Leave Row', 'Channel', 'Recipient', 'Status', 'Message'];

const SETTINGS_DEFAULTS = [
  ['ORGANIZATION_NAME', 'SBH Group Of Hospital'],
  ['EMAIL_FROM_NAME', 'Senior Leave Reminder System'],
  ['WHATSAPP_ENABLED', 'YES'],
  ['WHATSAPP_API_URL', 'https://app.messageautosender.com/message/new'],
  ['WHATSAPP_USERNAME', 'SBH HOSPITAL'],
  ['WHATSAPP_PASSWORD', '123456789'],
  ['WHATSAPP_COUNTRY_CODE', '91']
];

function setupLeaveSystem() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

  const leaveSheet = getOrCreateSheet_(ss, SHEETS.LEAVE);
  setupHeader_(leaveSheet, LEAVE_HEADERS);
  leaveSheet.setFrozenRows(1);
  leaveSheet.autoResizeColumns(1, LEAVE_HEADERS.length);

  const staffSheet = getOrCreateSheet_(ss, SHEETS.STAFF);
  setupHeader_(staffSheet, STAFF_HEADERS);
  staffSheet.setFrozenRows(1);
  staffSheet.autoResizeColumns(1, STAFF_HEADERS.length);
  applyYesNoValidation_(staffSheet, 4);
  applyYesNoValidation_(staffSheet, 5);

  if (staffSheet.getLastRow() === 1) {
    staffSheet.appendRow(['Example Staff', '8989828902', 'staff@example.com', 'YES', 'YES']);
  }

  const logSheet = getOrCreateSheet_(ss, SHEETS.LOG);
  setupHeader_(logSheet, LOG_HEADERS);
  logSheet.setFrozenRows(1);
  logSheet.autoResizeColumns(1, LOG_HEADERS.length);

  const settingsSheet = getOrCreateSheet_(ss, SHEETS.SETTINGS);
  setupSettings_(settingsSheet);
  settingsSheet.autoResizeColumns(1, 2);

  SpreadsheetApp.flush();
}

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Leave Reminder')
    .addItem('Setup / Repair Sheets', 'setupLeaveSystem')
    .addToUi();
}

function doGet(e) {
  const params = e && e.parameter ? e.parameter : {};

  if (params.action === 'submit') {
    return handleJsonpSubmit_(params);
  }

  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, message: 'Senior Leave Reminder API is running.' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents || '{}');
    const result = submitLeaveForm(payload);
    return jsonOutput_(result);
  } catch (error) {
    return jsonOutput_({ success: false, message: error.message });
  }
}

function handleJsonpSubmit_(params) {
  const callback = params.callback || 'callback';
  let result;

  try {
    result = submitLeaveForm(params);
  } catch (error) {
    result = { success: false, message: error.message };
  }

  return ContentService
    .createTextOutput(`${callback}(${JSON.stringify(result)});`)
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}

function submitLeaveForm(form) {
  validateLeaveForm_(form);

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const leaveSheet = getOrCreateSheet_(ss, SHEETS.LEAVE);
  const staffSheet = getOrCreateSheet_(ss, SHEETS.STAFF);
  const logSheet = getOrCreateSheet_(ss, SHEETS.LOG);
  const settings = getSettings_(ss);

  const totalDays = calculateTotalDays_(form.startDate, form.endDate);
  const staff = getStaffContacts_(staffSheet);
  const emailRecipients = staff.filter((person) => person.sendEmail && person.email);
  const whatsappRecipients = staff.filter((person) => person.sendWhatsApp && person.mobile);

  const leaveDetails = {
    personName: clean_(form.personName),
    designation: clean_(form.designation),
    leaveType: clean_(form.leaveType),
    startDate: clean_(form.startDate),
    endDate: clean_(form.endDate),
    totalDays,
    reason: clean_(form.reason),
    submittedBy: clean_(form.submittedBy),
    submittedEmail: clean_(form.submittedEmail)
  };

  leaveSheet.appendRow([
    new Date(),
    leaveDetails.personName,
    leaveDetails.designation,
    leaveDetails.leaveType,
    leaveDetails.startDate,
    leaveDetails.endDate,
    leaveDetails.totalDays,
    leaveDetails.reason,
    leaveDetails.submittedBy,
    leaveDetails.submittedEmail,
    emailRecipients.map((person) => person.email).join(', '),
    whatsappRecipients.map((person) => person.mobile).join(', '),
    'Submitted'
  ]);

  const leaveRow = leaveSheet.getLastRow();
  const emailResult = sendLeaveEmail_(leaveDetails, emailRecipients, settings);
  logReminder_(logSheet, leaveRow, 'Email', emailResult.recipient, emailResult.status, emailResult.message);

  const whatsappResults = sendLeaveWhatsApp_(leaveDetails, whatsappRecipients, settings);
  whatsappResults.forEach((result) => {
    logReminder_(logSheet, leaveRow, 'WhatsApp', result.recipient, result.status, result.message);
  });

  return {
    success: true,
    message: 'Leave details saved and reminders processed successfully.',
    totalDays,
    emailCount: emailRecipients.length,
    whatsappCount: whatsappRecipients.length
  };
}

function sendLeaveEmail_(leaveDetails, recipients, settings) {
  if (!recipients.length) {
    return { recipient: '', status: 'Skipped', message: 'No staff contact has Email = YES.' };
  }

  const to = recipients.map((person) => person.email).join(',');
  const subject = `${leaveDetails.designation} ${leaveDetails.personName} is on leave: ${formatDate_(leaveDetails.startDate)} to ${formatDate_(leaveDetails.endDate)}`;

  try {
    MailApp.sendEmail({
      to,
      subject,
      htmlBody: buildEmailHtml_(leaveDetails, settings),
      name: settings.EMAIL_FROM_NAME || 'Senior Leave Reminder System',
      replyTo: leaveDetails.submittedEmail || undefined
    });
    return { recipient: to, status: 'Sent', message: 'One combined email sent with all recipients in To.' };
  } catch (error) {
    return { recipient: to, status: 'Failed', message: error.message };
  }
}

function sendLeaveWhatsApp_(leaveDetails, recipients, settings) {
  if (String(settings.WHATSAPP_ENABLED || '').toUpperCase() !== 'YES') {
    return [{ recipient: '', status: 'Skipped', message: 'WHATSAPP_ENABLED is not YES.' }];
  }

  if (!settings.WHATSAPP_API_URL || !settings.WHATSAPP_USERNAME || !settings.WHATSAPP_PASSWORD) {
    return [{ recipient: '', status: 'Skipped', message: 'WhatsApp API URL, username, or password is missing.' }];
  }

  if (!recipients.length) {
    return [{ recipient: '', status: 'Skipped', message: 'No staff contact has WhatsApp = YES.' }];
  }

  const message = buildWhatsAppMessage_(leaveDetails, settings);

  return recipients.map((person) => {
    const mobile = normalizeMobile_(person.mobile, settings.WHATSAPP_COUNTRY_CODE || '91');
    const url = buildMessageAutoSenderUrl_(settings, mobile, person.name || 'Staff', message);

    try {
      const response = UrlFetchApp.fetch(url, { method: 'get', muteHttpExceptions: true });
      const code = response.getResponseCode();
      const body = response.getContentText();
      return {
        recipient: mobile,
        status: code >= 200 && code < 300 ? 'Sent' : 'Failed',
        message: body
      };
    } catch (error) {
      return { recipient: mobile, status: 'Failed', message: error.message };
    }
  });
}

function buildMessageAutoSenderUrl_(settings, receiverMobileNo, receiverName, message) {
  const query = {
    username: settings.WHATSAPP_USERNAME,
    password: settings.WHATSAPP_PASSWORD,
    receiverMobileNo,
    receiverName,
    message
  };

  const params = Object.keys(query)
    .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(query[key])}`)
    .join('&');

  return `${settings.WHATSAPP_API_URL}?${params}`;
}

function buildEmailHtml_(leaveDetails, settings) {
  const orgName = settings.ORGANIZATION_NAME || 'Organization';
  const safe = (value) => escapeHtml_(value || '-');

  return `
    <div style="margin:0;padding:0;background:#fff7ed;font-family:Arial,Helvetica,sans-serif;color:#182033;">
      <div style="max-width:740px;margin:0 auto;padding:30px 14px;">
        <div style="background:#ffffff;border:1px solid #f0d9c5;border-radius:20px;overflow:hidden;box-shadow:0 18px 48px rgba(88,39,16,0.16);">
          <div style="background:linear-gradient(135deg,#0f8b4c,#075a33 48%,#d92d20);color:#ffffff;padding:24px 28px;border-bottom:7px solid #f97316;">
            <div style="display:inline-block;border:1px solid rgba(255,255,255,.35);border-radius:999px;padding:7px 12px;background:rgba(255,255,255,.15);font-size:12px;font-weight:bold;letter-spacing:.08em;text-transform:uppercase;">${safe(orgName)}</div>
            <h1 style="margin:14px 0 0;font-size:26px;line-height:1.25;">Senior Leave Notification</h1>
            <p style="margin:8px 0 0;color:rgba(255,255,255,.88);font-size:14px;line-height:1.55;">Premium operational alert for approvals, meetings, and department planning.</p>
          </div>
          <div style="padding:24px 26px;">
            <p style="font-size:16px;line-height:1.65;margin:0 0 18px;color:#26324a;">
              This is to inform everyone that <strong>${safe(leaveDetails.designation)} ${safe(leaveDetails.personName)}</strong>
              will be on leave from <strong>${safe(formatDate_(leaveDetails.startDate))}</strong> to
              <strong>${safe(formatDate_(leaveDetails.endDate))}</strong>.
            </p>
            <div style="display:block;background:linear-gradient(135deg,#ecfdf3,#fff7ed,#fff1f2);border:1px solid #f0c7a4;border-radius:14px;padding:14px 16px;margin:0 0 18px;">
              <div style="font-size:12px;color:#667085;text-transform:uppercase;letter-spacing:.06em;font-weight:bold;">Total Leave Duration</div>
              <div style="font-size:24px;color:#075a33;font-weight:bold;margin-top:4px;">${safe(leaveDetails.totalDays)} day(s)</div>
            </div>
            <table role="presentation" style="width:100%;border-collapse:collapse;margin:18px 0;border:1px solid #f0d9c5;border-radius:12px;overflow:hidden;">
              ${emailTableRow_('Person Name', leaveDetails.personName)}
              ${emailTableRow_('Designation', leaveDetails.designation)}
              ${emailTableRow_('Leave Type', leaveDetails.leaveType)}
              ${emailTableRow_('Start Date', formatDate_(leaveDetails.startDate))}
              ${emailTableRow_('End Date', formatDate_(leaveDetails.endDate))}
              ${emailTableRow_('Total Days', `${leaveDetails.totalDays} day(s)`)}
              ${emailTableRow_('Reason / Note', leaveDetails.reason || '-')}
              ${emailTableRow_('Submitted By', leaveDetails.submittedBy || '-')}
            </table>
            <div style="background:#fff7ed;border-left:5px solid #f97316;border-radius:10px;padding:14px 16px;font-size:14px;line-height:1.55;color:#7c2d12;">
              Kindly plan approvals, meetings, calls, and operational dependencies accordingly.
            </div>
          </div>
          <div style="padding:14px 26px;background:linear-gradient(90deg,#ecfdf3,#fff7ed,#fff1f2);color:#667085;font-size:12px;text-align:center;font-weight:bold;">
            Developed By Naman Mishra
          </div>
        </div>
      </div>
    </div>
  `;
}

function emailTableRow_(label, value) {
  return `
    <tr>
      <td style="width:34%;padding:12px 14px;background:#ecfdf3;border-bottom:1px solid #f0d9c5;font-weight:bold;color:#075a33;">${escapeHtml_(label)}</td>
      <td style="padding:12px 14px;border-bottom:1px solid #f0d9c5;color:#182033;background:#ffffff;">${escapeHtml_(value || '-')}</td>
    </tr>
  `;
}

function buildWhatsAppMessage_(leaveDetails, settings) {
  const orgName = settings.ORGANIZATION_NAME || 'SBH Group Of Hospital';
  return `🏥 ${orgName}
✨ Senior Leave Notification

Dear Team,

👤 Senior: ${leaveDetails.designation} ${leaveDetails.personName}
📌 Leave Type: ${leaveDetails.leaveType}
📅 From: ${formatDate_(leaveDetails.startDate)}
📅 To: ${formatDate_(leaveDetails.endDate)}
⏳ Total Days: ${leaveDetails.totalDays}
📝 Reason / Note: ${leaveDetails.reason || '-'}
✅ Submitted By: ${leaveDetails.submittedBy || '-'}

⚠️ Please plan meetings, approvals, calls, and hospital operations accordingly.

Regards,
SBH Group Of Hospital

Developed By Naman Mishra`;
}

function getStaffContacts_(sheet) {
  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) return [];

  return values.slice(1)
    .filter((row) => row.some((cell) => String(cell).trim() !== ''))
    .map((row) => ({
      name: clean_(row[0]),
      mobile: clean_(row[1]),
      email: clean_(row[2]),
      sendWhatsApp: String(row[3] || '').toUpperCase() === 'YES',
      sendEmail: String(row[4] || '').toUpperCase() === 'YES'
    }));
}

function validateLeaveForm_(form) {
  ['personName', 'designation', 'leaveType', 'startDate', 'endDate'].forEach((field) => {
    if (!form || !String(form[field] || '').trim()) {
      throw new Error(`${field} is required.`);
    }
  });

  if (calculateTotalDays_(form.startDate, form.endDate) < 1) {
    throw new Error('End Date must be same as or after Start Date.');
  }
}

function calculateTotalDays_(startDate, endDate) {
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  return Math.floor((end.getTime() - start.getTime()) / 86400000) + 1;
}

function setupHeader_(sheet, headers) {
  const current = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
  const needsHeader = current.join('') === '' || current.some((cell, index) => cell !== headers[index]);

  if (needsHeader) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }

  sheet.getRange(1, 1, 1, headers.length)
    .setFontWeight('bold')
    .setBackground('#0f4c81')
    .setFontColor('#ffffff')
    .setHorizontalAlignment('center');
}

function setupSettings_(sheet) {
  setupHeader_(sheet, ['Key', 'Value']);
  const values = sheet.getDataRange().getValues();
  const existingKeys = new Set(values.slice(1).map((row) => row[0]));

  SETTINGS_DEFAULTS.forEach((setting) => {
    if (!existingKeys.has(setting[0])) {
      sheet.appendRow(setting);
    }
  });
}

function getSettings_(ss) {
  const sheet = getOrCreateSheet_(ss, SHEETS.SETTINGS);
  const values = sheet.getDataRange().getValues();
  const settings = {};

  values.slice(1).forEach((row) => {
    const key = String(row[0] || '').trim();
    if (key) settings[key] = row[1];
  });

  return settings;
}

function applyYesNoValidation_(sheet, column) {
  const rule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['YES', 'NO'], true)
    .setAllowInvalid(false)
    .build();
  sheet.getRange(2, column, Math.max(sheet.getMaxRows() - 1, 1), 1).setDataValidation(rule);
}

function getOrCreateSheet_(ss, name) {
  return ss.getSheetByName(name) || ss.insertSheet(name);
}

function logReminder_(sheet, leaveRow, channel, recipient, status, message) {
  sheet.appendRow([new Date(), leaveRow, channel, recipient, status, message]);
}

function normalizeMobile_(mobile, countryCode) {
  const digits = String(mobile || '').replace(/\D/g, '');
  const code = String(countryCode || '').replace(/\D/g, '');
  if (digits.startsWith(code) && digits.length > 10) return digits;
  if (digits.length === 10) return `${code}${digits}`;
  return digits;
}

function formatDate_(dateText) {
  if (!dateText) return '';
  const date = new Date(`${dateText}T00:00:00`);
  return Utilities.formatDate(date, Session.getScriptTimeZone(), 'dd MMM yyyy');
}

function jsonOutput_(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function clean_(value) {
  return String(value || '').trim();
}

function escapeHtml_(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
