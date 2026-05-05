/**
 * SBH Hospital Management System - Backend Controller
 * Features: Multi-sheet support, Auto-creation, Daily archiving, Doctor-wise reporting.
 */

function doGet(e) {
    const sheetName = e.parameter.sheet || 'OPD_Records';
    const filterDate = e.parameter.date || Utilities.formatDate(new Date(), "GMT+5:30", "dd-MM-yyyy");

    return ContentService.createTextOutput(JSON.stringify(getData(sheetName, filterDate)))
        .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const res = JSON.parse(e.postData.contents);
    const action = res.action;

    try {
        if (action === 'register') {
            const sheet = ss.getSheetByName(res.sheet);
            const id = "ID-" + Math.random().toString(36).substr(2, 9).toUpperCase();
            const date = Utilities.formatDate(new Date(), "GMT+5:30", "dd-MM-yyyy");
            sheet.appendRow([id, date, ...res.data]);
            return ContentService.createTextOutput(JSON.stringify({ success: true, id: id }))
                .setMimeType(ContentService.MimeType.JSON);
        }

        if (action === 'update') {
            const result = updateData(res.sheet, res.id, res.data);
            return ContentService.createTextOutput(JSON.stringify(result))
                .setMimeType(ContentService.MimeType.JSON);
        }

        if (action === 'saveTarget') {
            const result = saveTarget(res.date, res.doctor, res.targetCount);
            return ContentService.createTextOutput(JSON.stringify(result))
                .setMimeType(ContentService.MimeType.JSON);
        }

        if (action === 'archiveDayData') {
            const result = archiveDayData(res.sheet, res.date);
            return ContentService.createTextOutput(JSON.stringify(result))
                .setMimeType(ContentService.MimeType.JSON);
        }

        return ContentService.createTextOutput(JSON.stringify({ success: false, message: "Unknown action" }))
            .setMimeType(ContentService.MimeType.JSON);

    } catch (err) {
        return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
            .setMimeType(ContentService.MimeType.JSON);
    }
}

// --- CORE LOGIC ---

function setupSheets() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    const headerMap = {
        'OPD_Records': ['ID', 'DATE', 'NAME', 'MRD_NUMBER', 'NUMBER', 'DR_NAME', 'PATIENT_NUMBER', 'CRM', 'TIME_ALLOTED', 'STATUS', 'REMARK'],
        'SONO_Records': ['ID', 'DATE', 'NAME', 'NUMBER', 'DR_NAME', 'SCAN_NAME', 'TIME', 'STATUS', 'REMARK'],
        'Targets': ['DATE', 'DOCTOR', 'TARGET_COUNT'],
        'Archive': ['ARCHIVE_DATE', 'ORIGINAL_SHEET', 'ID', 'DATE', 'NAME', 'MRD_NUMBER', 'NUMBER', 'DR_NAME', 'PATIENT_NUMBER', 'CRM', 'TIME_ALLOTED', 'SCAN_NAME', 'TIME', 'STATUS', 'REMARK']
    };

    Object.keys(headerMap).forEach(name => {
        let sheet = ss.getSheetByName(name);
        if (!sheet) {
            sheet = ss.insertSheet(name);
            sheet.appendRow(headerMap[name]);
            sheet.setFrozenRows(1);
        }
    });
}

