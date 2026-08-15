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
  SITE_URL: 'https://dadathlon-latvia.vercel.app',
  EVENT_NAME: 'Dadathlon Latvija',
  EVENT_DATE: '2026. gada 12. septembrī',
  EVENT_TIME: '10:00–13:00',
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
  if (!isValidEmail_(clean_(payload.email))) throw new Error('Nav norādīta derīga e-pasta adrese.');
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

  const childrenText = data.children
    .map((child, index) => `${index + 1}. bērns — ${child.age} g.${data.shirtEligible ? `, T-krekla izmērs ${child.shirtSize}` : ''}`)
    .join('\n');

  const shirtText = data.shirtEligible
    ? `Jūsu ģimenei ir rezervēti pasākuma T-krekli (reģistrācijas vieta Nr. ${data.shirtSlot}).\nTēva izmērs: ${data.fatherShirtSize}\n${childrenText}`
    : 'Dalība ir apstiprināta. 150 ģimeņu T-kreklu limits jau ir sasniegts, tādēļ T-krekli šim pieteikumam netiek rezervēti.';

  const plainBody = [
    `Labdien, ${data.fatherName}!`,
    '',
    data.type === 'update'
      ? 'Jūsu Dadathlon Latvija pieteikuma izmaiņas ir veiksmīgi saglabātas.'
      : 'Paldies par reģistrāciju! Jūsu ģimenes dalība Dadathlon Latvija pasākumā ir apstiprināta.',
    '',
    `Pasākums: ${CONFIG.EVENT_NAME}`,
    `Datums: ${CONFIG.EVENT_DATE}`,
    `Laiks: ${CONFIG.EVENT_TIME}`,
    `Vieta: ${CONFIG.EVENT_PLACE}`,
    '11:45 – iesildīšanās skrējienam',
    '12:00 – 1 km skrējiens ar šķēršļiem',
    'Katrs dalībnieks, kas piedalīsies skrējienā, saņems medaļu.',
    '',
    `Ģimene / komanda: ${data.teamName}`,
    `Bērnu skaits: ${data.children.length}`,
    '',
    shirtText,
    '',
    `Pieteikuma kods: ${data.code}`,
    `Labot vai atsaukt pieteikumu: ${data.editUrl}`,
    '',
    `Jautājumiem par reģistrāciju: ${CONFIG.CONTACT_EMAIL}`,
  ].join('\n');

  const htmlChildren = data.children
    .map((child, index) => `Bērns Nr. ${index + 1}: ${escapeHtml_(child.age)} g.${data.shirtEligible ? ` · ${escapeHtml_(child.shirtSize)}` : ''}`)
    .join('<br>');

  const htmlBody = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#172033;max-width:650px;margin:auto">
      <div style="background:#073482;color:#fff;padding:22px 26px;border-radius:14px 14px 0 0">
        <h1 style="margin:0;font-size:24px">${escapeHtml_(CONFIG.EVENT_NAME)}</h1>
      </div>
      <div style="border:1px solid #dce3ed;border-top:0;padding:26px;border-radius:0 0 14px 14px">
        <p>Labdien, <strong>${escapeHtml_(data.fatherName)}</strong>!</p>
        <p>${data.type === 'update' ? 'Jūsu pieteikuma izmaiņas ir veiksmīgi saglabātas.' : 'Paldies par reģistrāciju! Jūsu ģimenes dalība ir apstiprināta.'}</p>
        <table style="border-collapse:collapse;width:100%;margin:18px 0">
          <tr><td style="padding:7px 0;color:#637083">Datums</td><td style="padding:7px 0"><strong>${escapeHtml_(CONFIG.EVENT_DATE)}</strong></td></tr>
          <tr><td style="padding:7px 0;color:#637083">Laiks</td><td style="padding:7px 0"><strong>${escapeHtml_(CONFIG.EVENT_TIME)}</strong></td></tr>
          <tr><td style="padding:7px 0;color:#637083">Vieta</td><td style="padding:7px 0"><strong>${escapeHtml_(CONFIG.EVENT_PLACE)}</strong></td></tr>
          <tr><td style="padding:7px 0;color:#637083">Ģimene / komanda</td><td style="padding:7px 0"><strong>${escapeHtml_(data.teamName)}</strong></td></tr>
          <tr><td style="padding:7px 0;color:#637083">Skrējiens</td><td style="padding:7px 0"><strong>1 km ar šķēršļiem</strong></td></tr>
          <tr><td style="padding:7px 0;color:#637083">Bērnu skaits</td><td style="padding:7px 0"><strong>${data.children.length}</strong></td></tr>
        </table>
        <div style="background:#f4f7fb;padding:15px 17px;border-radius:10px;margin:18px 0">
          <strong style="color:#073482">11:45 – iesildīšanās · 12:00 – skrējiens</strong><br>
          Katrs dalībnieks, kas piedalīsies skrējienā, saņems medaļu.
        </div>
        <div style="background:${data.shirtEligible ? '#eaf0fb' : '#fff0f2'};padding:15px 17px;border-radius:10px;margin:18px 0">
          ${data.shirtEligible
            ? `<strong style="color:#073482">T-krekli ir rezervēti (vieta Nr. ${data.shirtSlot}).</strong><br>Tēva izmērs: ${escapeHtml_(data.fatherShirtSize)}<br>${htmlChildren}`
            : '<strong style="color:#aa1d2f">150 ģimeņu T-kreklu limits jau ir sasniegts.</strong><br>Dalība pasākumā ir apstiprināta bez T-kreklu rezervācijas.'}
        </div>
        <p>Pieteikuma kods: <strong>${escapeHtml_(data.code)}</strong></p>
        <p style="color:#637083;font-size:13px">Saglabājiet pieteikuma kodu. Ar to varēsiet labot vai atsaukt pieteikumu.</p>
        <p><a href="${escapeHtml_(data.editUrl)}" style="display:inline-block;background:#e8073c;color:white;text-decoration:none;padding:12px 18px;border-radius:9px;font-weight:bold">Labot vai atsaukt pieteikumu</a></p>
        <p style="color:#637083;font-size:13px;margin-top:25px">Jautājumiem par reģistrāciju: ${escapeHtml_(CONFIG.CONTACT_EMAIL)}</p>
      </div>
    </div>`;

  MailApp.sendEmail({
    to: data.email,
    subject,
    body: plainBody,
    htmlBody,
    name: 'Dadathlon Latvija',
    replyTo: CONFIG.CONTACT_EMAIL,
  });
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

function isValidEmail_(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
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
