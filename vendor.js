/**
 * SBH Hospital - Vendor Management System Apps Script Backend
 * File: vendor.js (to be placed in Apps Script code.gs)
 * 
 * 1. Open Google Apps Script project for the spreadsheet.
 * 2. Paste this code.
 * 3. Run setupVendorSystem() once to create/initialize the sheet.
 * 4. Deploy as a Web App (Access: Anyone, Execute as: Me).
 * 5. Update SCRIPT_URL in the React frontend.
 */

const SPREADSHEET_ID = '1ael_Tlf3SmgeD01EJcTwIYodi3cUkKVQhRfgSYm50pM';
const PARENT_DRIVE_FOLDER_ID = '1C_1cjCeaNTZoRSQmUvLkVJ9d3kIh4KFO';
const SHEET_NAME = 'Vendor_Records';

const HEADERS = [
  'Timestamp',
  'Vendor ID',
  'Company Name',
  'Constitution',
  'MSME Declaration Files',
  'Communication Address',
  'Billing Address',
  'PAN File',
  'Bank Account Name',
  'Bank Account Number',
  'IFSC Code',
  'Canceled Cheque File',
  'GST Registration Status',
  'GSTIN',
  'Drive Folder Link',
  'Hospital Unit'
];

const UNIT_PREFIX_MAP = {
  'SBH Hospital PVT LTD': 'SBHVC-'
};

// Initialize / Setup the Spreadsheet structure
function setupVendorSystem() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(SHEET_NAME);
  
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  
  // Set headers
  sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  sheet.getRange(1, 1, 1, HEADERS.length)
    .setFontWeight('bold')
    .setBackground('#1e293b') // slate-800
    .setFontColor('#ffffff')
    .setHorizontalAlignment('center');
    
  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, HEADERS.length);
  SpreadsheetApp.flush();
}

// GET handler
function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    success: true,
    message: 'SBH Vendor Management System Apps Script API is active.'
  })).setMimeType(ContentService.MimeType.JSON);
}

// POST handler
function doPost(e) {
  // Use script lock to prevent race conditions during Vendor ID generation
  const lock = LockService.getScriptLock();
  try {
    // Wait for up to 30 seconds for lock
    lock.waitLock(30000);
  } catch (err) {
    return createJsonResponse({ success: false, message: 'Server busy, please try again.' });
  }

  try {
    const payload = JSON.parse(e.postData.contents || '{}');
    const result = processVendorRegistration(payload);
    return createJsonResponse(result);
  } catch (error) {
    return createJsonResponse({ success: false, message: error.toString() });
  } finally {
    lock.releaseLock();
  }
}

// Main logic to register vendor
function processVendorRegistration(data) {
  const companyName = String(data.companyName || '').trim();
  const constitution = String(data.constitution || '').trim();
  const commAddress = String(data.commAddress || '').trim();
  const billingAddress = String(data.billingAddress || '').trim();
  const bankAccName = String(data.bankAccName || '').trim();
  const bankAccNo = String(data.bankAccNo || '').trim();
  const ifscCode = String(data.ifscCode || '').trim();
  const gstStatus = String(data.gstStatus || '').trim();
  const gstin = String(data.gstin || '').trim();
  const hospitalUnit = String(data.hospitalUnit || '').trim();
  
  if (!companyName || !constitution || !hospitalUnit || !bankAccNo || !ifscCode) {
    return { success: false, message: 'Missing required text fields.' };
  }
  
  // 1. Generate unique Vendor ID
  const vendorId = generateVendorId(hospitalUnit);
  
  // 2. Access/Create Parent folder
  const parentFolder = DriveApp.getFolderById(PARENT_DRIVE_FOLDER_ID);
  
  // 3. Create Vendor specific folder
  const folderName = `${vendorId} - ${companyName}`;
  const vendorFolder = parentFolder.createFolder(folderName);
  vendorFolder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  const folderUrl = vendorFolder.getUrl();
  
  // 4. Upload files
  let msmeUrls = [];
  let panUrls = [];
  let chequeUrls = [];
  
  // Handle MSME Multiple Files
  if (Array.isArray(data.msmeFiles)) {
    data.msmeFiles.forEach((file, index) => {
      if (file && file.base64 && file.name) {
        const fileUrl = uploadFileToFolder(vendorFolder, file.base64, `MSME_${index + 1}_${file.name}`);
        msmeUrls.push(fileUrl);
      }
    });
  }
  
  // Handle PAN Files
  if (Array.isArray(data.panFiles)) {
    data.panFiles.forEach((file, index) => {
      if (file && file.base64 && file.name) {
        const fileUrl = uploadFileToFolder(vendorFolder, file.base64, `PAN_${index + 1}_${file.name}`);
        panUrls.push(fileUrl);
      }
    });
  }
  
  // Handle Canceled Cheque Files
  if (Array.isArray(data.chequeFiles)) {
    data.chequeFiles.forEach((file, index) => {
      if (file && file.base64 && file.name) {
        const fileUrl = uploadFileToFolder(vendorFolder, file.base64, `CHEQUE_${index + 1}_${file.name}`);
        chequeUrls.push(fileUrl);
      }
    });
  }
  
  // 5. Append to Spreadsheet
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    setupVendorSystem();
    sheet = ss.getSheetByName(SHEET_NAME);
  }
  
  const timestamp = new Date();
  
  sheet.appendRow([
    timestamp,
    vendorId,
    companyName,
    constitution,
    msmeUrls.join(', '),
    commAddress,
    billingAddress,
    panUrls.join(', '),
    bankAccName,
    bankAccNo,
    ifscCode,
    chequeUrls.join(', '),
    gstStatus,
    gstin,
    folderUrl,
    hospitalUnit
  ]);
  
  // Auto fit columns
  try {
    sheet.autoResizeColumns(1, HEADERS.length);
  } catch(e) {}
  
  return {
    success: true,
    vendorId: vendorId,
    folderUrl: folderUrl,
    message: 'Vendor registered successfully!'
  };
}

// Helper to generate unique incrementing Vendor ID
function generateVendorId(unitName) {
  const prefix = UNIT_PREFIX_MAP[unitName] || 'SBHVC-';
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    return `${prefix}00001`;
  }
  
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) {
    return `${prefix}00001`;
  }
  
  let maxNum = 0;
  for (let i = 1; i < data.length; i++) {
    const vId = String(data[i][1] || ''); // column 2 is Vendor ID
    if (vId.startsWith(prefix)) {
      const numStr = vId.replace(prefix, '');
      const num = parseInt(numStr, 10);
      if (!isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    }
  }
  
  const nextNum = maxNum + 1;
  const nextNumStr = String(nextNum).padStart(5, '0');
  return `${prefix}${nextNumStr}`;
}

// Helper to decode Base64 file and save in folder
function uploadFileToFolder(folder, base64Data, fileName) {
  try {
    // Strip header metadata if exists (e.g. data:application/pdf;base64,)
    let rawBase64 = base64Data;
    let mimeType = 'application/octet-stream';
    
    if (base64Data.indexOf(';base64,') > -1) {
      const parts = base64Data.split(';base64,');
      rawBase64 = parts[1];
      mimeType = parts[0].split(':')[1];
    }
    
    const decoded = Utilities.base64Decode(rawBase64);
    const blob = Utilities.newBlob(decoded, mimeType, fileName);
    const file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return file.getUrl();
  } catch (e) {
    return `Upload Failed: ${e.toString()}`;
  }
}

// Return JSON helper
function createJsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
