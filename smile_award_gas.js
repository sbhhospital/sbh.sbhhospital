/**
 * SBH Hospital - Smile Award System (Production v2.0)
 * Target Spreadsheet ID: 1ihkS8fjoKBxAQ5MxHutXrOoyrQAURlhhkoSkkbNcUXs
 * External Staff Master ID: 1L5fE1wnGnkdGwg-6WcMku9AP6mg1bSy4lJgOwgv4Mlk
 */

// --- META WHATSAPP API (AiSensy) ---
const META_API_URL = "https://backend.api-wa.co/campaign/myoperator/api/v2";
const META_API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY2Y2M3MDdhZTY3ODYwMTZlZDkwZDYyMSIsIm5hbWUiOiJTQkggV29tZW4gSG9zcGl0YWwgUHJpdmF0ZSBMaW1pdGVkIiwiYXBwTmFtZSI6IkFpU2Vuc3kiLCJjbGllbnRJZCI6IjY2Y2M3MDdhZTY3ODYwMTZlZDkwZDVlZCIsImFjdGl2ZVBsYW4iOiJOT05FIiwiaWF0IjoxNzI0Njc0MTcwfQ.fUK8tMgQOWRl5WTwtlRn_M4mSBoKLq2HVlpzBFOZZvg";
const META_USER_NAME = "SBH Women Hospital Private Limited";

// --- CELEBRATION IMAGES (Direct Drive Download Links) ---
const BIRTHDAY_IMAGE_URL = "https://drive.google.com/uc?export=download&id=1bhc0l3J8XKdiPOJVG_hfC27Saq1ivLly"; 
const ANNIVERSARY_IMAGE_URL = "https://drive.google.com/uc?export=download&id=1fzNq3x96Ag-dsOQgK4c7aX1yXiPcN6NB";
const WHATSAPP_GROUP_ID = "919644492116-1583132590@g.us"; 

// --- EMAIL CONFIGURATION ---
const SENDER_EMAIL = "dme@sbhhospital.com"; 
const HR_BCC_EMAILS = "hr@sbhhospital.com, dme@sbhhospital.com, asst.managerhr@sbhhospital.com";
const HOSPITAL_NAME = "SBH Group Of Hospitals";

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
        sheet.getRange(i + 1, col + 1).setValue("'" + finalVal);
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
  const data = sheet.getDataRange().getDisplayValues(); // Use Display Values for exact text
  if (data.length <= 1) return createJsonResponse([]);
  
  const headers = data[0];
  const staff = data.slice(1).map(row => {
    let obj = {};
    headers.forEach((h, i) => {
        obj[h] = row[i]; // row[i] is already a formatted string from getDisplayValues
    });
    return obj;
  });
  return createJsonResponse(staff);
}

function reformatToProfessional(val) {
  if (!val) return '';
  const sVal = val.toString().trim();
  try {
    const d = new Date(sVal);
    if (!isNaN(d.getTime())) {
      // Format as "22 December 1996"
      return Utilities.formatDate(d, "GMT+5:30", "dd MMMM yyyy");
    }
  } catch(e) {}
  return sVal;
}

