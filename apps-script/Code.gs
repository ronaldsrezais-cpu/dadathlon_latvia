/**
 * Dadathlon Latvija reģistrācijas backend Google Apps Script.
 *
 * 1. Izveidojiet Google Sheet.
 * 2. Extensions → Apps Script.
 * 3. Iekopējiet šo failu. CONFIG.SITE_URL jau ir iestatīts uz Dadathlon Latvija publisko vietni.
 * 4. Palaidiet setupDadathlon() vienu reizi un apstipriniet piekļuves.
 * 5. Deploy → New deployment → Web app.
 * 6. Execute as: Me; Who has access: Anyone.
 */

const CONFIG = {
  SHEET_NAME: 'Registrations',
  REPORT_SHEET_NAME: 'Reģistrētās ģimenes',
  CHILD_SHEET_NAME: 'Bērni',
  SHIRT_LIMIT: 150,
  SITE_URL: 'https://dadathlonlatvija.com',
  EVENT_NAME: 'Dadathlon Latvija',
  EVENT_DATE: '2026. gada 12. septembrī',
  EVENT_TIME: '10:30–13:00',
  EVENT_PLACE: 'Pasta salā, Jelgavā',
  DISTANCE_INFO: 'Distance: 1 km.',
  CONTACT_EMAIL: 'latvijassportafederacijupadome@gmail.com',
};

const HEADERS = [
  'CreatedAt',
  'UpdatedAt',
  'Code',
  'Status',
  'TeamName',
  'FatherName',
  'Email',
  'Phone',
  'ChildrenCount',
  'FatherShirtSize',
  'ChildrenJSON',
  'ShirtEligible',
  'ShirtSlot',
  'Consent',
  'InformationConfirmed',
  'PhotoConsent',
];

const COL = Object.freeze({
  CREATED_AT: 1,
  UPDATED_AT: 2,
  CODE: 3,
  STATUS: 4,
  TEAM_NAME: 5,
  FATHER_NAME: 6,
  EMAIL: 7,
  PHONE: 8,
  CHILDREN_COUNT: 9,
  FATHER_SHIRT_SIZE: 10,
  CHILDREN_JSON: 11,
  SHIRT_ELIGIBLE: 12,
  SHIRT_SLOT: 13,
  CONSENT: 14,
  INFORMATION_CONFIRMED: 15,
  PHOTO_CONSENT: 16,
});

const REPORT_HEADERS = [
  'Reģistrācijas datums',
  'Pēdējās izmaiņas',
  'Pieteikuma kods',
  'Statuss',
  'Ģimenes / komandas nosaukums',
  'Tēva vārds un uzvārds',
  'E-pasts',
  'Tālrunis',
  'Bērnu skaits',
  'Kopējais dalībnieku skaits',
  'Tēva T-krekla izmērs',
  'T-krekli piešķirti',
  'T-kreklu reģistrācijas vieta',
  'Bērnu vecumi un T-kreklu izmēri',
  'Personas datu apstrāde',
  'Foto/video informācija apstiprināta',
  'Informācija pareiza / pārstāvja piekrišana',
];

const CHILD_HEADERS = [
  'Pieteikuma kods',
  'Statuss',
  'Ģimenes / komandas nosaukums',
  'Bērns Nr.',
  'Vecums',
  'T-krekla izmērs',
];

function setupDadathlon() {
  const sheet = getSheet_();
  syncReportingSheets_(sheet);
  return 'Dadathlon reģistrācijas lapas ir sagatavotas.';
}

function doGet(e) {
  try {
    const action = String((e && e.parameter && e.parameter.action) || 'status').toLowerCase();

    if (action === 'status') return jsonResponse_(getStatus_());
    if (action === 'get') return jsonResponse_(getRegistration_(String(e.parameter.code || '')));

    return jsonResponse_({ ok: false, message: 'Neatbalstīta darbība.' });
  } catch (error) {
    console.error(error);
    return jsonResponse_({ ok: false, message: safeErrorMessage_(error) });
  }
}

function doPost(e) {
  try {
    const payload = parsePayload_(e);
    const action = String(payload.action || '').toLowerCase();

    if (action === 'register') return jsonResponse_(register_(payload));
    if (action === 'update') return jsonResponse_(updateRegistration_(payload));
    if (action === 'cancel') return jsonResponse_(cancelRegistration_(payload));

    return jsonResponse_({ ok: false, message: 'Neatbalstīta darbība.' });
  } catch (error) {
    console.error(error);
    return jsonResponse_({ ok: false, message: safeErrorMessage_(error) });
  }
}

