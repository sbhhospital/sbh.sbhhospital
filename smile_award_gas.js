/**
 * SBH Hospital - Smile Award System (Production v2.0)
 * Target Spreadsheet ID: 1ihkS8fjoKBxAQ5MxHutXrOoyrQAURlhhkoSkkbNcUXs
 * External Staff Master ID: 1L5fE1wnGnkdGwg-6WcMku9AP6mg1bSy4lJgOwgv4Mlk
 */

const EXTERNAL_SS_ID = "1L5fE1wnGnkdGwg-6WcMku9AP6mg1bSy4lJgOwgv4Mlk";
const WHATSAPP_GROUP_ID = "120363406464175673@g.us"; 

function setupSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. Staff Master (STRICT ALIGNMENT)
  let staffSheet = ss.getSheetByName('Staff_Master');
  if (!staffSheet) {
    staffSheet = ss.insertSheet('Staff_Master');
    staffSheet.appendRow(['Staff_ID', 'Name', 'Mobile', 'Email', 'Birthday', 'Anniversary', 'Department', 'Role', 'DOL']);
    staffSheet.getRange("A1:I1").setBackground("#2E7D32").setFontColor("white").setFontWeight("bold");
  } else {
    // FORCE HEADERS
    staffSheet.getRange("A1:I1").setValues([['Staff_ID', 'Name', 'Mobile', 'Email', 'Birthday', 'Anniversary', 'Department', 'Role', 'DOL']]);
  }
  
  fixExistingDates();

  let finalSheet = ss.getSheetByName('Final_Winner');
  if (!finalSheet) {
    finalSheet = ss.insertSheet('Final_Winner');
    finalSheet.appendRow(['Month', 'Department', 'Employee_Name', 'Votes', 'Email', 'Mobile', 'Status', 'Approved_At']);
  } else {
    const fwHeaders = finalSheet.getRange("A1:H1").getValues()[0];
    if ((fwHeaders[0] || '').toString().trim().toLowerCase() !== 'month') {
      finalSheet.insertRowBefore(1);
      finalSheet.getRange("A1:H1").setValues([['Month', 'Department', 'Employee_Name', 'Votes', 'Email', 'Mobile', 'Status', 'Approved_At']]);
    }
  }

  // 2. Smile Entries
  let entriesSheet = ss.getSheetByName('Smile_Entries');
  if (!entriesSheet) {
    entriesSheet = ss.insertSheet('Smile_Entries');
    entriesSheet.appendRow(['Timestamp', 'Month', 'Voter_ID', 'Voter_Name', 'Employee_ID', 'Employee_Name', 'Department', 'Remarks']);
    entriesSheet.getRange("A1:H1").setBackground("#1a365d").setFontColor("white").setFontWeight("bold");
  }

  // 3. Master Summary (QUERY based leaderboard)
  let summarySheet = ss.getSheetByName('Master_Summary');
  if (!summarySheet) {
    summarySheet = ss.insertSheet('Master_Summary');
  }
  summarySheet.getRange("A1").setFormula('=QUERY(Smile_Entries!A:H, "SELECT B, F, G, COUNT(F) WHERE F IS NOT NULL GROUP BY B, F, G ORDER BY COUNT(F) DESC LABEL COUNT(F) \'Votes\'", 1)');
  
  // FORCE PLAIN TEXT for Month Columns to prevent ISO Timestamp conversion
  entriesSheet.getRange("B:B").setNumberFormat("@");
  summarySheet.getRange("A:A").setNumberFormat("@");
  
  // Force Date Columns to Plain Text
  if (staffSheet) {
    staffSheet.getRange("E:F").setNumberFormat("@");
    staffSheet.getRange("I:I").setNumberFormat("@");
  }
}

