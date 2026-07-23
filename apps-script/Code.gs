/**
 * Dadathlon Jelgava 2026 reģistrācijas backend Google Apps Script.
 *
 * 1. Izveidojiet Google Sheet.
 * 2. Extensions → Apps Script.
 * 3. Iekopējiet šo failu un nomainiet CONFIG.SITE_URL.
 * 4. Deploy → New deployment → Web app.
 * 5. Execute as: Me; Who has access: Anyone.
 */

const CONFIG = {
  SHEET_NAME: 'Registrations',
  SHIRT_LIMIT: 150,
  SITE_URL: 'https://YOUR-SITE.vercel.app',
  EVENT_NAME: 'Dadathlon Jelgava 2026',
  EVENT_DATE: '2026. gada 12. septembrī',
  EVENT_PLACE: 'Pasta salā, Jelgavā',
  CONTACT_EMAIL: 'lsfp@lsfp.lv',
};

const HEADERS = [
  'CreatedAt',
  'UpdatedAt',
  'Code',
  'Status',
  'TeamName',
  'Distance',
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
];

const COL = Object.freeze({
  CREATED_AT: 1,
  UPDATED_AT: 2,
  CODE: 3,
  STATUS: 4,
  TEAM_NAME: 5,
  DISTANCE: 6,
  FATHER_NAME: 7,
  EMAIL: 8,
  PHONE: 9,
  CHILDREN_COUNT: 10,
  FATHER_SHIRT_SIZE: 11,
  CHILDREN_JSON: 12,
  SHIRT_ELIGIBLE: 13,
  SHIRT_SLOT: 14,
  CONSENT: 15,
  INFORMATION_CONFIRMED: 16,
});

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
    const code = createUniqueCode_(sheet);
    const now = new Date();
    const children = sanitizeChildren_(payload.children, shirtEligible);

    sheet.appendRow([
      now,
      now,
      code,
      'active',
      clean_(payload.teamName),
      clean_(payload.distance),
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
    ]);

    const editUrl = buildEditUrl_(code);
    trySend_(function () {
      sendConfirmationEmail_({
      type: 'register',
      code,
      editUrl,
      teamName: clean_(payload.teamName),
      fatherName: clean_(payload.fatherName),
      email: clean_(payload.email).toLowerCase(),
      distance: clean_(payload.distance),
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
    const children = sanitizeChildren_(payload.children, shirtEligible);
    const now = new Date();

    const updatedRow = [
      row[COL.CREATED_AT - 1],
      now,
      clean_(payload.code),
      'active',
      clean_(payload.teamName),
      clean_(payload.distance),
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
    ];

    sheet.getRange(found.rowNumber, 1, 1, HEADERS.length).setValues([updatedRow]);

    trySend_(function () {
      sendConfirmationEmail_({
      type: 'update',
      code: clean_(payload.code),
      editUrl: buildEditUrl_(clean_(payload.code)),
      teamName: clean_(payload.teamName),
      fatherName: clean_(payload.fatherName),
      email: clean_(payload.email).toLowerCase(),
      distance: clean_(payload.distance),
      children,
      fatherShirtSize: shirtEligible ? clean_(payload.fatherShirtSize) : '',
      shirtEligible,
      shirtSlot,
      });
    });

    return { ok: true, code: clean_(payload.code), shirtEligible, shirtSlot };
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

    const email = String(found.values[COL.EMAIL - 1] || '');
    const teamName = String(found.values[COL.TEAM_NAME - 1] || '');
    if (email) trySend_(function () { sendCancellationEmail_(email, teamName, clean_(payload.code)); });

    return { ok: true, message: 'Pieteikums ir atsaukts.' };
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
    children = JSON.parse(String(row[COL.CHILDREN_JSON - 1] || '[]'));
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
      distance: String(row[COL.DISTANCE - 1] || ''),
      fatherName: String(row[COL.FATHER_NAME - 1] || ''),
      email: String(row[COL.EMAIL - 1] || ''),
      phone: String(row[COL.PHONE - 1] || ''),
      fatherShirtSize: String(row[COL.FATHER_SHIRT_SIZE - 1] || ''),
      children,
      consent: toBoolean_(row[COL.CONSENT - 1]),
      informationConfirmed: toBoolean_(row[COL.INFORMATION_CONFIRMED - 1]),
      shirtEligible: toBoolean_(row[COL.SHIRT_ELIGIBLE - 1]),
    },
  };
}

function getSheet_() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(CONFIG.SHEET_NAME);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(CONFIG.SHEET_NAME);
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, HEADERS.length)
      .setBackground('#073482')
      .setFontColor('#ffffff')
      .setFontWeight('bold');
    sheet.autoResizeColumns(1, HEADERS.length);
  } else if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  }

  return sheet;
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
  if (!['500 m', '1 km', '2,5 km'].includes(clean_(payload.distance))) throw new Error('Nav izvēlēta derīga distance.');
  if (!clean_(payload.fatherName)) throw new Error('Nav norādīts tēva vārds un uzvārds.');
  if (!isValidEmail_(clean_(payload.email))) throw new Error('Nav norādīta derīga e-pasta adrese.');
  if (!clean_(payload.phone)) throw new Error('Nav norādīts tālruņa numurs.');
  if (!Array.isArray(payload.children) || payload.children.length < 1) throw new Error('Jāpievieno vismaz viens bērns.');
  if (payload.children.some((child) => !clean_(child.name) || !clean_(child.age))) throw new Error('Norādiet katra bērna vārdu un vecumu.');
  if (!payload.consent || !payload.informationConfirmed) throw new Error('Nav sniegti nepieciešamie apstiprinājumi.');
}