function register_(payload) {
  validatePayload_(payload);

  const lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    const sheet = getSheet_();
    const shirtSlot = getNextShirtSlot_(sheet);
    const shirtEligible = shirtSlot <= CONFIG.SHIRT_LIMIT;
    validateShirtSizes_(payload, shirtEligible);

    const code = createUniqueCode_(sheet);
    const now = new Date();
    const children = sanitizeChildren_(payload.children, shirtEligible);

    sheet.appendRow([
      now,
      now,
      code,
      'active',
      clean_(payload.teamName),
      clean_(payload.fatherName),
      clean_(payload.email).toLowerCase(),
      clean_(payload.phone),
      children.length,
      shirtEligible ? clean_(payload.fatherShirtSize) : '',
      JSON.stringify(children),
      shirtEligible,
      shirtEligible ? shirtSlot : '',
      Boolean(payload.consent),
      Boolean(payload.informationConfirmed),
      Boolean(payload.photoConsent),
    ]);

    syncReportingSheets_(sheet);

    const editUrl = buildEditUrl_(code);
    const emailSent = trySend_(function () {
      sendConfirmationEmail_({
        type: 'register',
        code,
        editUrl,
        teamName: clean_(payload.teamName),
        fatherName: clean_(payload.fatherName),
        email: clean_(payload.email).toLowerCase(),
        children,
        fatherShirtSize: shirtEligible ? clean_(payload.fatherShirtSize) : '',
        shirtEligible,
        shirtSlot: shirtEligible ? shirtSlot : null,
      });
    });

    return {
      ok: true,
      code,
      editUrl,
      shirtEligible,
      shirtSlot: shirtEligible ? shirtSlot : null,
      emailSent,
    };
  } finally {
    lock.releaseLock();
  }
}

function updateRegistration_(payload) {
  if (!payload.code) throw new Error('Nav norādīts pieteikuma kods.');
  validatePayload_(payload);

  const lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    const sheet = getSheet_();
    const found = findRegistrationRow_(sheet, clean_(payload.code));
    if (!found) throw new Error('Pieteikums ar šādu kodu nav atrasts.');

    const row = found.values;
    if (String(row[COL.STATUS - 1]).toLowerCase() === 'cancelled') {
      throw new Error('Atsauktu pieteikumu nevar labot.');
    }

    const shirtEligible = toBoolean_(row[COL.SHIRT_ELIGIBLE - 1]);
    const shirtSlot = shirtEligible ? Number(row[COL.SHIRT_SLOT - 1]) : null;
    validateShirtSizes_(payload, shirtEligible);

    const children = sanitizeChildren_(payload.children, shirtEligible);
    const now = new Date();

    const updatedRow = [
      row[COL.CREATED_AT - 1],
      now,
      clean_(payload.code),
      'active',
      clean_(payload.teamName),
      clean_(payload.fatherName),
      clean_(payload.email).toLowerCase(),
      clean_(payload.phone),
      children.length,
      shirtEligible ? clean_(payload.fatherShirtSize) : '',
      JSON.stringify(children),
      shirtEligible,
      shirtEligible ? shirtSlot : '',
      Boolean(payload.consent),
      Boolean(payload.informationConfirmed),
      Boolean(payload.photoConsent),
    ];

    sheet.getRange(found.rowNumber, 1, 1, HEADERS.length).setValues([updatedRow]);
    syncReportingSheets_(sheet);

    const editUrl = buildEditUrl_(clean_(payload.code));
    const emailSent = trySend_(function () {
      sendConfirmationEmail_({
        type: 'update',
        code: clean_(payload.code),
        editUrl,
        teamName: clean_(payload.teamName),
        fatherName: clean_(payload.fatherName),
        email: clean_(payload.email).toLowerCase(),
        children,
        fatherShirtSize: shirtEligible ? clean_(payload.fatherShirtSize) : '',
        shirtEligible,
        shirtSlot,
      });
    });

    return { ok: true, code: clean_(payload.code), editUrl, shirtEligible, shirtSlot, emailSent };
  } finally {
    lock.releaseLock();
  }
}