function fixExistingDates() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Staff_Master');
  if (!sheet) return;
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return;
  
  for (let i = 1; i < data.length; i++) {
    // E (Birthday), F (Anniversary), I (DOL) are indices 4, 5, 8
    const cols = [4, 5, 8];
    cols.forEach(col => {
      let val = data[i][col];
      if (!val) return;
      
      let finalVal = "";
      if (val instanceof Date) {
        finalVal = Utilities.formatDate(val, "GMT+5:30", "dd-MM-yyyy");
      } else {
        const sVal = val.toString().trim();
        // Handle YYYY-MM-DD
        if (sVal.length === 10 && sVal.charAt(4) === '-') {
           finalVal = reformatDateString(sVal);
        } else if (sVal.length === 10 && sVal.charAt(2) === '-' && sVal.charAt(5) === '-') {
           // Already DD-MM-YYYY, keep it
           finalVal = sVal;
        } else {
           // Try to parse anything else
           try {
             const d = new Date(sVal);
             if (!isNaN(d.getTime())) {
               finalVal = Utilities.formatDate(d, "GMT+5:30", "dd-MM-yyyy");
             } else {
               finalVal = sVal; // Fallback
             }
           } catch(e) {
             finalVal = sVal;
           }
        }
      }
      
      if (finalVal && finalVal !== val.toString()) {
        sheet.getRange(i + 1, col + 1).setValue(finalVal);
      }
    });
  }
}

function doGet(e) {
  const action = e.parameter.action;
  
  try {
    if (action === 'get_staff') return getStaffList();
    if (action === 'get_leaderboard') return getLeaderboardData();
    if (action === 'get_winners') return getFinalWinners();
    if (action === 'get_entries') return getEntriesList();
  } catch (err) {
    return createJsonResponse({ success: false, error: err.toString() });
  }
  return createJsonResponse({ success: false, message: "Invalid action" });
}

function getEntriesList() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Smile_Entries');
  if (!sheet) return createJsonResponse([]);
  const data = sheet.getDataRange().getDisplayValues();
  if (data.length <= 1) return createJsonResponse([]);
  
  const headers = data[0];
  const entries = data.slice(1).map(row => {
    let obj = {};
    headers.forEach((h, i) => obj[h.toLowerCase()] = row[i]);
    return obj;
  });
  // Sort by timestamp desc
  return createJsonResponse(entries.reverse());
}

function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  const action = data.action;

  try {
    if (action === 'save_vote') return saveVote(data);
    if (action === 'approve_winner') return approveWinner(data);
    if (action === 'add_staff') return addStaff(data);
    if (action === 'edit_staff') return editStaff(data);
    if (action === 'sync_staff') return syncStaff(data.externalUrl);
    if (action === 'send_manual_reminder') return sendManualReminder(data);
  } catch (err) {
    return createJsonResponse({ success: false, error: err.toString() });
  }
  return createJsonResponse({ success: false, message: "Unknown POST action" });
}

// --- LOGIC FUNCTIONS ---

function getStaffList() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Staff_Master');
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return createJsonResponse([]);
  
  const headers = data[0];
  const staff = data.slice(1).map(row => {
    let obj = {};
    headers.forEach((h, i) => {
        let val = row[i];
        if (val instanceof Date) {
             val = Utilities.formatDate(val, "GMT+5:30", "dd-MM-yyyy");
        }
        obj[h] = val;
    });
    return obj;
  });
  return createJsonResponse(staff);
}