function sanitizeChildren_(children, keepShirtSizes) {
  return (children || []).map((child) => ({
    id: clean_(child.id) || Utilities.getUuid(),
    name: clean_(child.name),
    age: clean_(child.age),
    shirtSize: keepShirtSizes ? clean_(child.shirtSize) : '',
  }));
}

function sendConfirmationEmail_(data) {
  const subject = data.type === 'update'
    ? `Atjaunots pieteikums dalībai ${CONFIG.EVENT_NAME}`
    : `Apstiprinājums dalībai ${CONFIG.EVENT_NAME}`;

  const childrenText = data.children
    .map((child, index) => `${index + 1}. ${child.name}, ${child.age} g. ${data.shirtEligible ? `— izmērs ${child.shirtSize}` : ''}`)
    .join('\n');

  const shirtText = data.shirtEligible
    ? `Jūsu ģimenei ir rezervēti T-krekli (reģistrācijas vieta Nr. ${data.shirtSlot}).\nTēva izmērs: ${data.fatherShirtSize}\n${childrenText}`
    : 'Dalība ir apstiprināta. T-kreklu komplektu limits jau ir sasniegts, tādēļ T-kreklu izmēri pieteikumā netiek rezervēti.';

  const plainBody = [
    `Labdien, ${data.fatherName}!`,
    '',
    data.type === 'update' ? 'Jūsu Dadathlon pieteikuma izmaiņas ir saglabātas.' : 'Jūsu ģimenes dalība Dadathlon pasākumā ir apstiprināta.',
    '',
    `Pasākums: ${CONFIG.EVENT_NAME}`,
    `Datums: ${CONFIG.EVENT_DATE}`,
    `Vieta: ${CONFIG.EVENT_PLACE}`,
    `Komanda: ${data.teamName}`,
    `Distance: ${data.distance}`,
    `Bērnu skaits: ${data.children.length}`,
    '',
    shirtText,
    '',
    `Pieteikuma kods: ${data.code}`,
    `Labot vai atsaukt pieteikumu: ${data.editUrl}`,
    '',
    `Jautājumiem: ${CONFIG.CONTACT_EMAIL}`,
  ].join('\n');

  const htmlBody = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#172033;max-width:650px">
      <div style="background:#073482;color:#fff;padding:22px 26px;border-radius:14px 14px 0 0">
        <h1 style="margin:0;font-size:24px">${escapeHtml_(CONFIG.EVENT_NAME)}</h1>
      </div>
      <div style="border:1px solid #dce3ed;border-top:0;padding:26px;border-radius:0 0 14px 14px">
        <p>Labdien, <strong>${escapeHtml_(data.fatherName)}</strong>!</p>
        <p>${data.type === 'update' ? 'Jūsu pieteikuma izmaiņas ir saglabātas.' : 'Jūsu ģimenes dalība ir apstiprināta.'}</p>
        <table style="border-collapse:collapse;width:100%;margin:18px 0">
          <tr><td style="padding:7px 0;color:#637083">Datums</td><td style="padding:7px 0"><strong>${escapeHtml_(CONFIG.EVENT_DATE)}</strong></td></tr>
          <tr><td style="padding:7px 0;color:#637083">Vieta</td><td style="padding:7px 0"><strong>${escapeHtml_(CONFIG.EVENT_PLACE)}</strong></td></tr>
          <tr><td style="padding:7px 0;color:#637083">Komanda</td><td style="padding:7px 0"><strong>${escapeHtml_(data.teamName)}</strong></td></tr>
          <tr><td style="padding:7px 0;color:#637083">Distance</td><td style="padding:7px 0"><strong>${escapeHtml_(data.distance)}</strong></td></tr>
          <tr><td style="padding:7px 0;color:#637083">Bērnu skaits</td><td style="padding:7px 0"><strong>${data.children.length}</strong></td></tr>
        </table>
        <div style="background:${data.shirtEligible ? '#eaf0fb' : '#fff0f2'};padding:15px 17px;border-radius:10px;margin:18px 0">
          ${data.shirtEligible
            ? `<strong style="color:#073482">T-krekli ir rezervēti (vieta Nr. ${data.shirtSlot}).</strong><br>Tēva izmērs: ${escapeHtml_(data.fatherShirtSize)}<br>${data.children.map((child) => `${escapeHtml_(child.name)}: ${escapeHtml_(child.shirtSize)}`).join('<br>')}`
            : '<strong style="color:#aa1d2f">T-kreklu komplektu limits jau ir sasniegts.</strong><br>Dalība pasākumā ir apstiprināta bez T-kreklu rezervācijas.'}
        </div>
        <p>Pieteikuma kods: <strong>${escapeHtml_(data.code)}</strong></p>
        <p><a href="${escapeHtml_(data.editUrl)}" style="display:inline-block;background:#e8073c;color:white;text-decoration:none;padding:12px 18px;border-radius:9px;font-weight:bold">Labot vai atsaukt pieteikumu</a></p>
        <p style="color:#637083;font-size:13px;margin-top:25px">Jautājumiem: ${escapeHtml_(CONFIG.CONTACT_EMAIL)}</p>
      </div>
    </div>`;

  MailApp.sendEmail({
    to: data.email,
    subject,
    body: plainBody,
    htmlBody,
    name: 'Dadathlon',
  });
}

function sendCancellationEmail_(email, teamName, code) {
  MailApp.sendEmail({
    to: email,
    subject: `Dalība ${CONFIG.EVENT_NAME} ir atsaukta`,
    body: [
      'Labdien!',
      '',
      `Komandas “${teamName}” pieteikums dalībai ${CONFIG.EVENT_NAME} ir atsaukts.`,
      `Pieteikuma kods: ${code}`,
      '',
      `Jautājumiem: ${CONFIG.CONTACT_EMAIL}`,
    ].join('\n'),
    name: 'Dadathlon',
  });
}

function trySend_(callback) {
  try {
    callback();
  } catch (error) {
    console.error('E-pastu neizdevās nosūtīt: ' + safeErrorMessage_(error));
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