function archiveDayData(sheetName, date) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sourceSheet = ss.getSheetByName(sheetName);
    const archiveSheet = ss.getSheetByName('Archive');
    const data = sourceSheet.getDataRange().getValues();
    const headers = data[0];
    const archiveDate = Utilities.formatDate(new Date(), "GMT+5:30", "dd-MM-yyyy HH:mm");

    // Find rows to move
    const rowsToMove = [];
    const rowsToKeep = [headers];

    for (let i = 1; i < data.length; i++) {
        let rowDate = data[i][1];
        if (rowDate instanceof Date) rowDate = Utilities.formatDate(rowDate, "GMT+5:30", "dd-MM-yyyy");

        if (rowDate === date) {
            // Map source columns to archive columns
            // This is a simple append for now, but we could be more specific
            archiveSheet.appendRow([archiveDate, sheetName, ...data[i]]);
            rowsToMove.push(i);
        } else {
            rowsToKeep.push(data[i]);
        }
    }

    // Clear and overwrite source sheet with kept rows
    sourceSheet.clear();
    if (rowsToKeep.length > 0) {
        sourceSheet.getRange(1, 1, rowsToKeep.length, rowsToKeep[0].length).setValues(rowsToKeep);
    }
    return { success: true, count: rowsToMove.length };
}

function saveTarget(date, doctor, targetCount) {
    setupSheets();
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Targets');
    const data = sheet.getDataRange().getValues();

    // Update if exists
    for (let i = 1; i < data.length; i++) {
        let rowDate = data[i][0];
        if (rowDate instanceof Date) rowDate = Utilities.formatDate(rowDate, "GMT+5:30", "dd-MM-yyyy");
        if (rowDate === date && data[i][1] === doctor) {
            sheet.getRange(i + 1, 3).setValue(targetCount);
            return { success: true, updated: true };
        }
    }

    sheet.appendRow([date, doctor, targetCount]);
    return { success: true, new: true };
}

function getData(sheetName, filterDate) {
    setupSheets();
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(sheetName);
    const data = sheet.getDataRange().getValues();

    if (data.length <= 1) return [];

    const headers = data[0].map(h => h.toString().toLowerCase().replace(/ /g, '_'));
    const dateIdx = headers.indexOf('date');
    const result = [];

    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        let rowDate = dateIdx !== -1 ? row[dateIdx] : null;

        if (rowDate instanceof Date) {
            rowDate = Utilities.formatDate(rowDate, "GMT+5:30", "dd-MM-yyyy");
        }

        // For targets, the date might be formatted differently or we might want to skip filtering if needed
        // But for now, we filter everything by the selected date
        if (!filterDate || rowDate === filterDate) {
            let obj = {};
            headers.forEach((h, j) => {
                let val = row[j];
                if (val instanceof Date) val = Utilities.formatDate(val, "GMT+5:30", "dd-MM-yyyy");
                obj[h] = val;
            });
            result.push(obj);
        }
    }
    return result;
}

function saveData(sheetName, rowData) {
    setupSheets();
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
    const id = new Date().getTime();
    const date = Utilities.formatDate(new Date(), "GMT+5:30", "dd-MM-yyyy");

    sheet.appendRow([id, date, ...rowData]);
    return { success: true, id: id };
}

function updateData(sheetName, id, rowData) {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
    const data = sheet.getDataRange().getValues();

    for (let i = 1; i < data.length; i++) {
        if (data[i][0] == id) {
            // Keep ID (index 0), but use the date and other fields from rowData
            const fullRow = [id, ...rowData];
            sheet.getRange(i + 1, 1, 1, fullRow.length).setValues([fullRow]);
            return { success: true };
        }
    }
    return { success: false, message: "ID not found" };
}

// Daily Archive Trigger (Run nightly)
function dailyArchive() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const archive = ss.getSheetByName('Archive');
    const opd = ss.getSheetByName('OPD_Records');
    const sono = ss.getSheetByName('SONO_Records');

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = Utilities.formatDate(yesterday, "GMT+5:30", "dd-MM-yyyy");

    const moveData = (source, dept) => {
        const data = source.getDataRange().getValues();
        const toMove = data.slice(1).filter(row => row[1] === dateStr);
        toMove.forEach(row => {
            archive.appendRow([row[0], row[1], dept, row[2], row[5], row[9] || row[7], row[10] || row[8]]);
        });
    };

    moveData(opd, 'OPD');
    moveData(sono, 'SONO');
}