function reformatDateString(val) {
  if (!val || typeof val !== 'string') return val;
  // If format is YYYY-MM-DD
  if (val.length === 10 && val.charAt(4) === '-') {
    const parts = val.split('-');
    // Ensure parts[2] is day, parts[1] is month, parts[0] is year
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return val;
}

function syncStaff(externalUrl) {
  let targetId = EXTERNAL_SS_ID;
  if (externalUrl) {
    const match = externalUrl.match(/[-\w]{25,}/);
    if (match) targetId = match[0];
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const localSheet = ss.getSheetByName('Staff_Master');
  
  let extSS;
  try {
    extSS = SpreadsheetApp.openById(targetId);
  } catch(e) {
    return createJsonResponse({ success: false, message: "Invalid Spreadsheet ID or URL: " + e.message });
  }

  let extSheet = extSS.getSheetByName('Staff_Master');
  if (!extSheet) extSheet = extSS.getSheets()[0];
  
  const extData = extSheet.getDataRange().getValues();
  if (extData.length <= 1) return createJsonResponse({ success: false, message: "No data found in external sheet" });
  
  const localData = localSheet.getDataRange().getValues();
  const localHeaders = localData[0];
  // A:ID, B:Name, C:Mobile, D:Email, E:Birthday, F:Anniversary
  const localNameIdx = 1;
  const localMobileIdx = 2;
  const localEmailIdx = 3;
  const localBdayIdx = 4;
  const localAnnivIdx = 5;
  
  const extHeaders = extData[0].map(h => h.toString().toLowerCase().trim());
  
  // Dynamic Column Mapping with strict Fallbacks
  const findIdx = (keywords, fallback) => {
    const idx = extHeaders.findIndex(h => keywords.some(k => h.includes(k)));
    return idx !== -1 ? idx : fallback;
  };

  const extNameIdx = findIdx(['name', 'staff name', 'employee name'], 1);
  const extMobileIdx = findIdx(['mobile', 'phone', 'contact', 'whatsapp'], 2);
  const extEmailIdx = findIdx(['email', 'mail'], 3);
  const extBdayIdx = findIdx(['birthday', 'dob', 'birth'], 4);
  const extAnnivIdx = findIdx(['anniversary', 'doj', 'joining', 'work'], 5);
  
  let addedCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;

  for (let i = 1; i < extData.length; i++) {
    const row = extData[i];
    const name = row[extNameIdx] ? row[extNameIdx].toString().trim() : '';
    const mobile = row[extMobileIdx] ? row[extMobileIdx].toString().trim() : '';
    const email = row[extEmailIdx] ? row[extEmailIdx].toString().trim() : '';
    let birthday = row[extBdayIdx];
    let anniversary = row[extAnnivIdx];
    
    if (!name && !mobile) continue;

    const formatDate = (val) => {
      if (val instanceof Date) return Utilities.formatDate(val, "GMT+5:30", "dd-MM-yyyy");
      const sVal = val ? val.toString().trim() : '';
      return reformatDateString(sVal);
    };

    birthday = formatDate(birthday);
    anniversary = formatDate(anniversary);

    // Multi-field Deduplication Check
    let existsExactly = false;
    let existingRowIdx = -1;

    for (let j = 1; j < localData.length; j++) {
      const lName = localData[j][localNameIdx] ? localData[j][localNameIdx].toString().trim() : '';
      const lMobile = localData[j][localMobileIdx] ? localData[j][localMobileIdx].toString().trim() : '';
      const lBday = formatDate(localData[j][localBdayIdx]);
      const lAnniv = formatDate(localData[j][localAnnivIdx]);

      // If everything matches, skip
      if (lName.toLowerCase() === name.toLowerCase() && 
          lMobile === mobile && 
          lBday === birthday && 
          lAnniv === anniversary) {
        existsExactly = true;
        break;
      }
      
      // If just Name and Mobile match, we might want to update it
      if (lName.toLowerCase() === name.toLowerCase() && lMobile === mobile) {
        existingRowIdx = j + 1;
      }
    }

    if (existsExactly) {
      skippedCount++;
      continue;
    }

    if (existingRowIdx > 0) {
      // Update existing if different
      localSheet.getRange(existingRowIdx, 2, 1, 8).setValues([[
        name, mobile, email, birthday, anniversary, 'General', 'Staff', ''
      ]]);
      updatedCount++;
    } else {
      // Add as new
      const nextId = "ST" + (localSheet.getLastRow() + 100);
      localSheet.appendRow([
        nextId, name, mobile, email, birthday, anniversary, 'General', 'Staff', ''
      ]);
      addedCount++;
    }
  }

  return createJsonResponse({ success: true, added: addedCount, updated: updatedCount, skipped: skippedCount });
}

function saveVote(res) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const entriesSheet = ss.getSheetByName('Smile_Entries');
  const staffSheet = ss.getSheetByName('Staff_Master');
  
  const now = new Date();
  const timestamp = Utilities.formatDate(now, "GMT+5:30", "dd-MM-yyyy HH:mm:ss");
  const month = Utilities.formatDate(now, "GMT+5:30", "MMMM yyyy");
  
  entriesSheet.appendRow([
    timestamp,
    month,
    res.voterId || 'N/A',
    res.voterName || 'Anonymous',
    res.employeeId || 'N/A',
    res.employeeName,
    res.department,
    res.remarks
  ]);
  
  return createJsonResponse({ success: true, timestamp: timestamp });
}

function getLeaderboardData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Master_Summary');
  // getDisplayValues is crucial – it takes the text as seen in the sheet (e.g. "April 2026")
  // and ignores any background Date/ISO conversion by Google
  const data = sheet.getDataRange().getDisplayValues();
  
  // Skip headers from QUERY which is at A1
  if (data.length <= 1) return createJsonResponse([]);
  
  const entries = data.slice(1).map(row => ({
    month: row[0],
    name: row[1],
    dept: row[2],
    votes: row[3]
  }));
  return createJsonResponse(entries);
}