function cancelRegistration_(payload) {
  if (!payload.code) throw new Error('Nav norādīts pieteikuma kods.');

  const lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    const sheet = getSheet_();
    const found = findRegistrationRow_(sheet, clean_(payload.code));
    if (!found) throw new Error('Pieteikums ar šādu kodu nav atrasts.');

    sheet.getRange(found.rowNumber, COL.UPDATED_AT).setValue(new Date());
    sheet.getRange(found.rowNumber, COL.STATUS).setValue('cancelled');
    syncReportingSheets_(sheet);

    const email = String(found.values[COL.EMAIL - 1] || '');
    const teamName = String(found.values[COL.TEAM_NAME - 1] || '');
    const emailSent = email ? trySend_(function () { sendCancellationEmail_(email, teamName, clean_(payload.code)); }) : false;

    return { ok: true, message: 'Pieteikums ir atsaukts.', emailSent };
  } finally {
    lock.releaseLock();
  }
}

function getStatus_() {
  const sheet = getSheet_();
  const rows = getDataRows_(sheet);
  const totalRegistrations = rows.filter((row) => String(row[COL.STATUS - 1]).toLowerCase() === 'active').length;
  const maxAssignedSlot = rows.reduce((max, row) => {
    const value = Number(row[COL.SHIRT_SLOT - 1]) || 0;
    return Math.max(max, value);
  }, 0);
  const shirtSlotsTaken = Math.min(maxAssignedSlot, CONFIG.SHIRT_LIMIT);

  return {
    ok: true,
    totalRegistrations,
    shirtSlotsTaken,
    shirtsAvailable: maxAssignedSlot < CONFIG.SHIRT_LIMIT,
    shirtLimit: CONFIG.SHIRT_LIMIT,
  };
}

function getRegistration_(code) {
  if (!code) return { ok: false, message: 'Nav norādīts pieteikuma kods.' };

  const sheet = getSheet_();
  const found = findRegistrationRow_(sheet, clean_(code));
  if (!found) return { ok: false, message: 'Pieteikums ar šādu kodu nav atrasts.' };

  const row = found.values;
  let children = [];
  try {
    const storedChildren = JSON.parse(String(row[COL.CHILDREN_JSON - 1] || '[]'));
    children = sanitizeChildren_(storedChildren, toBoolean_(row[COL.SHIRT_ELIGIBLE - 1]));
  } catch (error) {
    children = [];
  }

  return {
    ok: true,
    registration: {
      action: 'update',
      code: String(row[COL.CODE - 1] || ''),
      status: String(row[COL.STATUS - 1] || ''),
      teamName: String(row[COL.TEAM_NAME - 1] || ''),
      fatherName: String(row[COL.FATHER_NAME - 1] || ''),
      email: String(row[COL.EMAIL - 1] || ''),
      phone: String(row[COL.PHONE - 1] || ''),
      fatherShirtSize: String(row[COL.FATHER_SHIRT_SIZE - 1] || ''),
      children,
      consent: toBoolean_(row[COL.CONSENT - 1]),
      informationConfirmed: toBoolean_(row[COL.INFORMATION_CONFIRMED - 1]),
      photoConsent: toBoolean_(row[COL.PHOTO_CONSENT - 1]),
      shirtEligible: toBoolean_(row[COL.SHIRT_ELIGIBLE - 1]),
    },
  };
}

function getSheet_() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(CONFIG.SHEET_NAME);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(CONFIG.SHEET_NAME);
    sheet.setFrozenRows(1);
  } else if (sheet.getLastColumn() > 0) {
    // Vienreizēja migrācija no agrākās formas, kurā bija atsevišķa Distance kolonna.
    const currentHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const distanceColumnIndex = currentHeaders.indexOf('Distance');
    if (distanceColumnIndex !== -1) sheet.deleteColumn(distanceColumnIndex + 1);
  }

  sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  sheet.getRange(1, 1, 1, HEADERS.length)
    .setBackground('#073482')
    .setFontColor('#ffffff')
    .setFontWeight('bold');

  return sheet;
}

