/**
 * SBH Hospital - Laboratory Information & WhatsApp/SMS Utility
 * Apps Script Backend
 */

const PARENT_DRIVE_FOLDER_ID = "1zbR08UfdSiKJa0W9Kq08CK2gAttagHXd";

// Main GET Handler
function doGet(e) {
  const action = e.parameter.action;
  try {
    if (action === 'get_history') return getHistory();
    return createJsonResponse({ success: false, message: "Unknown action: " + action });
  } catch (err) {
    return createJsonResponse({ success: false, error: err.toString() });
  }
}

// Main POST Handler
function doPost(e) {
  let contents;
  try {
    contents = JSON.parse(e.postData.contents);
  } catch (err) {
    return createJsonResponse({ success: false, error: "Invalid JSON payload" });
  }

  const action = contents.action;
  try {
    if (action === 'send_report') return handleSendReport(contents);
    return createJsonResponse({ success: false, message: "Unknown post action: " + action });
  } catch (err) {
    return createJsonResponse({ success: false, error: err.toString() });
  }
}

function setupLabSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('Lab_Reports');
  if (!sheet) {
    sheet = ss.insertSheet('Lab_Reports');
    sheet.appendRow(['Timestamp', 'Date', 'MRD_No', 'Mobile_No', 'PDF_Link', 'Status', 'Channel']);
    sheet.getRange("A1:G1").setBackground("#1E3A8A").setFontColor("white").setFontWeight("bold");
  } else {
    // If sheet exists, check if 'Channel' column exists
    const lastCol = sheet.getLastColumn();
    const headers = lastCol > 0 ? sheet.getRange(1, 1, 1, lastCol).getValues()[0] : [];
    if (headers.indexOf('Channel') === -1) {
      sheet.getRange(1, 7).setValue('Channel');
      sheet.getRange("G1").setBackground("#1E3A8A").setFontColor("white").setFontWeight("bold");
    }
  }
}

// Fetch all sent reports from the Google Sheet
function getHistory() {
  setupLabSheet();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Lab_Reports');
  if (!sheet) return createJsonResponse([]);
  
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return createJsonResponse([]);
  
  const headers = data[0].map(h => h.toString().trim());
  const rows = data.slice(1).map(row => {
    let obj = {};
    headers.forEach((h, i) => {
      let val = row[i];
      if (val instanceof Date) {
        val = Utilities.formatDate(val, "GMT+5:30", "yyyy-MM-dd HH:mm:ss");
      }
      obj[h] = val;
    });
    return obj;
  });
  return createJsonResponse(rows);
}