function approveWinner(res) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Final_Winner');
  const staffSheet = ss.getSheetByName('Staff_Master');
  const now = new Date();
  const approvedAt = Utilities.formatDate(now, "GMT+5:30", "dd-MM-yyyy HH:mm:ss");
  
  // Try to find mobile number from Staff_Master
  let mobileToMessage = res.mobile || 'N/A';
  if (mobileToMessage === 'N/A' || !mobileToMessage) {
      const staffData = staffSheet.getDataRange().getValues();
      for(let i=1; i<staffData.length; i++) {
          if(staffData[i][1].toLowerCase() === res.name.toLowerCase() && staffData[i][2]) {
              mobileToMessage = staffData[i][2]; // Mobile is index 2 now
              break;
          }
      }
  }

  sheet.appendRow([
    res.month,
    res.department || res.dept,
    res.name,
    res.votes,
    res.email || 'N/A',
    mobileToMessage,
    'Approved',
    approvedAt
  ]);
  
  // Trigger automation
  sendRecognition({ ...res, mobile: mobileToMessage });
  
  return createJsonResponse({ success: true });
}

function addStaff(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const staffSheet = ss.getSheetByName('Staff_Master');
  
  // Use passed staffId from frontend (SBH-XXXX) or generate default
  const finalId = data.staffId || ("ST" + (staffSheet.getLastRow() + 100));
  
  staffSheet.appendRow([
    finalId,
    data.name,
    data.mobile || '',
    data.email || '',
    reformatDateString(data.birthday) || '',
    reformatDateString(data.anniversary) || '',
    data.department || 'General',
    data.role || 'Staff',
    reformatDateString(data.dol) || ''
  ]);
  return createJsonResponse({ success: true, staffId: finalId });
}

function editStaff(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const staffSheet = ss.getSheetByName('Staff_Master');
  const staffData = staffSheet.getDataRange().getValues();
  
  for (let i = 1; i < staffData.length; i++) {
    if (staffData[i][0] === data.staffId) {
       staffSheet.getRange(i + 1, 2, 1, 8).setValues([[
         data.name, 
         data.mobile || '', 
         data.email || '', 
         reformatDateString(data.birthday) || '', 
         reformatDateString(data.anniversary) || '', 
         data.department || 'General', 
         data.role || 'Staff', 
         reformatDateString(data.dol) || ''
       ]]);
       return createJsonResponse({ success: true, message: "Staff updated" });
    }
  }
  return createJsonResponse({ success: false, message: "Staff not found" });
}