function syncReportingSheets_(technicalSheet) {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const rows = getDataRows_(technicalSheet);
  const reportRows = [];
  const childRows = [];

  rows.forEach((row) => {
    const code = String(row[COL.CODE - 1] || '');
    const statusRaw = String(row[COL.STATUS - 1] || '').toLowerCase();
    const status = statusRaw === 'cancelled' ? 'Atsaukts' : 'Aktīvs';
    const teamName = String(row[COL.TEAM_NAME - 1] || '');
    const shirtEligible = toBoolean_(row[COL.SHIRT_ELIGIBLE - 1]);
    let children = [];

    try {
      children = JSON.parse(String(row[COL.CHILDREN_JSON - 1] || '[]')) || [];
    } catch (error) {
      children = [];
    }

    const childrenSummary = children
      .map((child) => `${clean_(child.age)} g.${shirtEligible && clean_(child.shirtSize) ? ` – ${clean_(child.shirtSize)}` : ''}`)
      .join('; ');

    reportRows.push([
      row[COL.CREATED_AT - 1],
      row[COL.UPDATED_AT - 1],
      code,
      status,
      teamName,
      row[COL.FATHER_NAME - 1],
      row[COL.EMAIL - 1],
      row[COL.PHONE - 1],
      Number(row[COL.CHILDREN_COUNT - 1]) || children.length,
      (Number(row[COL.CHILDREN_COUNT - 1]) || children.length) + 1,
      row[COL.FATHER_SHIRT_SIZE - 1],
      shirtEligible ? 'Jā' : 'Nē',
      row[COL.SHIRT_SLOT - 1],
      childrenSummary,
      toBoolean_(row[COL.CONSENT - 1]) ? 'Jā' : 'Nē',
      toBoolean_(row[COL.PHOTO_CONSENT - 1]) ? 'Jā' : 'Nē',
      toBoolean_(row[COL.INFORMATION_CONFIRMED - 1]) ? 'Jā' : 'Nē',
    ]);

    children.forEach((child, index) => {
      childRows.push([
        code,
        status,
        teamName,
        index + 1,
        clean_(child.age),
        shirtEligible ? clean_(child.shirtSize) : '',
      ]);
    });
  });

  const reportSheet = getOrCreateReportSheet_(spreadsheet, CONFIG.REPORT_SHEET_NAME, REPORT_HEADERS);
  const childSheet = getOrCreateReportSheet_(spreadsheet, CONFIG.CHILD_SHEET_NAME, CHILD_HEADERS);

  writeReportData_(reportSheet, REPORT_HEADERS, reportRows, [1, 2]);
  writeReportData_(childSheet, CHILD_HEADERS, childRows, []);

  // Pārskatāmā tabula lietotājam, tehnisko lapu var turēt paslēptu.
  try {
    technicalSheet.hideSheet();
  } catch (error) {
    console.log('Tehnisko lapu neizdevās paslēpt: ' + safeErrorMessage_(error));
  }
}

function getOrCreateReportSheet_(spreadsheet, name, headers) {
  let sheet = spreadsheet.getSheetByName(name);
  if (!sheet) sheet = spreadsheet.insertSheet(name);
  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  return sheet;
}

function writeReportData_(sheet, headers, rows, dateColumns) {
  const existingFilter = sheet.getFilter();
  if (existingFilter) existingFilter.remove();

  const lastRow = sheet.getLastRow();
  const lastCol = Math.max(sheet.getLastColumn(), headers.length);
  if (lastRow > 1 && lastCol > 0) {
    sheet.getRange(2, 1, lastRow - 1, lastCol).clearContent();
  }

  sheet.getRange(1, 1, 1, headers.length)
    .setValues([headers])
    .setBackground('#073482')
    .setFontColor('#ffffff')
    .setFontWeight('bold')
    .setWrap(true);

  if (rows.length) {
    sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
    sheet.getRange(1, 1, rows.length + 1, headers.length).createFilter();

    dateColumns.forEach((columnNumber) => {
      sheet.getRange(2, columnNumber, rows.length, 1).setNumberFormat('dd.mm.yyyy hh:mm');
    });

    // Atsauktos pieteikumus padara vizuāli vieglāk pamanāmus.
    const statusColumn = headers.indexOf('Statuss') + 1;
    if (statusColumn > 0) {
      const statusValues = sheet.getRange(2, statusColumn, rows.length, 1).getValues();
      statusValues.forEach((statusRow, index) => {
        if (String(statusRow[0]) === 'Atsaukts') {
          sheet.getRange(index + 2, 1, 1, headers.length).setBackground('#f2f3f5').setFontColor('#6a7280');
        }
      });
    }
  }

  sheet.autoResizeColumns(1, headers.length);
  for (let column = 1; column <= headers.length; column++) {
    const width = sheet.getColumnWidth(column);
    sheet.setColumnWidth(column, Math.min(Math.max(width, 90), 260));
  }
}

