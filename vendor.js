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
  'Hospital Unit',
  'Vendor Status',
  'Products Supplied',
  'Contact Person',
  'Contact Mobile',
  'Contact Email'
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
  const params = e && e.parameter ? e.parameter : {};
  const action = params.action;
  
  if (action === 'get_vendors') {
    return getVendorsList();
  }
  if (action === 'get_last_id') {
    return getLastVendorId(params.company);
  }
  
  return ContentService.createTextOutput(JSON.stringify({
    success: true,
    message: 'SBH Vendor Management System Apps Script API is active.'
  })).setMimeType(ContentService.MimeType.JSON);
}

// POST handler
function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
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

// Fetch all vendors from Google Sheet
function getVendorsList() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) return createJsonResponse({ success: true, vendors: [] });
    
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return createJsonResponse({ success: true, vendors: [] });
    
    const headers = data[0].map(h => h.toString().trim().replace(/\s+/g, ''));
    const vendors = data.slice(1).map(row => {
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
    
    return createJsonResponse({ success: true, vendors: vendors });
  } catch (e) {
    return createJsonResponse({ success: false, message: e.toString() });
  }
}

// Fetch last vendor ID by company name for fallback sync
function getLastVendorId(companyName) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) return createJsonResponse({ success: false });
    const data = sheet.getDataRange().getValues();
    for (let i = data.length - 1; i >= 1; i--) {
      if (String(data[i][2]).toLowerCase().indexOf(String(companyName || '').toLowerCase()) > -1) {
        return createJsonResponse({ success: true, vendorId: data[i][1], folderUrl: data[i][14] });
      }
    }
    return createJsonResponse({ success: false });
  } catch(e) {
    return createJsonResponse({ success: false });
  }
}

// Main logic to register / update vendor
function processVendorRegistration(data) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    setupVendorSystem();
    sheet = ss.getSheetByName(SHEET_NAME);
  }

  const vendorStatus = String(data.vendorStatus || 'New').trim();
  const productsSupplied = String(data.productsSupplied || '').trim();
  const contactPerson = String(data.contactPerson || '').trim();
  const contactMobile = String(data.contactMobile || '').trim();
  const contactEmail = String(data.contactEmail || '').trim();

  // If Pre-Approved, search and update products & contacts
  if (vendorStatus === 'Pre-Approved') {
    const vendorId = String(data.vendorId || '').trim();
    if (!vendorId) {
      return { success: false, message: 'Vendor ID is required for Pre-Approved Vendor update.' };
    }

    const rowIndex = findVendorRowIndex(sheet, vendorId);
    if (rowIndex > -1) {
      // Products Supplied = Column 18 (index 17 in array, 18 in range)
      // Contact Person = Column 19
      // Contact Mobile = Column 20
      // Contact Email = Column 21
      const currentProducts = String(sheet.getRange(rowIndex, 18).getValue() || '').trim();
      let mergedProducts = currentProducts;
      if (productsSupplied) {
        mergedProducts = currentProducts ? (currentProducts + ', ' + productsSupplied) : productsSupplied;
      }

      sheet.getRange(rowIndex, 18).setValue(mergedProducts);
      if (contactPerson) sheet.getRange(rowIndex, 19).setValue(contactPerson);
      if (contactMobile) sheet.getRange(rowIndex, 20).setValue(contactMobile);
      if (contactEmail) sheet.getRange(rowIndex, 21).setValue(contactEmail);

      const folderUrl = sheet.getRange(rowIndex, 15).getValue();

      return {
        success: true,
        vendorId: vendorId,
        folderUrl: folderUrl,
        message: 'Pre-Approved Vendor record updated successfully!'
      };
    } else {
      return { success: false, message: `Vendor with ID ${vendorId} not found in database.` };
    }
  }

  // Otherwise, register as a New Vendor
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
    hospitalUnit,
    vendorStatus,
    productsSupplied,
    contactPerson,
    contactMobile,
    contactEmail
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

// Find vendor row index by ID
function findVendorRowIndex(sheet, vendorId) {
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][1]).trim() === String(vendorId).trim()) {
      return i + 1; // 1-indexed row number
    }
  }
  return -1;
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