function getFinalWinners() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Final_Winner');
    if (!sheet) return createJsonResponse([]);
    const data = sheet.getDataRange().getDisplayValues();
    if (data.length <= 1) return createJsonResponse([]);
    
    const headers = data[0];
    const winners = data.slice(1).map(row => {
        let obj = {};
        headers.forEach((h, i) => obj[h.toLowerCase()] = row[i]);
        return obj;
    });
    return createJsonResponse(winners);
}

function sendManualReminder(data) {
    const mobileStr = data.mobile ? data.mobile.toString().trim() : '';
    if (!mobileStr || mobileStr === 'N/A') return createJsonResponse({ success: false, message: "No mobile" });
    let msg = "";
    if (data.type === 'birthday') {
        msg = `🎂 Happy Birthday *${data.name}*! 🎉\n\nWishing you a fantastic day filled with joy and success from all of us! Have a great year ahead!\n\n- *SBH Group Of Hospitals*`;
    } else if (data.type === 'anniversary') {
        const yearsStr = data.years ? ` ${data.years} ` : ' ';
        msg = `🌟 Happy Work Anniversary *${data.name}*! 🎊\n\nCongratulations on completing${yearsStr}wonderful year(s) with us! We truly appreciate your hard work and dedication.\n\n- *SBH Group Of Hospitals*`;
    }
    
    if (msg) sendWhatsApp(data.mobile, msg);
    return createJsonResponse({ success: true, message: "Reminder sent" });
}

function sendRecognition(data) {
  const mobileStr = data.mobile ? data.mobile.toString().trim() : '';
  if (!mobileStr || mobileStr === 'N/A') {
    console.log("No mobile number provided for " + data.name + ". Skipping WhatsApp.");
    return;
  }

  const username = "SBH HOSPITAL";
  const password = "123456789";
  const mobile = mobileStr;
  const name = data.name;
  const month = data.month;
  const dept = data.department || data.dept;
  
  const message = `🎉 Congratulations *${name}*! You have been awarded the *Smile Award* for ${month} from the ${dept} department! 🏆\n\nYour hard work and dedication inspire us all. Keep shining! 😊\n\n- *SBH Group Of Hospitals*`;

  sendWhatsApp(mobile, message);
}

function sendWhatsApp(recipient, message) {
  const username = "SBH HOSPITAL";
  const password = "123456789";
  const baseUrl = "https://app.messageautosender.com/message/new";
  
  // Clean recipient (remove @g.us if it's just a number, but keep for groups)
  const isGroup = recipient.includes('-') || recipient.includes('@g.us') || recipient.length > 15;
  
  let finalUrl = baseUrl + 
    "?username=" + encodeURIComponent(username) +
    "&password=" + encodeURIComponent(password) +
    "&message=" + encodeURIComponent(message);

  if (isGroup) {
    // Many APIs use 'groupId' or 'chatId' for groups
    // Since we are unsure, we will try adding both parameters to be safe
    finalUrl += "&receiverMobileNo=" + encodeURIComponent(recipient);
    finalUrl += "&groupId=" + encodeURIComponent(recipient);
    finalUrl += "&isGroup=true";
  } else {
    finalUrl += "&receiverMobileNo=" + encodeURIComponent(recipient);
  }

  try {
    const response = UrlFetchApp.fetch(finalUrl);
    console.log(`WhatsApp sent to ${recipient}. Response: ${response.getContentText()}`);
  } catch (e) {
    console.error(`Failed to send WhatsApp to ${recipient}: ` + e.toString());
  }
}