function getDataRows_(sheet) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  return sheet.getRange(2, 1, lastRow - 1, HEADERS.length).getValues();
}

function findRegistrationRow_(sheet, code) {
  const rows = getDataRows_(sheet);
  for (let i = 0; i < rows.length; i++) {
    if (String(rows[i][COL.CODE - 1]).trim().toUpperCase() === String(code).trim().toUpperCase()) {
      return { rowNumber: i + 2, values: rows[i] };
    }
  }
  return null;
}

function getNextShirtSlot_(sheet) {
  const rows = getDataRows_(sheet);
  const maxAssignedSlot = rows.reduce((max, row) => Math.max(max, Number(row[COL.SHIRT_SLOT - 1]) || 0), 0);
  return maxAssignedSlot + 1;
}

function createUniqueCode_(sheet) {
  for (let attempt = 0; attempt < 20; attempt++) {
    const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
    const code = `DAD-${randomPart}`;
    if (!findRegistrationRow_(sheet, code)) return code;
  }
  return `DAD-${Utilities.getUuid().substring(0, 8).toUpperCase()}`;
}

function validatePayload_(payload) {
  if (!clean_(payload.teamName)) throw new Error('Nav norādīts komandas nosaukums.');
  if (!clean_(payload.fatherName)) throw new Error('Nav norādīts tēva vārds un uzvārds.');
  if (!clean_(payload.email)) throw new Error('Nav norādīta e-pasta adrese.');
  if (!clean_(payload.phone)) throw new Error('Nav norādīts tālruņa numurs.');
  if (!Array.isArray(payload.children) || payload.children.length < 1) throw new Error('Jāpievieno vismaz viens bērns.');
  if (payload.children.some((child) => !clean_(child.age))) throw new Error('Norādiet katra bērna vecumu.');
  if (!payload.consent || !payload.photoConsent || !payload.informationConfirmed) throw new Error('Nav sniegti visi nepieciešamie apstiprinājumi.');
}

function validateShirtSizes_(payload, shirtEligible) {
  if (!shirtEligible) return;
  if (!clean_(payload.fatherShirtSize)) throw new Error('Nav norādīts tēva T-krekla izmērs.');
  if (payload.children.some((child) => !clean_(child.shirtSize))) throw new Error('Norādiet T-krekla izmēru katram bērnam.');
}

function sanitizeChildren_(children, keepShirtSizes) {
  return (children || []).map((child) => ({
    id: clean_(child.id) || Utilities.getUuid(),
    age: clean_(child.age),
    shirtSize: keepShirtSizes ? clean_(child.shirtSize) : '',
  }));
}

