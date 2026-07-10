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

  let sentCount = 0;
  let failedRecipients = [];
  const subject = `🏥 SBH Hospital: Senior Leave Notification - ${leaveDetails.designation} ${leaveDetails.personName}`;

  recipients.forEach((person) => {
    try {
      MailApp.sendEmail({
        to: person.email,
        subject: subject,
        htmlBody: buildEmailHtml_(leaveDetails, settings),
        name: settings.EMAIL_FROM_NAME || 'SBH Operations Manager',
        replyTo: leaveDetails.submittedEmail || undefined
      });
      sentCount++;
    } catch (error) {
      failedRecipients.push(`${person.email} (${error.message})`);
    }
  });

  if (sentCount === 0) {
    return { recipient: recipients.map(r => r.email).join(', '), status: 'Failed', message: failedRecipients.join('; ') };
  }

  return { 
    recipient: recipients.map(r => r.email).join(', '), 
    status: 'Sent', 
    message: `Dispatched emails to ${sentCount} staff members. ${failedRecipients.length ? 'Failed: ' + failedRecipients.join('; ') : ''}` 
  };
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
  const orgName = settings.ORGANIZATION_NAME || 'SBH Group of Hospitals';
  const safe = (value) => escapeHtml_(value || '-');

  return `
    <div style="margin: 0; padding: 40px 10px; background-color: #fafafa; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1e293b;">
      <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.04); border: 1px solid #f1f5f9;">
        
        <!-- Header Panel with Amber/Orange Gradient -->
        <div style="background: linear-gradient(135deg, #f97316 0%, #f59e0b 100%); padding: 35px 30px; text-align: center; color: #ffffff;">
          <img src="https://raw.githubusercontent.com/sbhhospital/sbh.sbhhospital/main/public/publiclogo.jpg" alt="SBH Logo" style="height: 64px; margin-bottom: 16px; border-radius: 12px; object-fit: contain;" />
          <div style="font-size: 10px; font-weight: 800; letter-spacing: 0.2em; text-transform: uppercase; opacity: 0.9; margin-bottom: 6px;">${safe(orgName)}</div>
          <h1 style="margin: 0; font-size: 24px; font-weight: 900; letter-spacing: -0.02em; text-transform: uppercase;">Senior Leave Alert</h1>
        </div>

        <!-- Body content -->
        <div style="padding: 35px 30px;">
          <p style="font-size: 14px; line-height: 1.6; margin: 0 0 24px 0; color: #475569;">
            This is to notify all departments that <strong>${safe(leaveDetails.designation)} ${safe(leaveDetails.personName)}</strong> will be on scheduled leave starting from <strong>${safe(formatDate_(leaveDetails.startDate))}</strong> to <strong>${safe(formatDate_(leaveDetails.endDate))}</strong>.
          </p>

          <!-- Duration highlight card -->
          <div style="background: #fff7ed; border: 1px dashed #fed7aa; border-radius: 16px; padding: 20px; text-align: center; margin-bottom: 28px;">
            <span style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: #c2410c; letter-spacing: 0.1em; display: block; margin-bottom: 4px;">Total Leave Duration</span>
            <span style="font-size: 26px; font-weight: 900; color: #ea580c;">${safe(leaveDetails.totalDays)} Day(s)</span>
          </div>

          <!-- Parameter Roster Table -->
          <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 28px; border: 1px solid #f1f5f9; border-radius: 16px; overflow: hidden;">
            ${emailTableRow_('Senior Officer', leaveDetails.personName)}
            ${emailTableRow_('Designation', leaveDetails.designation)}
            ${emailTableRow_('Leave Type', leaveDetails.leaveType)}
            ${emailTableRow_('Start Date', formatDate_(leaveDetails.startDate))}
            ${emailTableRow_('End Date', formatDate_(leaveDetails.endDate))}
            ${emailTableRow_('Reason / Note', leaveDetails.reason || '-')}
            ${emailTableRow_('Submitted By', leaveDetails.submittedBy || '-')}
          </table>

          <!-- Warning text -->
          <div style="background: #f8fafc; border-left: 4px solid #ea580c; border-radius: 8px; padding: 16px; font-size: 12px; line-height: 1.5; color: #64748b;">
            ⚠️ <strong>Operational Dependency Note:</strong> Please coordinate approvals, clinical rosters, meetings, and emergency contacts accordingly during this leave period.
          </div>
        </div>

        <!-- Footer Bar matching Smile Award / Dashboard style -->
        <div style="background: linear-gradient(to right, #f59e0b, #10b981, #2e7d32); padding: 18px 24px; text-align: center; color: #ffffff;">
          <span style="font-size: 10px; font-weight: 900; letter-spacing: 0.25em; text-transform: uppercase;">Developed By SBH Group Of Hospitals</span>
        </div>
      </div>
    </div>
  `;
}

function emailTableRow_(label, value) {
  return `
    <tr style="border-bottom: 1px solid #f1f5f9;">
      <td style="width: 38%; padding: 14px 16px; background-color: #fef3c7; font-weight: 800; font-size: 11px; text-transform: uppercase; color: #b45309; letter-spacing: 0.05em;">${escapeHtml_(label)}</td>
      <td style="padding: 14px 16px; font-size: 13px; font-weight: 600; color: #1e293b; background-color: #ffffff;">${escapeHtml_(value || '-')}</td>
    </tr>
  `;
}

function buildWhatsAppMessage_(leaveDetails, settings) {
  const orgName = settings.ORGANIZATION_NAME || 'SBH Group Of Hospital';
  return `🏥 *${orgName.toUpperCase()}*
✨ *Senior Leave Notification*

Dear Team,

Please note that a senior staff member is on scheduled leave:

👤 *Senior:* ${leaveDetails.designation} ${leaveDetails.personName}
📌 *Leave Type:* ${leaveDetails.leaveType}
📅 *From:* ${formatDate_(leaveDetails.startDate)}
📅 *To:* ${formatDate_(leaveDetails.endDate)}
⏳ *Total Days:* ${leaveDetails.totalDays} Day(s)
📝 *Reason / Note:* ${leaveDetails.reason || '-'}
✅ *Submitted By:* ${leaveDetails.submittedBy || '-'}

⚠️ _Please plan meetings, approvals, calls, and hospital operations accordingly._

Regards,
*SBH Group Of Hospitals*

_Developed By Naman Mishra_`;
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