// ==========================================
// AUTOMATION: RUN THIS DAILY VIA TRIGGERS
// ==========================================
function dailyCheckEvents() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Staff_Master');
  if(!sheet) return;
  const data = sheet.getDataRange().getValues();
  if(data.length <= 1) return;

  const today = new Date();
  const todayStr = Utilities.formatDate(today, "GMT+5:30", "dd-MM");
  const todayYear = parseInt(Utilities.formatDate(today, "GMT+5:30", "yyyy"));

  for(let i=1; i<data.length; i++) {
    const name = data[i][1];
    const mobile = data[i][2]; // Index 2
    let dob = data[i][4]; // Index 4 (Birthday)
    let doj = data[i][5]; // Index 5 (Anniversary)
    const dol = data[i][8]; // Index 8
    
    // SKIP IF LEFT
    if(dol) continue;

    if(!mobile || mobile.toString().trim() === '') continue;

    if (dob instanceof Date) dob = Utilities.formatDate(dob, "GMT+5:30", "dd-MM-yyyy");
    if (doj instanceof Date) doj = Utilities.formatDate(doj, "GMT+5:30", "dd-MM-yyyy");

    const dobS = dob ? dob.toString() : '';
    const dojS = doj ? doj.toString() : '';

    // Check Birthday (dd-MM-yyyy)
    if(dobS.startsWith(todayStr)) {
       const msg = `Dear *${name}*,\n\n*May you never feel lonely.*\n\nMay wonderful people and loved ones always are there in your life to support you and make you happy. \n\nWishing you a very *Happy Birthday!* 🎂🎈\n\n- *SBH Group Of Hospitals*`;
       sendWhatsApp(mobile, msg);
       
        // Send to SBH Parivar Group
        if (WHATSAPP_GROUP_ID) {
          const groupMsg = `📢 *BIRTHDAY CELEBRATION* 🎂\n\nDear *SBH Parivar*,\n\nToday is a very special day as we celebrate the birthday of our dear team member *${name}*! ✨\n\n*May you never feel lonely.*\n\nMay wonderful people and loved ones always are there in your life to support you and make you happy. \n\nLet's all join in wishing them a very *Happy Birthday!* 🥳🎈\n\n- *SBH Group Of Hospitals*`;
          sendWhatsApp(WHATSAPP_GROUP_ID, groupMsg);
        }
     }

     // Check Anniversary (dd-MM-yyyy)
     if(dojS.startsWith(todayStr)) {
        let years = 0;
        try {
            const parts = dojS.split('-');
            if (parts.length === 3) {
              const joinYear = parseInt(parts[2]);
              if (!isNaN(joinYear) && joinYear > 1900) {
                years = todayYear - joinYear;
              }
            }
        } catch(e) {}
        
        if(years > 0) {
            const msg = `Hello *${name}*,\n\n*Happy Work Anniversary!* 🎊✨\n\nCongratulations on completing *${years} Year(s)* of excellence with SBH Group! 🏆\n\nWe are incredibly grateful for your dedication and the positive impact you've made. We are so glad you chose to join us and that you choose to stay with us. ❤️\n\n- *SBH Group Of Hospitals*`;
            sendWhatsApp(mobile, msg);

            // Send to SBH Parivar Group
            if (WHATSAPP_GROUP_ID) {
              const groupMsg = `📢 *WORK ANNIVERSARY CELEBRATION* 🌟\n\nDear *SBH Parivar*,\n\nPlease join us in congratulating *${name}* on completing *${years} year(s)* with SBH Group! 🎊\n\nWe are so proud to have you in our family. Thank you for your continued dedication and excellence. ✨❤️\n\n- *SBH Group Of Hospitals*`;
              sendWhatsApp(WHATSAPP_GROUP_ID, groupMsg);
            }
        }
     }
  }
}

function createJsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * TEST FUNCTION: Run this from Apps Script Editor to test Group Messaging
 */
function testGroupMessage() {
  const testMsg = "🚀 *SBH System Test*\n\nThis is a test message to verify that the Group ID is working correctly.\n\n- *SBH IT Team*";
  console.log("Starting Group Message Test...");
  console.log("Target Group ID: " + WHATSAPP_GROUP_ID);
  
  if (!WHATSAPP_GROUP_ID || WHATSAPP_GROUP_ID.includes("PASTE")) {
    console.error("Error: WHATSAPP_GROUP_ID is not set!");
    return;
  }
  
  sendWhatsApp(WHATSAPP_GROUP_ID, testMsg);
}