function reformatDateString(val) {
  if (!val) return '';
  const sVal = val.toString().trim();
  
  // 1. If format is "22 December 1996", convert to "22-12-1996" for internal logic
  if (sVal.match(/^\d{1,2} [A-Za-z]+ \d{4}$/)) {
    try {
      const d = new Date(sVal);
      if (!isNaN(d.getTime())) {
        const day = ("0" + d.getDate()).slice(-2);
        const month = ("0" + (d.getMonth() + 1)).slice(-2);
        const year = d.getFullYear();
        return `${day}-${month}-${year}`;
      }
    } catch(e) {}
  }

  // 2. If already DD-MM-YYYY, return as is
  if (/^\d{2}-\d{2}-\d{4}$/.test(sVal)) return sVal;
  
  // 3. If format is YYYY-MM-DD or YYYY/MM/DD
  if (/^\d{4}[-/]\d{2}[-/]\d{2}$/.test(sVal)) {
    const separator = sVal.includes('-') ? '-' : '/';
    const parts = sVal.split(separator);
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  
  // 4. Try parsing with native Date as last resort
  try {
    const d = new Date(sVal);
    if (!isNaN(d.getTime())) {
      const day = ("0" + d.getDate()).slice(-2);
      const month = ("0" + (d.getMonth() + 1)).slice(-2);
      const year = d.getFullYear();
      return `${day}-${month}-${year}`;
    }
  } catch(e) {}

  return sVal;
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
  const lastRow = staffSheet.getLastRow();
  
  let finalId = data.staffId;
  
  // SEQUENTIAL ID GENERATION (ST Series)
  if (!finalId || finalId === "" || finalId.startsWith('SBH-')) {
    const lastIdRange = staffSheet.getRange(lastRow, 1).getValue().toString().trim();
    if (lastIdRange.startsWith('ST')) {
      const lastNum = parseInt(lastIdRange.replace('ST', ''));
      if (!isNaN(lastNum)) {
        finalId = 'ST' + (lastNum + 1);
      } else {
        finalId = 'ST' + (lastRow + 200); 
      }
    } else {
      finalId = 'ST' + (lastRow + 200); 
    }
  }
  
  staffSheet.appendRow([
    finalId,
    data.name,
    data.mobile || '',
    data.email || '',
    "'" + (reformatToProfessional(data.birthday) || ''),
    "'" + (reformatToProfessional(data.anniversary) || ''), 
    data.department || 'General',
    data.role || 'Staff',
    "'" + (reformatToProfessional(data.dol) || '')
  ]);
  
  return createJsonResponse({ success: true, staffId: finalId });
}

function editStaff(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const staffSheet = ss.getSheetByName('Staff_Master');
  const staffData = staffSheet.getDataRange().getValues();
  
  const targetId = String(data.staffId || "").trim().toUpperCase();
  
  for (let i = 1; i < staffData.length; i++) {
    const rowId = String(staffData[i][0] || "").trim().toUpperCase();
    if (rowId === targetId) {
       staffSheet.getRange(i + 1, 2, 1, 8).setValues([[
         data.name, 
         data.mobile || '', 
         data.email || '', 
         "'" + (reformatToProfessional(data.birthday) || ''), 
         "'" + (reformatToProfessional(data.anniversary) || ''), 
         data.department || 'General', 
         data.role || 'Staff', 
         "'" + (reformatToProfessional(data.dol) || '')
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
    const mobileStr = String(data.mobile || "").trim();
    if (!mobileStr || mobileStr === 'N/A') return createJsonResponse({ success: false, message: "No mobile" });
    
    const type = (data.type || "").toUpperCase();
    const name = data.name;
    
    if (type === 'BIRTHDAY') {
       const bdayMedia = "https://lh3.googleusercontent.com/d/1bhc0l3J8XKdiPOJVG_hfC27Saq1ivLly=s1000";
       sendMetaWhatsApp(mobileStr, "staff_birthday_wish", [name, name], bdayMedia);
       sendProfessionalCelebrationEmail(data.email, 'BIRTHDAY', name);
       
       if (WHATSAPP_GROUP_ID) {
         const groupMsg = `📢 *BIRTHDAY CELEBRATION* 🎂🎉\n\nDear *SBH Parivar*,\n\nToday is a very special day as we celebrate the birthday of our dear team member *${name}*! ✨\n\nLet's all join in wishing them a very *Happy Birthday!* 🥳🎈🎁\n\n- *SBH Group Of Hospitals* 🏥`;
         sendWhatsApp(WHATSAPP_GROUP_ID, groupMsg, bdayMedia);
       }
    } else if (type === 'ANNIVERSARY') {
       const years = data.years || 1;
       const annivMedia = "https://lh3.googleusercontent.com/d/1fzNq3x96Ag-dsOQgK4c7aX1yXiPcN6NB=s1000";
       sendMetaWhatsApp(mobileStr, "staff_anniversary_wish", [name, String(years)], annivMedia);
       sendProfessionalCelebrationEmail(data.email, 'ANNIVERSARY', name, years);

       if (WHATSAPP_GROUP_ID) {
         const groupMsg = `📢 *WORK ANNIVERSARY CELEBRATION* 🌟🏆\n\nDear *SBH Parivar*,\n\nPlease join us in congratulating *${name}* on completing *${years} year(s)* with SBH Group! 🎊✨\n\n- *SBH Group Of Hospitals* 🏥`;
         sendWhatsApp(WHATSAPP_GROUP_ID, groupMsg, annivMedia);
       }
    }
    
    return createJsonResponse({ success: true, message: "Manual wishes sent via Meta/Group" });
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

/**
 * Sends Official Meta WhatsApp via AiSensy
 */
function sendMetaWhatsApp(recipient, campaignName, templateParams, mediaUrl) {
  // Clean phone number (must be in format 91XXXXXXXXXX)
  let phone = String(recipient || "").replace(/\D/g, "");
  if (phone.length === 10) phone = "91" + phone;

  const payload = {
    apiKey: META_API_KEY,
    campaignName: campaignName,
    destination: phone,
    userName: META_USER_NAME,
    templateParams: templateParams, 
    source: "Manual-Wish-" + new Date().getTime(),
    media: mediaUrl ? {
      url: mediaUrl,
      filename: "celebration"
    } : null,
    buttons: [],
    carouselCards: [],
    location: {},
    attributes: {},
    paramsFallbackValue: {
      "FirstName": templateParams[0] || "user"
    }
  };

  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  try {
    const response = UrlFetchApp.fetch(META_API_URL, options);
    const resText = response.getContentText();
    console.log(`Meta API Status for ${phone}: ${response.getResponseCode()}`);
    console.log(`Meta API Response: ${resText}`);
    return resText;
  } catch (e) {
    console.error(`Meta API Critical Error: ${e.toString()}`);
    return null;
  }
}

/**
 * Sends a Professional HTML Email for Celebrations
 */
function sendProfessionalCelebrationEmail(recipientEmail, type, name, years) {
  if (!recipientEmail || recipientEmail === 'N/A' || !recipientEmail.includes('@')) return;

  const isBirthday = type.toUpperCase() === 'BIRTHDAY';
  const subject = isBirthday 
    ? `HAPPY BIRTHDAY ${name.toUpperCase()} - SBH GROUP OF HOSPITALS` 
    : `HAPPY WORK ANNIVERSARY ${name.toUpperCase()} - SBH GROUP OF HOSPITALS`;

  // IMAGE IDs from Google Drive
  const bdayId = "1bhc0l3J8XKdiPOJVG_hfC27Saq1ivLly";
  const annivId = "1fzNq3x96Ag-dsOQgK4c7aX1yXiPcN6NB";
  const logoId = "1L_m41iDGJn91fTT7lpqLl-gc0oRVD2KW";

  const celId = isBirthday ? bdayId : annivId;
  const mainColor = isBirthday ? "#f97316" : "#059669";
  const secondaryColor = isBirthday ? "#fb923c" : "#10b981";
  
  const greeting = isBirthday 
    ? `Wishing you a day filled with laughter, joy, and all your favorite things! Your contribution to SBH is invaluable.`
    : `Congratulations on completing ${years} incredible year(s) with SBH Group! Thank you for your unwavering dedication and excellence.`;

  // Fetch Image Data for Inline Embedding (CID)
  // Using DriveApp is the most reliable way as it uses internal permissions
  let celebrationBlob, logoBlob;
  try {
    celebrationBlob = DriveApp.getFileById(celId).getBlob().setName("celebration");
    logoBlob = DriveApp.getFileById(logoId).getBlob().setName("logo");
  } catch (e) {
    console.error("Failed to fetch images via DriveApp: " + e.toString());
    // Try fallback to UrlFetch if DriveApp fails (though DriveApp is preferred)
    try {
      celebrationBlob = UrlFetchApp.fetch(`https://lh3.googleusercontent.com/d/${celId}`).getBlob().setName("celebration");
      logoBlob = UrlFetchApp.fetch(`https://lh3.googleusercontent.com/d/${logoId}`).getBlob().setName("logo");
    } catch(err) {}
  }

  const htmlBody = `
    <html>
      <head>
        <style>
          @media only screen and (max-width: 600px) {
            .container { width: 100% !important; padding: 10px !important; }
            .card { border-radius: 16px !important; }
            .logo-box { padding: 8px 15px !important; }
            .logo-img { height: 35px !important; }
            .name-text { font-size: 20px !important; }
            .greeting-text { font-size: 13px !important; }
            .content-padding { padding: 25px 15px !important; }
          }
        </style>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f1f5f9;">
        <div class="container" style="padding: 40px 20px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
          <div class="card" style="max-width: 550px; margin: 0 auto; background-color: #ffffff; border-radius: 28px; overflow: hidden; box-shadow: 0 20px 40px -10px rgba(0,0,0,0.1); border: 1px solid #e2e8f0;">
            
            <!-- HEADER -->
            <div style="background: linear-gradient(135deg, ${mainColor} 0%, ${secondaryColor} 100%); padding: 30px 20px; text-align: center;">
              <div class="logo-box" style="background-color: rgba(255,255,255,0.95); display: inline-block; padding: 12px 25px; border-radius: 14px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
                <img src="cid:logo" class="logo-img" alt="SBH Logo" style="height: 50px; width: auto; display: block;" />
              </div>
            </div>

            <div class="content-padding" style="padding: 40px 30px; text-align: center;">
              <h2 style="color: #94a3b8; margin: 0 0 8px 0; font-size: 11px; font-weight: 800; letter-spacing: 0.25em; text-transform: uppercase;">Official SBH Greeting</h2>
              <h1 class="name-text" style="color: #0f172a; margin: 0 0 15px 0; font-size: 26px; font-weight: 900; letter-spacing: -0.5px; line-height: 1.2;">
                DEAR <span style="color: ${mainColor};">${name.toUpperCase()}</span>,
              </h1>
              
              <div style="width: 40px; height: 4px; background-color: ${mainColor}; margin: 0 auto 25px auto; border-radius: 2px;"></div>

              <p class="greeting-text" style="color: #475569; font-size: 15px; line-height: 1.7; margin: 0 0 35px 0; font-weight: 500; font-style: italic;">
                "${greeting}"
              </p>
              
              <div style="margin-bottom: 35px; padding: 8px; background-color: #f8fafc; border-radius: 24px; display: inline-block; border: 1px solid #f1f5f9;">
                <img src="cid:celebration" alt="Celebration" style="width: 100%; max-width: 480px; height: auto; border-radius: 18px; display: block;" />
              </div>
              
              <div style="padding: 25px; border-radius: 20px; border: 1px solid #f1f5f9; background-color: #fcfcfc;">
                <p style="color: #94a3b8; font-size: 10px; text-transform: uppercase; letter-spacing: 0.2em; font-weight: 800; margin-bottom: 10px;">With Sincere Best Wishes From</p>
                <h3 style="color: #0f172a; margin: 0; font-size: 18px; font-weight: 900; letter-spacing: 0.05em; text-transform: uppercase;">SBH GROUP OF HOSPITALS</h3>
                <p style="color: ${mainColor}; font-weight: 800; margin-top: 5px; font-size: 12px; letter-spacing: 1px;">"EXCELLENCE IN HEALTHCARE"</p>
              </div>
            </div>

            <!-- FOOTER -->
            <div style="background-color: #0f172a; padding: 25px; text-align: center;">
              <p style="color: #64748b; font-size: 10px; margin: 0; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase;">
                © ${new Date().getFullYear()} ${HOSPITAL_NAME} | DME & IT System
              </p>
              <div style="margin-top: 12px; height: 2px; width: 40px; background-color: ${mainColor}; margin-left: auto; margin-right: auto; border-radius: 1px; opacity: 0.4;"></div>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  const inlineImages = {};
  if (celebrationBlob) inlineImages["celebration"] = celebrationBlob;
  if (logoBlob) inlineImages["logo"] = logoBlob;

  try {
    GmailApp.sendEmail(recipientEmail, subject, "", {
      htmlBody: htmlBody,
      bcc: HR_BCC_EMAILS,
      from: SENDER_EMAIL, 
      name: HOSPITAL_NAME,
      inlineImages: inlineImages
    });
    console.log(`Professional Email sent to ${recipientEmail} with Inline Images`);
  } catch (e) {
    try {
      GmailApp.sendEmail(recipientEmail, subject, "", {
        htmlBody: htmlBody,
        bcc: HR_BCC_EMAILS,
        name: HOSPITAL_NAME,
        inlineImages: inlineImages
      });
    } catch (err) {
      console.error(`Final email failure: ${err.toString()}`);
    }
  }
}

function sendWhatsApp(recipient, message, mediaUrl) {
  const username = "SBH HOSPITAL";
  const password = "123456789";
  const baseUrl = "https://app.messageautosender.com/message/new";
  
  const recipientStr = String(recipient || "");
  const isGroup = recipientStr.includes('@g.us') || recipientStr.includes('-');
  
  const payload = {
    username: username,
    password: password,
    message: message
  };

  if (isGroup) {
    payload.groupId = recipientStr;
    payload.group_id = recipientStr; 
    payload.isGroup = "true";
    // We REMOVE receiverMobileNo entirely so the API is forced to use groupId
  } else {
    payload.receiverMobileNo = recipientStr;
    payload.isGroup = "false";
  }

  if (mediaUrl) {
    payload.filePathUrl = mediaUrl;
    payload.file = mediaUrl; 
  }

  const options = {
    method: 'post',
    payload: payload,
    muteHttpExceptions: true
  };

  try {
    const response = UrlFetchApp.fetch(baseUrl, options);
    const resBody = response.getContentText();
    console.log(`WhatsApp Status: ${response.getResponseCode()}`);
    console.log(`Full API Response: ${resBody}`);
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
    const mobile = data[i][2];
    let dob = data[i][4];
    let doj = data[i][5];
    const dol = data[i][8];
    
    if(dol) continue;
    if(!mobile || mobile.toString().trim() === '') continue;

    if (dob instanceof Date) dob = Utilities.formatDate(dob, "GMT+5:30", "dd-MM-yyyy");
    if (doj instanceof Date) doj = Utilities.formatDate(doj, "GMT+5:30", "dd-MM-yyyy");

    const dobS = dob ? dob.toString() : '';
    const dojS = doj ? doj.toString() : '';

    const isBirthday = (dob && dob.substring(0, 5) === todayStr);
    const isAnniversary = (doj && doj.substring(0, 5) === todayStr);

    if (isBirthday) {
      const bdayMedia = "https://lh3.googleusercontent.com/d/1bhc0l3J8XKdiPOJVG_hfC27Saq1ivLly=s1000";
      sendMetaWhatsApp(mobile, "staff_birthday_wish", [name, name], bdayMedia);
      sendProfessionalCelebrationEmail(data[i][3], 'BIRTHDAY', name);
      
      if (WHATSAPP_GROUP_ID) {
        const groupMsg = `📢 *BIRTHDAY CELEBRATION* 🎂🎉\n\nDear *SBH Parivar*,\n\nToday is a very special day as we celebrate the birthday of our dear team member *${name}*! ✨\n\nLet's all join in wishing them a very *Happy Birthday!* 🥳🎈🎁\n\n- *SBH Group Of Hospitals* 🏥`;
        sendWhatsApp(WHATSAPP_GROUP_ID, groupMsg, bdayMedia);
      }
    }

    if (isAnniversary) {
      // Calculate years
      let years = 1;
      try {
        const joinYear = parseInt(doj.substring(6, 10));
        if (!isNaN(joinYear)) years = todayYear - joinYear;
        if (years <= 0) years = 1;
      } catch(e) {}
      
      const annivMedia = "https://lh3.googleusercontent.com/d/1fzNq3x96Ag-dsOQgK4c7aX1yXiPcN6NB=s1000";
      sendMetaWhatsApp(mobile, "staff_anniversary_wish", [name, String(years)], annivMedia);
      sendProfessionalCelebrationEmail(data[i][3], 'ANNIVERSARY', name, years);

      if (WHATSAPP_GROUP_ID) {
        const groupMsg = `📢 *WORK ANNIVERSARY CELEBRATION* 🌟🏆\n\nDear *SBH Parivar*,\n\nPlease join us in congratulating *${name}* on completing *${years} year(s)* with SBH Group! 🎊✨\n\n- *SBH Group Of Hospitals* 🏥`;
        sendWhatsApp(WHATSAPP_GROUP_ID, groupMsg, annivMedia);
      }
    }
  }
}

/**
 * SETUP: Run this function once to enable automatic daily checking at 9:00 AM
 */
function setupAutomationTrigger() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Clear existing triggers for this function to avoid duplicates
  const triggers = ScriptApp.getProjectTriggers();
  for (let i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'dailyCheckEvents') {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }
  
  // Create new daily trigger
  ScriptApp.newTrigger('dailyCheckEvents')
    .timeBased()
    .atHour(9)
    .everyDays(1)
    .inTimezone("GMT+5:30")
    .create();
    
  Browser.msgBox("Automation Active: Birthday/Anniversary checks will now run daily at 9:00 AM.");
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

/**
 * TEST FUNCTION: Use this to check if group messages are working
 */
function testGroupMessage() {
  const testName = "TEST EMPLOYEE";
  const testMsg = `📢 *TEST CELEBRATION* 🎂🎉\n\nDear *SBH Parivar*,\n\nThis is a TEST message to verify the automation. Please ignore.\n\n- *SBH Group Of Hospitals* 🏥`;
  const testMedia = "https://lh3.googleusercontent.com/d/1bhc0l3J8XKdiPOJVG_hfC27Saq1ivLly=s1000";
  
  console.log("Starting Group Message Test...");
  console.log("Target Group ID: " + WHATSAPP_GROUP_ID);
  
  if (!WHATSAPP_GROUP_ID || WHATSAPP_GROUP_ID.includes("PASTE")) {
    console.error("Error: WHATSAPP_GROUP_ID is not set!");
    return;
  }
  
  sendWhatsApp(WHATSAPP_GROUP_ID, testMsg, testMedia);
  console.log("Test message dispatched to group!");
}