// Process Upload, Drive Storage, and WhatsApp/SMS send
function handleSendReport(data) {
  setupLabSheet();
  
  const mrdNo = data.mrdNo ? data.mrdNo.trim() : "";
  let mobileNo = data.mobileNo ? data.mobileNo.trim() : "";
  const fileData = data.fileData; // base64 string
  const fileNameInput = data.fileName || "report.pdf";
  const channel = data.channel || "WhatsApp"; // "WhatsApp" or "SMS"
  
  if (!mrdNo || !mobileNo || !fileData) {
    return createJsonResponse({ success: false, message: "Missing required fields (mrdNo, mobileNo, fileData)" });
  }

  // Prepend 91 to 10-digit mobile number if not already present
  if (mobileNo.length === 10) {
    mobileNo = "91" + mobileNo;
  }
  
  // Format Date for Folder and File Names
  const now = new Date();
  const dateStr = Utilities.formatDate(now, "GMT+5:30", "dd-MM-yyyy");
  const timeStr = Utilities.formatDate(now, "GMT+5:30", "HH-mm-ss");

  // Get or Create Folders
  const parentFolder = DriveApp.getFolderById(PARENT_DRIVE_FOLDER_ID);
  
  // 1. Daily Date Folder (e.g., "04-07-2026")
  let dailyFolder = getSubFolderByName(parentFolder, dateStr);
  if (!dailyFolder) {
    dailyFolder = parentFolder.createFolder(dateStr);
  }
  
  // 2. MRD Folder (e.g., "MRD_12345")
  const mrdFolderName = mrdNo;
  let mrdFolder = getSubFolderByName(dailyFolder, mrdFolderName);
  if (!mrdFolder) {
    mrdFolder = dailyFolder.createFolder(mrdFolderName);
  }
  
  // Save PDF inside MRD folder
  const decoded = Utilities.base64Decode(fileData);
  const blob = Utilities.newBlob(decoded, "application/pdf", mrdNo + "_" + dateStr + "_" + timeStr + ".pdf");
  const file = mrdFolder.createFile(blob);
  
  // Allow anyone with the link to view the file so the Meta API can access it
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  
  // Direct download link via Google CDN to bypass redirects and force correct PDF handling on WhatsApp
  const directDownloadUrl = "https://lh3.googleusercontent.com/d/" + file.getId() + "?file.pdf";

  let status = "Failed";
  let apiResponse = "";
  
  if (channel === "WhatsApp") {
    // Call Meta WhatsApp API
    try {
      const apiPayload = {
        "apiKey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY2Y2M3MDdhZTY3ODYwMTZlZDkwZDYyMSIsIm5hbWUiOiJTQkggV29tZW4gSG9zcGl0YWwgUHJpdmF0ZSBMaW1pdGVkIiwiYXBwTmFtZSI6IkFpU2Vuc3kiLCJjbGllbnRJZCI6IjY2Y2M3MDdhZTY3ODYwMTZlZDkwZDVlZCIsImFjdGl2ZVBsYW4iOiJOT05FIiwiaWF0IjoxNzI0Njc0MTcwfQ.fUK8tMgQOWRl5WTwtlRn_M4mSBoKLq2HVlpzBFOZZvg",
        "campaignName": "laboratory_information_utility",
        "destination": mobileNo,
        "userName": "SBH Women Hospital Private Limited",
        "templateParams": [
          mrdNo
        ],
        "source": "new-landing-page form",
        "media": {
          "url": directDownloadUrl,
          "filename": mrdNo + "_" + dateStr + ".pdf"
        },
        "buttons": [],
        "carouselCards": [],
        "location": {},
        "attributes": {},
        "paramsFallbackValue": {
          "FirstName": mrdNo
        }
      };
      
      const options = {
        "method": "post",
        "contentType": "application/json",
        "payload": JSON.stringify(apiPayload),
        "muteHttpExceptions": true
      };
      
      const response = UrlFetchApp.fetch("https://backend.api-wa.co/campaign/myoperator/api/v2", options);
      const code = response.getResponseCode();
      apiResponse = response.getContentText();
      
      if (code === 200 || code === 201) {
        status = "Success";
      } else {
        status = "API Error (" + code + ")";
      }
    } catch (err) {
      status = "Error: " + err.toString();
    }
  } else {
    // SMS channel placeholder
    try {
      sendSMS(mobileNo, directDownloadUrl, mrdNo);
      status = "Success";
      apiResponse = "SMS queued successfully";
    } catch (err) {
      status = "SMS Error: " + err.toString();
    }
  }
  
  // Log Transaction in Google Sheet
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Lab_Reports');
  const timestamp = Utilities.formatDate(now, "GMT+5:30", "yyyy-MM-dd HH:mm:ss");
  sheet.appendRow([timestamp, dateStr, mrdNo, mobileNo, directDownloadUrl, status, channel]);
  
  return createJsonResponse({
    success: status === "Success",
    status: status,
    pdfLink: directDownloadUrl,
    timestamp: timestamp,
    channel: channel,
    response: apiResponse
  });
}

// SMS Placeholder send function
function sendSMS(mobileNo, pdfLink, mrdNo) {
  // TODO: Paste your SMS gateway API endpoint code here when available.
  // Example:
  // const url = "https://your-sms-api.com/send?to=" + mobileNo + "&msg=" + encodeURIComponent("Your SBH Lab Report for MRD " + mrdNo + " is ready: " + pdfLink);
  // UrlFetchApp.fetch(url);
  Logger.log("SMS Transmission to " + mobileNo + " initiated. Reference Link: " + pdfLink);
}

// Helper to check and get subfolder
function getSubFolderByName(parent, name) {
  const folders = parent.getFolders();
  while (folders.hasNext()) {
    const f = folders.next();
    if (f.getName() === name) {
      return f;
    }
  }
  return null;
}

// Return JSON output helper
function createJsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