function sendConfirmationEmail_(data) {
  const subject = data.type === 'update'
    ? `Dadathlon Latvija – pieteikums atjaunots`
    : `Dadathlon Latvija – reģistrācija apstiprināta`;

  const introText = data.type === 'update'
    ? 'Jūsu Dadathlon Latvija pieteikuma izmaiņas ir veiksmīgi saglabātas.'
    : 'Paldies par reģistrāciju! Jūsu ģimenes dalība ir apstiprināta.';

  const plainBody = [
    `Labdien, ${data.teamName}!`,
    '',
    introText,
    '',
    `Datums: ${CONFIG.EVENT_DATE}`,
    'Aktivitātes visiem: no 10:30 līdz 13:00',
    `Vieta: ${CONFIG.EVENT_PLACE}`,
    'Skrējiens: 1 km ar šķēršļiem',
    `Bērnu skaits: ${data.children.length}`,
    '',
    'Skrējiena programma:',
    '11:45 – iesildīšanās · 12:00 – skrējiens',
    'Katrs dalībnieks, kas piedalīsies skrējienā, saņems medaļu.',
    '',
    'Ierodoties pasākumā, nepieciešams doties uz reģistrācijas telti, lai pieteiktu savas komandas ierašanos.',
    '',
    `Pieteikuma kods: ${data.code}`,
    'Saglabājiet pieteikuma kodu. Ar to varēsiet labot vai atsaukt pieteikumu.',
    `Labot vai atsaukt pieteikumu: ${data.editUrl}`,
    '',
    `Jautājumiem par reģistrāciju: ${CONFIG.CONTACT_EMAIL}`,
    '',
    'Tavs sportisko pasākumu draugs,',
    'Latvijas Sporta federāciju padome.',
  ].join('\n');

  // Minimāls HTML tiek izmantots tikai tam, lai e-pasta apakšā varētu parādīt mazu LSFP logo.
  // Pārējais e-pasts ir veidots kā vienkāršs teksta ziņojums bez kartēm, tabulām, pogām vai dekoratīva dizaina.
  const htmlBody = `
    <div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.55;color:#000000">
      <p>Labdien, ${escapeHtml_(data.teamName)}!</p>
      <p>${escapeHtml_(introText)}</p>

      <p>
        <strong>Datums:</strong> ${escapeHtml_(CONFIG.EVENT_DATE)}<br>
        <strong>Aktivitātes visiem:</strong> no 10:30 līdz 13:00<br>
        <strong>Vieta:</strong> ${escapeHtml_(CONFIG.EVENT_PLACE)}<br>
        <strong>Skrējiens:</strong> 1 km ar šķēršļiem<br>
        <strong>Bērnu skaits:</strong> ${data.children.length}
      </p>

      <p><strong>Skrējiena programma:</strong><br>
        11:45 – iesildīšanās · 12:00 – skrējiens<br>
        Katrs dalībnieks, kas piedalīsies skrējienā, saņems medaļu.
      </p>

      <p>Ierodoties pasākumā, nepieciešams doties uz reģistrācijas telti, lai pieteiktu savas komandas ierašanos.</p>

      <p><strong>Pieteikuma kods:</strong> ${escapeHtml_(data.code)}<br>
        Saglabājiet pieteikuma kodu. Ar to varēsiet labot vai atsaukt pieteikumu.<br>
        Labot vai atsaukt pieteikumu: <a href="${escapeHtml_(data.editUrl)}">${escapeHtml_(data.editUrl)}</a>
      </p>

      <p>Jautājumiem par reģistrāciju: ${escapeHtml_(CONFIG.CONTACT_EMAIL)}</p>

      <p>Tavs sportisko pasākumu draugs,<br>
        Latvijas Sporta federāciju padome.
      </p>

      <p><img src="cid:lsfpLogo" alt="Latvijas Sporta federāciju padome" style="display:block;width:75px;max-width:75px;height:auto;border:0"></p>
    </div>`;

  MailApp.sendEmail({
    to: data.email,
    subject,
    body: plainBody,
    htmlBody,
    inlineImages: {
      lsfpLogo: getLsfpEmailLogoBlob_(),
    },
    name: 'Dadathlon Latvija',
    replyTo: CONFIG.CONTACT_EMAIL,
  });
}

function getLsfpEmailLogoBlob_() {
  const base64 = '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';
  return Utilities.newBlob(
    Utilities.base64Decode(base64),
    'image/png',
    'lsfp-logo.png'
  );
}

function sendCancellationEmail_(email, teamName, code) {
  MailApp.sendEmail({
    to: email,
    subject: `Dadathlon Latvija – dalība atsaukta`,
    body: [
      'Labdien!',
      '',
      `Ģimenes / komandas “${teamName}” pieteikums dalībai ${CONFIG.EVENT_NAME} ir atsaukts.`,
      `Pieteikuma kods: ${code}`,
      '',
      `Jautājumiem par reģistrāciju: ${CONFIG.CONTACT_EMAIL}`,
    ].join('\n'),
    name: 'Dadathlon Latvija',
    replyTo: CONFIG.CONTACT_EMAIL,
  });
}

function trySend_(callback) {
  try {
    callback();
    return true;
  } catch (error) {
    console.error('E-pastu neizdevās nosūtīt: ' + safeErrorMessage_(error));
    return false;
  }
}

function buildEditUrl_(code) {
  return `${CONFIG.SITE_URL.replace(/\/$/, '')}/edit?code=${encodeURIComponent(code)}`;
}

function parsePayload_(e) {
  if (!e || !e.postData || !e.postData.contents) throw new Error('Nav saņemti pieteikuma dati.');
  try {
    return JSON.parse(e.postData.contents);
  } catch (error) {
    throw new Error('Pieteikuma dati nav derīgā JSON formātā.');
  }
}

function jsonResponse_(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function clean_(value) {
  return String(value == null ? '' : value).trim();
}


function toBoolean_(value) {
  return value === true || String(value).toLowerCase() === 'true';
}

function safeErrorMessage_(error) {
  return error && error.message ? String(error.message) : 'Radās neparedzēta kļūda.';
}

function escapeHtml_(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
