'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { StockItem } from '@/types/stock';

interface DueFormData {
  deliveryType: 'domestic' | 'international';
  myobNumber: string;
  productRequestNo: string;
  customer: string;
  countryOfOrigin: string;
  sampleRequestSheet: string;
  model: string;
  partNumber: string;
  partName: string;
  revisionLevel: string;
  revisionNumber: string;
  event: string;
  supplier: string;
  customerPo: string;
  prPo: string;
  withdrawalNumber: string;
  purchase: string;
  invoiceIn: string;
  invoiceOut: string;
  dueSupplierToRk: string;
  deliveredAt?: string;
  quantity: number;
  dueDate: string;
}

interface DueRecord extends DueFormData {
  id: string;
  createdAt: string;
  updatedAt: string;
  isDelivered?: boolean;
  dueSupplierToCustomer?: string;
  dueRkToCustomer?: string;
}

interface DeliverFormData {
  event: string;
  supplier: string;
  customer: string;
  customerPo: string;
  purchase: string;
  invoiceIn: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  withdrawalNumber: string;
  dueSupplierToRk: string;
  remarks: string;
}

const COUNTRY_CODE_MAP: Record<string, string> = {
  Afghanistan: 'AF',
  Albania: 'AL',
  Algeria: 'DZ',
  Andorra: 'AD',
  Angola: 'AO',
  'Antigua and Barbuda': 'AG',
  Argentina: 'AR',
  Armenia: 'AM',
  Australia: 'AU',
  Austria: 'AT',
  Azerbaijan: 'AZ',
  Bahamas: 'BS',
  Bahrain: 'BH',
  Bangladesh: 'BD',
  Barbados: 'BB',
  Belarus: 'BY',
  Belgium: 'BE',
  Belize: 'BZ',
  Benin: 'BJ',
  Bhutan: 'BT',
  Bolivia: 'BO',
  'Bosnia and Herzegovina': 'BA',
  Botswana: 'BW',
  Brazil: 'BR',
  Brunei: 'BN',
  Bulgaria: 'BG',
  'Burkina Faso': 'BF',
  Burundi: 'BI',
  'Cabo Verde': 'CV',
  Cambodia: 'KH',
  Cameroon: 'CM',
  Canada: 'CA',
  'Central African Republic': 'CF',
  Chad: 'TD',
  Chile: 'CL',
  China: 'CN',
  Colombia: 'CO',
  Comoros: 'KM',
  'Congo (Congo-Brazzaville)': 'CG',
  'Costa Rica': 'CR',
  'Côte d’Ivoire': 'CI',
  Croatia: 'HR',
  Cuba: 'CU',
  Cyprus: 'CY',
  'Czechia (Czech Republic)': 'CZ',
  'Democratic Republic of the Congo': 'CD',
  Denmark: 'DK',
  Djibouti: 'DJ',
  Dominica: 'DM',
  'Dominican Republic': 'DO',
  Ecuador: 'EC',
  Egypt: 'EG',
  'El Salvador': 'SV',
  'Equatorial Guinea': 'GQ',
  Eritrea: 'ER',
  Estonia: 'EE',
  Eswatini: 'SZ',
  Ethiopia: 'ET',
  Fiji: 'FJ',
  Finland: 'FI',
  France: 'FR',
  Gabon: 'GA',
  Gambia: 'GM',
  Georgia: 'GE',
  Germany: 'DE',
  Ghana: 'GH',
  Greece: 'GR',
  Grenada: 'GD',
  Guatemala: 'GT',
  Guinea: 'GN',
  'Guinea-Bissau': 'GW',
  Guyana: 'GY',
  Haiti: 'HT',
  Honduras: 'HN',
  Hungary: 'HU',
  Iceland: 'IS',
  India: 'IN',
  Indonesia: 'ID',
  Iran: 'IR',
  Iraq: 'IQ',
  Ireland: 'IE',
  Israel: 'IL',
  Italy: 'IT',
  Jamaica: 'JM',
  Japan: 'JP',
  Jordan: 'JO',
  Kazakhstan: 'KZ',
  Kenya: 'KE',
  Kiribati: 'KI',
  Kuwait: 'KW',
  Kyrgyzstan: 'KG',
  Laos: 'LA',
  Latvia: 'LV',
  Lebanon: 'LB',
  Lesotho: 'LS',
  Liberia: 'LR',
  Libya: 'LY',
  Liechtenstein: 'LI',
  Lithuania: 'LT',
  Luxembourg: 'LU',
  Madagascar: 'MG',
  Malawi: 'MW',
  Malaysia: 'MY',
  Maldives: 'MV',
  Mali: 'ML',
  Malta: 'MT',
  'Marshall Islands': 'MH',
  Mauritania: 'MR',
  Mauritius: 'MU',
  Mexico: 'MX',
  Micronesia: 'FM',
  Moldova: 'MD',
  Monaco: 'MC',
  Mongolia: 'MN',
  Montenegro: 'ME',
  Morocco: 'MA',
  Mozambique: 'MZ',
  Myanmar: 'MM',
  Namibia: 'NA',
  Nauru: 'NR',
  Nepal: 'NP',
  Netherlands: 'NL',
  'New Zealand': 'NZ',
  Nicaragua: 'NI',
  Niger: 'NE',
  Nigeria: 'NG',
  'North Korea': 'KP',
  'North Macedonia': 'MK',
  Norway: 'NO',
  Oman: 'OM',
  Pakistan: 'PK',
  Palau: 'PW',
  Panama: 'PA',
  'Papua New Guinea': 'PG',
  Paraguay: 'PY',
  Peru: 'PE',
  Philippines: 'PH',
  Poland: 'PL',
  Portugal: 'PT',
  Qatar: 'QA',
  Romania: 'RO',
  Russia: 'RU',
  Rwanda: 'RW',
  'Saint Kitts and Nevis': 'KN',
  'Saint Lucia': 'LC',
  'Saint Vincent and the Grenadines': 'VC',
  Samoa: 'WS',
  'San Marino': 'SM',
  'Sao Tome and Principe': 'ST',
  'Saudi Arabia': 'SA',
  Senegal: 'SN',
  Serbia: 'RS',
  Seychelles: 'SC',
  'Sierra Leone': 'SL',
  Singapore: 'SG',
  Slovakia: 'SK',
  Slovenia: 'SI',
  'Solomon Islands': 'SB',
  Somalia: 'SO',
  'South Africa': 'ZA',
  'South Korea': 'KR',
  'South Sudan': 'SS',
  Spain: 'ES',
  'Sri Lanka': 'LK',
  Sudan: 'SD',
  Suriname: 'SR',
  Sweden: 'SE',
  Switzerland: 'CH',
  Syria: 'SY',
  Taiwan: 'TW',
  Tajikistan: 'TJ',
  Tanzania: 'TZ',
  Thailand: 'TH',
  'Timor-Leste': 'TL',
  Togo: 'TG',
  Tonga: 'TO',
  'Trinidad and Tobago': 'TT',
  Tunisia: 'TN',
  Turkey: 'TR',
  Turkmenistan: 'TM',
  Tuvalu: 'TV',
  Uganda: 'UG',
  Ukraine: 'UA',
  'United Arab Emirates': 'AE',
  'United Kingdom': 'GB',
  'United States': 'US',
  Uruguay: 'UY',
  Uzbekistan: 'UZ',
  Vanuatu: 'VU',
  'Vatican City': 'VA',
  Venezuela: 'VE',
  Vietnam: 'VN',
  Yemen: 'YE',
  Zambia: 'ZM',
  Zimbabwe: 'ZW',
};

const getCountryFlagUrl = (country: string) => {
  const code = COUNTRY_CODE_MAP[country];
  if (!code) return '';
  return `https://flagcdn.com/24x18/${code.toLowerCase()}.png`;
};

const CUSTOMER_NAME_MAP: Record<string, string> = {
  TH: 'TH',
  IH: 'IH',
  'HONDA R&D ASIA PACIFIC CO., LTD': 'HONDA R&D ASIA PACIFIC CO., LTD',
  'DUCATI THAI': 'DUCATI THAI',
  HONDA: 'HONDA R&D ASIA PACIFIC CO., LTD',
  DUCATI: 'DUCATI THAI',
  'IHI': 'IH',
};

const resolveCustomerDisplayName = (raw: string) => {
  const value = String(raw || '').trim();
  if (!value) return '-';
  const direct = CUSTOMER_NAME_MAP[value];
  if (direct) return direct;
  const upper = value.toUpperCase();
  return CUSTOMER_NAME_MAP[upper] ?? value;
};

const COUNTRY_OPTIONS = [
  'Afghanistan',
  'Albania',
  'Algeria',
  'Andorra',
  'Angola',
  'Antigua and Barbuda',
  'Argentina',
  'Armenia',
  'Australia',
  'Austria',
  'Azerbaijan',
  'Bahamas',
  'Bahrain',
  'Bangladesh',
  'Barbados',
  'Belarus',
  'Belgium',
  'Belize',
  'Benin',
  'Bhutan',
  'Bolivia',
  'Bosnia and Herzegovina',
  'Botswana',
  'Brazil',
  'Brunei',
  'Bulgaria',
  'Burkina Faso',
  'Burundi',
  'Cabo Verde',
  'Cambodia',
  'Cameroon',
  'Canada',
  'Central African Republic',
  'Chad',
  'Chile',
  'China',
  'Colombia',
  'Comoros',
  'Congo (Congo-Brazzaville)',
  'Costa Rica',
  'Côte d’Ivoire',
  'Croatia',
  'Cuba',
  'Cyprus',
  'Czechia (Czech Republic)',
  'Democratic Republic of the Congo',
  'Denmark',
  'Djibouti',
  'Dominica',
  'Dominican Republic',
  'Ecuador',
  'Egypt',
  'El Salvador',
  'Equatorial Guinea',
  'Eritrea',
  'Estonia',
  'Eswatini',
  'Ethiopia',
  'Fiji',
  'Finland',
  'France',
  'Gabon',
  'Gambia',
  'Georgia',
  'Germany',
  'Ghana',
  'Greece',
  'Grenada',
  'Guatemala',
  'Guinea',
  'Guinea-Bissau',
  'Guyana',
  'Haiti',
  'Honduras',
  'Hungary',
  'Iceland',
  'India',
  'Indonesia',
  'Iran',
  'Iraq',
  'Ireland',
  'Israel',
  'Italy',
  'Jamaica',
  'Japan',
  'Jordan',
  'Kazakhstan',
  'Kenya',
  'Kiribati',
  'Kuwait',
  'Kyrgyzstan',
  'Laos',
  'Latvia',
  'Lebanon',
  'Lesotho',
  'Liberia',
  'Libya',
  'Liechtenstein',
  'Lithuania',
  'Luxembourg',
  'Madagascar',
  'Malawi',
  'Malaysia',
  'Maldives',
  'Mali',
  'Malta',
  'Marshall Islands',
  'Mauritania',
  'Mauritius',
  'Mexico',
  'Micronesia',
  'Moldova',
  'Monaco',
  'Mongolia',
  'Montenegro',
  'Morocco',
  'Mozambique',
  'Myanmar',
  'Namibia',
  'Nauru',
  'Nepal',
  'Netherlands',
  'New Zealand',
  'Nicaragua',
  'Niger',
  'Nigeria',
  'North Korea',
  'North Macedonia',
  'Norway',
  'Oman',
  'Pakistan',
  'Palau',
  'Panama',
  'Papua New Guinea',
  'Paraguay',
  'Peru',
  'Philippines',
  'Poland',
  'Portugal',
  'Qatar',
  'Romania',
  'Russia',
  'Rwanda',
  'Saint Kitts and Nevis',
  'Saint Lucia',
  'Saint Vincent and the Grenadines',
  'Samoa',
  'San Marino',
  'Sao Tome and Principe',
  'Saudi Arabia',
  'Senegal',
  'Serbia',
  'Seychelles',
  'Sierra Leone',
  'Singapore',
  'Slovakia',
  'Slovenia',
  'Solomon Islands',
  'Somalia',
  'South Africa',
  'South Korea',
  'South Sudan',
  'Spain',
  'Sri Lanka',
  'Sudan',
  'Suriname',
  'Sweden',
  'Switzerland',
  'Syria',
  'Taiwan',
  'Tajikistan',
  'Tanzania',
  'Thailand',
  'Timor-Leste',
  'Togo',
  'Tonga',
  'Trinidad and Tobago',
  'Tunisia',
  'Turkey',
  'Turkmenistan',
  'Tuvalu',
  'Uganda',
  'Ukraine',
  'United Arab Emirates',
  'United Kingdom',
  'United States',
  'Uruguay',
  'Uzbekistan',
  'Vanuatu',
  'Vatican City',
  'Venezuela',
  'Vietnam',
  'Yemen',
  'Zambia',
  'Zimbabwe',
];

const createEmptyForm = (deliveryType: 'domestic' | 'international'): DueFormData => ({
  deliveryType,
  myobNumber: '',
  productRequestNo: '',
  customer: '',
  countryOfOrigin: deliveryType === 'domestic' ? 'Thailand' : '',
  sampleRequestSheet: '',
  model: '',
  partNumber: '',
  partName: '',
  revisionLevel: '1',
  revisionNumber: '',
  event: '',
  supplier: '',
  customerPo: '',
  prPo: '',
  withdrawalNumber: '',
  purchase: '',
  invoiceIn: '',
  invoiceOut: '',
  dueSupplierToRk: '',
  deliveredAt: '',
  quantity: 0,
  dueDate: '',
});

const formatDueDate = (value?: string) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
};

const buildToday = () => new Date().toISOString().split('T')[0];

function DueDeliveryPage() {
  const dueRowColors = [
    'text-emerald-300',
    'text-cyan-300',
    'text-sky-300',
    'text-blue-300',
    'text-indigo-300',
    'text-violet-300',
    'text-fuchsia-300',
    'text-pink-300',
    'text-rose-300',
    'text-amber-300',
    'text-lime-300',
  ];

  const getDueRowColor = (rowIndex: number) => dueRowColors[rowIndex % dueRowColors.length];

  const [view, setView] = useState<'menu' | 'list' | 'form'>('menu');
  const [selectedType, setSelectedType] = useState<'domestic' | 'international'>('domestic');
  const [records, setRecords] = useState<DueRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingRecord, setEditingRecord] = useState<DueRecord | null>(null);
  const [listMode, setListMode] = useState<'pending' | 'delivered'>('pending');
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<DueFormData>(createEmptyForm('domestic'));
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importKey, setImportKey] = useState('');
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [deliverRecord, setDeliverRecord] = useState<DueRecord | null>(null);
  const [isDeliverTypeOpen, setIsDeliverTypeOpen] = useState(false);
  const [deliverJobMode, setDeliverJobMode] = useState<'new' | 'mass'>('new');
  const [deliverFormData, setDeliverFormData] = useState<DeliverFormData>({
    event: '',
    supplier: '',
    customer: '',
    customerPo: '',
    purchase: '',
    invoiceIn: '',
    invoiceNumber: '',
    issueDate: buildToday(),
    dueDate: '',
    withdrawalNumber: '',
    dueSupplierToRk: '',
    remarks: '',
  });
  const [isDeliverFormOpen, setIsDeliverFormOpen] = useState(false);
  const [isStockInsufficient, setIsStockInsufficient] = useState(false);

  const dueTableXRef = useRef<HTMLDivElement | null>(null);
  const dueBottomScrollRef = useRef<HTMLDivElement | null>(null);
  const dueXSyncingRef = useRef(false);
  const [dueTableScrollWidth, setDueTableScrollWidth] = useState(0);

  const syncDueHorizontalScroll = (source: 'table' | 'bar') => {
    if (dueXSyncingRef.current) return;
    const table = dueTableXRef.current;
    const bar = dueBottomScrollRef.current;
    if (!table || !bar) return;

    const tableMax = Math.max(0, table.scrollWidth - table.clientWidth);
    const barMax = Math.max(0, bar.scrollWidth - bar.clientWidth);

    dueXSyncingRef.current = true;

    if (source === 'table') {
      const tablePos = table.scrollLeft;
      const ratio = tableMax > 0 ? tablePos / tableMax : 0;
      bar.scrollLeft = ratio * barMax;
    } else {
      const barPos = bar.scrollLeft;
      const ratio = barMax > 0 ? barPos / barMax : 0;
      table.scrollLeft = ratio * tableMax;
    }

    window.setTimeout(() => {
      dueXSyncingRef.current = false;
    }, 0);
  };

  useEffect(() => {
    if (view !== 'list') return;
    const el = dueTableXRef.current;
    if (!el) return;

    const update = () => {
      setDueTableScrollWidth(el.scrollWidth);
    };

    update();

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => update());
      ro.observe(el);
    }

    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('resize', update);
      if (ro) ro.disconnect();
    };
  }, [view, isSelectMode, selectedType, listMode, records.length]);

  const loadDueRecords = async (signal?: AbortSignal, bypassCache = false) => {
    const url = bypassCache ? `/api/due-records?ts=${Date.now()}` : '/api/due-records';
    const response = await fetch(url, { signal });
    if (!response.ok) {
      setRecords([]);
      return;
    }
    const data = await response.json();
    const normalized = Array.isArray(data) ? (data as DueRecord[]) : [];
    setRecords(
      normalized.map(record => ({
        ...(() => {
          const normalizePo = (value: unknown) => {
            const text = String(value ?? '').trim();
            return text === '-' ? '' : text;
          };
          const nextCustomerPo = normalizePo((record as any).customerPo);
          const nextPrPo = normalizePo((record as any).prPo);
          return {
            customerPo: nextCustomerPo || nextPrPo || '',
            prPo: nextPrPo || nextCustomerPo || '',
          };
        })(),
        ...record,
        isDelivered: record.isDelivered ?? false,
        productRequestNo: record.productRequestNo ?? '',
        supplier: record.supplier ?? '',
        withdrawalNumber: record.withdrawalNumber ?? '',
        purchase: record.purchase ?? '',
        invoiceIn: record.invoiceIn ?? '',
        invoiceOut: record.invoiceOut ?? '',
        dueSupplierToRk: String((record as any).dueSupplierToRk ?? ''),
      }))
    );
  };

  const syncDueRecords = async (nextRecords: DueRecord[]) => {
    const response = await fetch('/api/due-records/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ records: nextRecords }),
    });
    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(text || 'Failed to sync due records');
    }
    return response.json().catch(() => null);
  };

  const upsertDueRecord = async (record: DueRecord) => {
    const response = await fetch('/api/due-records', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(record),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(text || 'Failed to upsert due record');
    }
    return response.json().catch(() => null);
  };

  const deleteDueRecord = async (record: DueRecord) => {
    const ok = window.confirm('ต้องการลบรายการนี้ใช่ไหม?');
    if (!ok) return;

    try {
      const response = await fetch(`/api/due-records/${record.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const text = await response.text().catch(() => '');
        throw new Error(text || 'Failed to delete due record');
      }

      setRecords(prev => prev.filter(item => item.id !== record.id));
      setSelectedIds(prev => prev.filter(id => id !== record.id));

      if (editingRecord?.id === record.id) {
        setEditingRecord(null);
        setFormData(createEmptyForm(formData.deliveryType));
        setView('list');
      }

      if (deliverRecord?.id === record.id) {
        closeDeliverForm();
      }
    } catch (error) {
      console.error('Error deleting due record:', error);
      alert('ลบไม่สำเร็จ (Supabase): ' + error);
    }
  };

  const handleImportExcel = async () => {
    if (!importFile) {
      alert('กรุณาเลือกไฟล์ Excel');
      return;
    }
    if (!importKey.trim()) {
      alert('กรุณาใส่รหัสผ่าน');
      return;
    }

    const maxBytes = 20 * 1024 * 1024;
    if (importFile.size > maxBytes) {
      setImportMessage(
        `Import ไม่สำเร็จ: ไฟล์ใหญ่เกินไป (${(importFile.size / (1024 * 1024)).toFixed(2)} MB). กรุณาแยกไฟล์ให้เล็กกว่า ${(maxBytes / (1024 * 1024)).toFixed(0)} MB แล้วลองใหม่`
      );
      return;
    }

    setImportLoading(true);
    setImportMessage(null);
    try {
      const XLSX = (await import('xlsx')) as typeof import('xlsx');

      const normalizeText = (value: unknown) => String(value ?? '').trim();
      const normalizeHeader = (value: unknown) => normalizeText(value).replace(/\s+/g, ' ').trim().toLowerCase();
      const normalizeDueDate = (value: unknown) => {
        if (value instanceof Date) return value.toISOString().slice(0, 10);
        return normalizeText(value);
      };

      const scoreHeaderRow = (headers: unknown[]) => {
        const required = ['customer', 'model', 'part', 'event', 'po', 'due'];
        const joined = headers.map(normalizeHeader).join(' | ');
        let score = 0;
        for (const token of required) {
          if (joined.includes(token)) score++;
        }
        return score;
      };

      const buildRowObject = (headers: string[], row: unknown[]) => {
        const obj: Record<string, unknown> = {};
        for (let i = 0; i < headers.length; i++) {
          const key = headers[i] ?? `col_${i}`;
          obj[key] = row[i];
        }
        return obj;
      };

      const pick = (row: Record<string, unknown>, aliases: string[]) => {
        const normalizeKey = (value: string) =>
          value
            .trim()
            .toLowerCase()
            .replace(/\s+/g, '')
            .replace(/[^a-z0-9\u0E00-\u0E7F]/g, '');

        for (const key of aliases) {
          if (Object.prototype.hasOwnProperty.call(row, key)) return row[key];
          const found = Object.keys(row).find(k => k.trim().toLowerCase() === key.trim().toLowerCase());
          if (found) return row[found];

          const aliasNorm = normalizeKey(key);
          const foundLoose = Object.keys(row).find(k => {
            const kNorm = normalizeKey(k);
            if (!kNorm || !aliasNorm) return false;
            return kNorm.includes(aliasNorm) || aliasNorm.includes(kNorm);
          });
          if (foundLoose) return row[foundLoose];
        }
        return undefined;
      };

      const inferDeliveryTypeFromSheetName = (name: string) => {
        const lower = name.toLowerCase();
        if (lower.includes('inter')) return 'international';
        if (lower.includes('int')) return 'international';
        if (lower.includes('dom')) return 'domestic';
        if (lower.includes('thai')) return 'domestic';
        return null;
      };

      setImportMessage('กำลังอ่านไฟล์ Excel...');
      const buffer = await importFile.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });

      type DueRecordInput = {
        deliveryType?: string;
        sourceSheet?: string;
        sourceRow?: number;
        myobNumber?: string;
        productRequestNo?: string;
        customer?: string;
        countryOfOrigin?: string;
        sampleRequestSheet?: string;
        model?: string;
        partNumber?: string;
        partName?: string;
        revisionLevel?: string;
        revisionNumber?: string;
        event?: string;
        supplier?: string;
        customerPo?: string;
        prPo?: string;
        purchase?: string;
        invoiceIn?: string;
        invoiceOut?: string;
        withdrawalNumber?: string;
        quantity?: number;
        dueDate?: string;
        dueSupplierToCustomer?: string;
        dueSupplierToRk?: string;
        dueRkToCustomer?: string;
        isDelivered?: boolean;
        deliveredAt?: string | null;
      };

      const records: DueRecordInput[] = [];
      let clientSkipped = 0;
      const clientSkipSamples: string[] = [];

      for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName];
        if (!sheet) continue;

        const inferredType = inferDeliveryTypeFromSheetName(sheetName);
        if (!inferredType) continue;

        const matrix = XLSX.utils.sheet_to_json(sheet, {
          header: 1,
          defval: '',
          raw: false,
        }) as unknown[][];

        let headerRowIndex = -1;
        for (let i = 0; i < Math.min(40, matrix.length); i++) {
          const score = scoreHeaderRow(matrix[i] ?? []);
          if (score >= 4) {
            headerRowIndex = i;
            break;
          }
        }
        if (headerRowIndex === -1) continue;

        const headerRow = (matrix[headerRowIndex] ?? []).map(normalizeHeader);
        const dataRows = matrix.slice(headerRowIndex + 1);

        for (let dataRowIndex = 0; dataRowIndex < dataRows.length; dataRowIndex++) {
          const rawRow = dataRows[dataRowIndex];
          const nonEmptyCount = (rawRow ?? []).filter((v: unknown) => normalizeText(v) !== '').length;
          if (nonEmptyCount === 0) continue;

          const row = buildRowObject(headerRow, rawRow ?? []);
          const sourceRow = headerRowIndex + 2 + dataRowIndex;

          const productRequestNo = normalizeText(
            pick(row, ['product request no.', 'product request no', 'productrequestno', 'product request', 'request no', 'product request no :'])
          );
          const customer = normalizeText(pick(row, ['customer', 'CUSTOMER', 'Customer', 'ลูกค้า']));
          const model = normalizeText(pick(row, ['model', 'MODEL', 'Model', 'โมเดล']));
          const partNumber = normalizeText(
            pick(row, ['partNumber', 'part_number', 'PART NO', 'PART NO.', 'PART NO ', 'Part No', 'part no', 'Part No.', 'part no.', 'พาร์ท', 'พาร์ทโน', 'PART NO.'])
          );
          const partName = normalizeText(pick(row, ['partName', 'part_name', 'PART NAME', 'Part Name', 'part name', 'ชื่อชิ้นส่วน', 'PART NAME ']));
          const event = normalizeText(pick(row, ['event', 'EVENT', 'Event', 'อีเว้น', 'เหตุการณ์']));
          const supplier = normalizeText(pick(row, ['supplier', 'SUPPLIER', 'Supplier']));
          const prPo = normalizeText(pick(row, ['pr/po', 'pr / po', 'PR/PO', 'PR / PO', 'prpo', 'PR PO', 'pr po']));
          const customerPo = normalizeText(
            pick(row, ['customerPo', 'customer_po', 'PO', 'PO NO', 'PO NO.', 'Customer PO', 'customer po', 'PO:', 'เลข PO', 'PR/PO', 'PR / PO', 'pr/po', 'pr / po'])
          );
          const purchase = normalizeText(pick(row, ['purchase', 'puchase', 'PUCHASE', 'PUCHASE ', 'Purchase']));
          const invoiceIn = normalizeText(pick(row, ['invoice in', 'INVOICE IN', 'invoicein', 'invoice_in']));
          const invoiceOut = normalizeText(pick(row, ['invoice out', 'INVOICE OUT', 'invoiceout', 'invoice_out']));
          const withdrawalNumber = normalizeText(
            pick(row, ['withdrawalNumber', 'withdrawal_number', 'withdrawal', 'withdrawal no', 'withdrawal no.', 'เลขที่ใบเบิก', 'เลขใบเบิก', 'ใบเบิก'])
          );

          const dueSupplierToCustomer = normalizeDueDate(
            pick(row, ['due supplier to customer', 'Due Supplier to Customer', 'DUE SUPPLIER TO CUSTOMER', 'duesuppliertocustomer'])
          );
          const dueSupplierToRk = normalizeText(
            pick(row, [
              "q'ty supplier to rk",
              'qty supplier to rk',
              'qty supplier to r.k.',
              'qty supplier to rk ',
              'q\'ty supplier to rk',
              'Q\'TY supplier to RK',
              'Q\'TY SUPPLIER TO RK',
              'QTY supplier to RK',
              'QTY SUPPLIER TO RK',
              'qtysupplier to rk',
              'qtysupplier to rk ',
              'qty_supplier_to_rk',
              // fallback for legacy sheets that used "Due Supplier to RK" for this quantity column
              'due supplier to rk',
              'Due Supplier to RK',
              'DUE SUPPLIER TO RK',
              'duesuppliertork',
            ])
          );
          const dueRkToCustomer = normalizeDueDate(pick(row, ['due rk to customer', 'Due RK to Customer', 'DUE RK TO CUSTOMER', 'duerktocustomer']));

          const quantityRaw = pick(row, ['qty to customer', 'QTY to Customer', 'QTY TO CUSTOMER', 'quantity', 'QTY', 'qty', 'Quantity', 'จำนวน']);
          const quantity = Number(String(quantityRaw ?? '').replace(/[^0-9.-]/g, '')) || 0;

          const myobNumber = normalizeText(pick(row, ['myobNumber', 'myob_number', 'MYOB', 'MYOB NO', 'MYOB NO.', 'MYOB NUMBER', 'MYOB NUMBER ']));
          const countryOfOrigin = normalizeText(pick(row, ['countryOfOrigin', 'country_of_origin', 'Country', 'COUNTRY', 'ประเทศ']));
          const sampleRequestSheet = normalizeText(
            pick(row, ['sampleRequestSheet', 'sample_request_sheet', 'SAMPLE REQUEST SHEET', 'Sample Request Sheet', 'เอกสารขอชิ้นงาน'])
          );
          const revisionLevel = normalizeText(pick(row, ['revisionLevel', 'revision_level', 'REV LEVEL', 'REV LEVEL.', 'REV', 'rev']));
          const revisionNumber = normalizeText(
            pick(row, ['revisionNumber', 'revision_number', 'DWG REV.', 'DWG REV', 'dwg rev', 'dwg rev.', 'REV NO', 'REV NO.', 'REVISION', 'revision'])
          );

          let dueDate = normalizeDueDate(pick(row, ['dueDate', 'due_date', 'DUE DATE', 'Due Date', 'due date', 'กำหนดส่ง', 'DUE']));
          if (!normalizeText(dueDate)) {
            if (inferredType === 'international') {
              dueDate = normalizeDueDate(dueSupplierToCustomer);
            } else {
              dueDate = normalizeDueDate(dueRkToCustomer || dueSupplierToCustomer);
            }
          }

          const finalCustomerPo = normalizeText(customerPo || prPo);

          const isDeliveredRaw = pick(row, ['isDelivered', 'is_delivered', 'DELIVERED', 'Delivered', 'ส่งแล้ว']);
          const isDelivered =
            String(isDeliveredRaw ?? '').toLowerCase() === 'true' ||
            String(isDeliveredRaw ?? '').toLowerCase() === 'yes' ||
            String(isDeliveredRaw ?? '').toLowerCase() === 'y' ||
            String(isDeliveredRaw ?? '').toLowerCase() === 'ส่งแล้ว' ||
            String(isDeliveredRaw ?? '') === '1';

          const deliveredAtRaw = pick(row, ['deliveredAt', 'delivered_at', 'DELIVERED AT', 'Delivered At', 'วันที่ส่ง']);
          const deliveredAt = deliveredAtRaw ? normalizeDueDate(deliveredAtRaw) : null;

          const requiredMissing =
            !normalizeText(customer) ||
            !normalizeText(model) ||
            !normalizeText(partNumber) ||
            !normalizeText(partName) ||
            !normalizeText(event) ||
            !normalizeText(finalCustomerPo) ||
            !normalizeText(dueDate);

          if (requiredMissing) {
            clientSkipped++;
            if (clientSkipSamples.length < 10) {
              const fields = [
                !normalizeText(customer) ? 'CUSTOMER' : null,
                !normalizeText(model) ? 'MODEL' : null,
                !normalizeText(partNumber) ? 'PART NO.' : null,
                !normalizeText(partName) ? 'PART NAME' : null,
                !normalizeText(event) ? 'EVENT' : null,
                !normalizeText(finalCustomerPo) ? 'PR/PO' : null,
                !normalizeText(dueDate) ? 'DUE' : null,
              ].filter(Boolean);
              clientSkipSamples.push(`sheet=${sheetName} row=${sourceRow} missing=${fields.join(',')}`);
            }
          }

          records.push({
            deliveryType: inferredType,
            sourceSheet: sheetName,
            sourceRow,
            myobNumber,
            productRequestNo,
            customer,
            countryOfOrigin,
            sampleRequestSheet,
            model,
            partNumber,
            partName,
            revisionLevel,
            revisionNumber,
            event,
            supplier,
            customerPo: finalCustomerPo,
            prPo,
            purchase,
            invoiceIn,
            invoiceOut,
            withdrawalNumber,
            quantity,
            dueDate,
            dueSupplierToCustomer,
            dueSupplierToRk,
            dueRkToCustomer,
            isDelivered,
            deliveredAt,
          });
        }
      }

      if (records.length === 0) {
        throw new Error('ไม่พบข้อมูลที่นำเข้าได้ (ตรวจสอบชื่อชีทว่า Domestic/International และมีหัวตารางถูกต้อง)');
      }

      const chunkSize = 200;
      const totalBatches = Math.ceil(records.length / chunkSize);
      let totalUpserted = 0;
      let totalSkipped = 0;
      let totalErrors = 0;
      const serverErrorSamples: string[] = [];

      for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
        const start = batchIndex * chunkSize;
        const end = Math.min(start + chunkSize, records.length);
        const batch = records.slice(start, end);
        setImportMessage(`กำลังนำเข้า... ${batchIndex + 1}/${totalBatches} (${end}/${records.length})`);

        const res = await fetch('/api/due-records/import-batch', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ key: importKey.trim(), records: batch }),
        });

        const text = await res.text().catch(() => '');
        let payload: any = null;
        if (text) {
          try {
            payload = JSON.parse(text) as any;
          } catch {
            payload = null;
          }
        }

        if (!res.ok) {
          const details = payload?.details || payload?.error || text || 'Import failed';
          throw new Error(`[${res.status}] ${String(details).slice(0, 800)}`);
        }

        totalUpserted += Number(payload?.upserted ?? 0);
        totalSkipped += Number(payload?.skipped ?? 0);
        totalErrors += Number(payload?.errorsCount ?? 0);

        if (Array.isArray(payload?.errors)) {
          for (const e of payload.errors) {
            if (serverErrorSamples.length >= 5) break;
            const batchNo = e?.batch ?? batchIndex + 1;
            const msg = String(e?.message ?? '').slice(0, 200);
            if (msg) serverErrorSamples.push(`batch=${batchNo} ${msg}`);
          }
        }
      }

      const clientSkippedNote = clientSkipped > 0 ? `, warnings=${clientSkipped}` : '';
      const sampleNote = clientSkipSamples.length > 0 ? `\nตัวอย่างแถวที่ข้อมูลไม่ครบ: ${clientSkipSamples.join(' | ')}` : '';
      const serverErrorNote =
        serverErrorSamples.length > 0
          ? `\nรายละเอียด error จาก server: ${serverErrorSamples.join(' | ')}`
          : '';
      const summary = `Import สำเร็จ: records=${records.length}${clientSkippedNote}, upserted=${totalUpserted}, skipped=${totalSkipped}, errors=${totalErrors}${sampleNote}${serverErrorNote}`;
      setImportMessage(summary);
      await loadDueRecords(undefined, true);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      setImportMessage('Import ไม่สำเร็จ: ' + msg);
    } finally {
      setImportLoading(false);
    }
  };

  const migrateLegacyLocalStorage = async () => {
    const saved = localStorage.getItem('dueRecords');
    if (!saved) return;
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed) || parsed.length === 0) return;
    const response = await fetch('/api/due-records/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ records: parsed }),
    });
    if (response.ok) {
      localStorage.removeItem('dueRecords');
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    const init = async () => {
      try {
        await migrateLegacyLocalStorage();
        await loadDueRecords(controller.signal);
      } catch (error) {
        console.error('Error loading due records:', error);
        setRecords([]);
      } finally {
        setLoading(false);
      }
    };
    init();
    return () => controller.abort();
  }, []);


  const closeDeliverType = () => {
    setIsDeliverTypeOpen(false);
    setDeliverRecord(null);
  };

  useEffect(() => {
    const fetchStockItems = async () => {
      try {
        const response = await fetch('/api/stock');
        if (response.ok) {
          const data = await response.json();
          setStockItems(data);
        } else {
          console.error('Failed to fetch stock items');
        }
      } catch (error) {
        console.error('Error fetching stock items:', error);
      }
    };
    fetchStockItems();
  }, []);

  const filteredRecords = useMemo(() => {
    if (!searchTerm) return records;
    const search = searchTerm.toLowerCase();
    return records.filter(record =>
      [
        record.myobNumber,
        record.customer,
        record.countryOfOrigin,
        record.sampleRequestSheet,
        record.model,
        record.partNumber,
        record.partName,
        record.event,
        record.customerPo,
      ].some(field => field.toLowerCase().includes(search))
    );
  }, [records, searchTerm]);

  const filteredByType = useMemo(() => {
    const parseDueDate = (value: string) => {
      if (!value) return Number.POSITIVE_INFINITY;
      const parsed = Date.parse(value);
      if (!Number.isNaN(parsed)) return parsed;
      const normalized = value.replace(/\s+/g, ' ').trim();
      const altParsed = Date.parse(normalized);
      return Number.isNaN(altParsed) ? Number.POSITIVE_INFINITY : altParsed;
    };

    return filteredRecords
      .filter(record => {
        const isMatchType = record.deliveryType === selectedType;
        const isMatchStatus = listMode === 'delivered' ? record.isDelivered : !record.isDelivered;
        return isMatchType && isMatchStatus;
      })
      .slice()
      .sort((a, b) => parseDueDate(a.dueDate) - parseDueDate(b.dueDate));
  }, [filteredRecords, selectedType, listMode]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'quantity' ? Number(value) : value,
    }));
  };

  const handleDeliverInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setDeliverFormData(prev => ({ ...prev, [name]: value }));
  };

  const getRecordBalance = (record: DueRecord) => {
    const sameGroup = stockItems.filter(item =>
      item.myobNumber === record.myobNumber &&
      item.partNumber === record.partNumber
    );
    const totalReceived = sameGroup.reduce((sum, item) => sum + (item.receivedQty || 0), 0);
    const totalIssued = sameGroup.reduce((sum, item) => sum + (item.issuedQty || 0), 0);
    return totalReceived - totalIssued;
  };

  const openDeliverForm = (record: DueRecord) => {
    setDeliverRecord(record);
    setIsDeliverTypeOpen(true);
  };

  const handleSelectDeliverType = async (type: 'new' | 'mass') => {
    if (!deliverRecord) return;
    setIsDeliverTypeOpen(false);
    setDeliverJobMode(type);
    if (type === 'mass') {
      setIsStockInsufficient(false);
      setDeliverFormData({
        event: deliverRecord.event || '',
        supplier: deliverRecord.supplier || '',
        customer: deliverRecord.customer || '',
        customerPo: deliverRecord.customerPo || '',
        purchase: deliverRecord.purchase || '',
        invoiceIn: deliverRecord.invoiceIn || '',
        invoiceNumber: '',
        issueDate: buildToday(),
        dueDate: deliverRecord.dueDate || '',
        withdrawalNumber: '',
        dueSupplierToRk: deliverRecord.dueSupplierToRk || '',
        remarks: '',
      });
      setIsDeliverFormOpen(true);
      return;
    }
    const balance = getRecordBalance(deliverRecord);
    const insufficient = deliverRecord.quantity > balance;
    setIsStockInsufficient(insufficient);
    setDeliverFormData({
      event: deliverRecord.event || '',
      supplier: deliverRecord.supplier || '',
      customer: deliverRecord.customer || '',
      customerPo: deliverRecord.customerPo || '',
      purchase: deliverRecord.purchase || '',
      invoiceIn: deliverRecord.invoiceIn || '',
      invoiceNumber: '',
      issueDate: buildToday(),
      dueDate: deliverRecord.dueDate || '',
      withdrawalNumber: '',
      dueSupplierToRk: deliverRecord.dueSupplierToRk || '',
      remarks: '',
    });
    setIsDeliverFormOpen(true);
    if (insufficient) {
      alert('งานคงเหลือไม่พอ');
    }
  };

  const closeDeliverForm = () => {
    setIsDeliverFormOpen(false);
    setDeliverRecord(null);
    setIsStockInsufficient(false);
    setDeliverFormData({
      event: '',
      supplier: '',
      customer: '',
      customerPo: '',
      purchase: '',
      invoiceIn: '',
      invoiceNumber: '',
      issueDate: buildToday(),
      dueDate: '',
      withdrawalNumber: '',
      dueSupplierToRk: '',
      remarks: '',
    });
  };

  const handleDeliverConfirm = async () => {
    if (!deliverRecord) return;
    if (deliverJobMode === 'new') {
      const balance = getRecordBalance(deliverRecord);
      const totalAvailableQty = balance;
      if (deliverRecord.quantity > totalAvailableQty) {
        setIsStockInsufficient(true);
        alert('งานคงเหลือไม่พอ');
        return;
      }
    }

    try {
      if (deliverJobMode === 'new') {
        const sameItemGroup = stockItems
          .filter(item =>
            item.myobNumber === deliverRecord.myobNumber &&
            item.partNumber === deliverRecord.partNumber &&
            (item.receivedQty - (item.issuedQty || 0)) > 0
          )
          .sort((a, b) => new Date(a.receivedDate).getTime() - new Date(b.receivedDate).getTime());

        let remainingQtyToIssue = deliverRecord.quantity;

        for (const item of sameItemGroup) {
          if (remainingQtyToIssue <= 0) break;
          const availableInThisItem = item.receivedQty - (item.issuedQty || 0);
          const qtyToIssueFromThisItem = Math.min(remainingQtyToIssue, availableInThisItem);

          if (qtyToIssueFromThisItem > 0) {
            const issueRecord = {
              myobNumber: item.myobNumber,
              model: item.model,
              partName: item.partName,
              partNumber: item.partNumber,
              revision: item.revision,
              poNumber: item.poNumber,
              receivedQty: 0,
              receivedDate: item.receivedDate,
              supplier: deliverFormData.supplier || item.supplier,
              issuedQty: qtyToIssueFromThisItem,
              invoiceNumber: deliverFormData.invoiceNumber || deliverFormData.customerPo || deliverRecord.customerPo || '',
              issueDate: deliverFormData.issueDate,
              dueDate: deliverFormData.dueDate || deliverRecord.dueDate || undefined,
              customer: deliverFormData.customer || deliverRecord.customer,
              event: deliverFormData.event || deliverRecord.event,
              withdrawalNumber: deliverFormData.withdrawalNumber || '',
              remarks: deliverFormData.remarks || '',
            };

            const response = await fetch('/api/stock', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(issueRecord),
            });

            if (!response.ok) {
              alert('เกิดข้อผิดพลาดในการบันทึกบางรายการ');
              return;
            }

            remainingQtyToIssue -= qtyToIssueFromThisItem;
          }
        }
      }

      const now = new Date().toISOString();
      const deliveredAtValue = deliverFormData.issueDate
        ? new Date(deliverFormData.issueDate).toISOString()
        : now;
      const updatedRecord: DueRecord = {
        ...deliverRecord,
        supplier: deliverFormData.supplier || deliverRecord.supplier,
        purchase: deliverFormData.purchase || deliverRecord.purchase,
        invoiceIn: deliverFormData.invoiceIn || deliverRecord.invoiceIn,
        invoiceOut: deliverFormData.invoiceNumber || deliverRecord.invoiceOut,
        withdrawalNumber: deliverFormData.withdrawalNumber || deliverRecord.withdrawalNumber,
        dueSupplierToRk: deliverFormData.dueSupplierToRk || deliverRecord.dueSupplierToRk,
        isDelivered: true,
        deliveredAt: deliveredAtValue,
        updatedAt: now,
      };
      const nextRecords = records.map(item =>
        item.id === deliverRecord.id
          ? updatedRecord
          : item
      );
      setRecords(nextRecords);
      try {
        await upsertDueRecord(updatedRecord);
        await loadDueRecords(undefined, true);
      } catch (error) {
        console.error('Error syncing due records:', error);
        alert('บันทึกไม่สำเร็จ (Supabase): ' + error);
      }
      setStockItems(prev => [...prev]);
      closeDeliverForm();
      alert(deliverJobMode === 'mass' ? 'บันทึกงาน MASS สำเร็จ (ไม่ตัดสต๊อก)' : 'บันทึกและตัดสต๊อกสำเร็จ');
    } catch (error) {
      console.error('Error issuing:', error);
      alert('เกิดข้อผิดพลาด: ' + error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const now = new Date().toISOString();
    const deliveredAtIso = formData.deliveredAt ? new Date(formData.deliveredAt).toISOString() : undefined;
    const nextIsDelivered = Boolean(deliveredAtIso);
    let nextRecords: DueRecord[] = [];
    let recordsToUpsert: DueRecord[] = [];

    if (editingRecord) {
      nextRecords = records.map(record =>
        record.id === editingRecord.id
          ? {
              ...formData,
              quantity: Number(formData.quantity) || 0,
              customerPo: formData.customerPo || formData.prPo,
              prPo: formData.prPo || formData.customerPo,
              dueRkToCustomer: formData.dueDate,
              id: record.id,
              createdAt: record.createdAt,
              updatedAt: now,
              isDelivered: nextIsDelivered,
              deliveredAt: deliveredAtIso,
            }
          : record
      );
      const updated = nextRecords.find(record => record.id === editingRecord.id);
      if (updated) recordsToUpsert = [updated];
    } else {
      const newRecord: DueRecord = {
        ...formData,
        quantity: Number(formData.quantity) || 0,
        customerPo: formData.customerPo || formData.prPo,
        prPo: formData.prPo || formData.customerPo,
        dueRkToCustomer: formData.dueDate,
        id: `${Date.now()}`,
        createdAt: now,
        updatedAt: now,
        isDelivered: nextIsDelivered,
        deliveredAt: deliveredAtIso,
      };
      nextRecords = [...records, newRecord];
      recordsToUpsert = [newRecord];
    }

    setRecords(nextRecords);
    try {
      for (const record of recordsToUpsert) {
        await upsertDueRecord(record);
      }
      await loadDueRecords(undefined, true);
    } catch (error) {
      console.error('Error syncing due records:', error);
      alert('บันทึกไม่สำเร็จ (Supabase): ' + error);
    }
    setEditingRecord(null);
    setFormData(createEmptyForm(formData.deliveryType));
    setView('list');
  };

  const handleEditRecord = (record: DueRecord) => {
    setEditingRecord(record);
    setSelectedType(record.deliveryType);
    setFormData({
      deliveryType: record.deliveryType,
      myobNumber: record.myobNumber,
      productRequestNo: record.productRequestNo || '',
      customer: record.customer,
      countryOfOrigin: record.countryOfOrigin,
      sampleRequestSheet: record.sampleRequestSheet,
      model: record.model,
      partNumber: record.partNumber,
      partName: record.partName,
      revisionLevel: record.revisionLevel,
      revisionNumber: record.revisionNumber,
      event: record.event,
      customerPo: record.customerPo || record.prPo || '',
      supplier: record.supplier || '',
      prPo: record.prPo || record.customerPo || '',
      withdrawalNumber: record.withdrawalNumber || '',
      purchase: record.purchase || '',
      invoiceIn: record.invoiceIn || '',
      invoiceOut: record.invoiceOut || '',
      dueSupplierToRk: record.dueSupplierToRk || '',
      deliveredAt: record.deliveredAt ? record.deliveredAt.split('T')[0] : '',
      quantity: record.quantity,
      dueDate: record.dueDate,
    });
    setView('form');
  };

  const toggleSelectId = (id: string) => {
    setSelectedIds(prev => (prev.includes(id) ? prev.filter(itemId => itemId !== id) : [...prev, id]));
  };

  const handleEditSelected = () => {
    if (selectedIds.length === 0) {
      alert('กรุณาเลือกรายการที่ต้องการแก้ไข');
      return;
    }
    if (selectedIds.length > 1) {
      alert('กรุณาเลือกเพียง 1 รายการเพื่อแก้ไข');
      return;
    }
    const targetRecord = records.find(record => record.id === selectedIds[0]);
    if (!targetRecord) {
      alert('ไม่พบรายการที่เลือก');
      return;
    }
    handleEditRecord(targetRecord);
  };

  const handleRestoreSelected = async () => {
    if (selectedIds.length === 0) {
      alert('กรุณาเลือกรายการที่ต้องการส่งกลับ');
      return;
    }
    const now = new Date().toISOString();
    const nextRecords = records.map(record =>
      selectedIds.includes(record.id)
        ? { ...record, isDelivered: false, deliveredAt: undefined, updatedAt: now }
        : record
    );
    setRecords(nextRecords);
    try {
      const changed = nextRecords.filter(record => selectedIds.includes(record.id));
      await syncDueRecords(changed);
      await loadDueRecords(undefined, true);
    } catch (error) {
      console.error('Error syncing due records:', error);
      alert('บันทึกไม่สำเร็จ (Supabase): ' + error);
    }
    setSelectedIds([]);
    setIsSelectMode(false);
    setListMode('pending');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white/80">
        Loading...
      </div>
    );
  }

  if (view === 'menu') {
    return (
      <div className="min-h-screen bg-black relative overflow-hidden">
        <link href="https://fonts.googleapis.com/css2?family=Kalam:wght@300;400;700&display=swap" rel="stylesheet" />
        <div className="absolute inset-0">
          <div className="absolute top-12 left-16 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-24 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse delay-700"></div>
        </div>

        <div className="container mx-auto px-8 py-8 relative z-10 max-w-[95%] min-h-screen flex flex-col">
          <div className="mb-8 relative w-full">
            <h1 className="text-4xl font-extrabold text-white">
              🚚 DUE DELIVERY
              <div className="text-2xl font-normal text-white/70 mt-2">
                (บันทึกกำหนดส่งงาน)
              </div>
            </h1>
            <div className="absolute top-0 right-0">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsImportOpen(true)}
                  className="bg-white/15 hover:bg-white/25 backdrop-blur-sm text-white px-5 py-3 rounded-lg text-sm font-semibold shadow-md transition-all duration-200 border border-white/25 hover:border-white/40"
                >
                  Import Excel
                </button>
                <button
                  type="button"
                  onClick={() => window.history.back()}
                  className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-12 py-6 rounded-lg text-2xl font-bold shadow-lg transition-all duration-200 border border-white/30 hover:border-white/50 hover:shadow-xl"
                >
                  ← BACK
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-1 items-center justify-center w-full">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl place-items-center">
              {[
                {
                  title: 'DOMESTIC',
                  subtitle: 'บันทึกกำหนดส่งงานภายในประเทศ',
                  icon: '🏢',
                  type: 'domestic' as const,
                },
                {
                  title: 'INTERNATIONAL',
                  subtitle: 'บันทึกกำหนดส่งงานต่างประเทศ',
                  icon: '🌍',
                  type: 'international' as const,
                },
              ].map(card => (
                <button
                  key={card.type}
                  type="button"
                  onClick={() => {
                    setEditingRecord(null);
                    setSelectedType(card.type);
                    setFormData(createEmptyForm(card.type));
                    setView('list');
                  }}
                  className="group bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.15),0_10px_25px_rgba(0,0,0,0.1),0_5px_10px_rgba(0,0,0,0.05),inset_0_6px_0_rgba(255,255,255,1),inset_0_-6px_0_rgba(0,0,0,0.25),inset_6px_0_0_rgba(255,255,255,0.9),inset_-6px_0_0_rgba(0,0,0,0.2)] border-2 border-gray-300 hover:shadow-[0_30px_70px_rgba(0,0,0,0.25),0_15px_35px_rgba(0,0,0,0.15),0_8px_15px_rgba(0,0,0,0.1),inset_0_8px_0_rgba(255,255,255,1),inset_0_-8px_0_rgba(0,0,0,0.3),inset_8px_0_0_rgba(255,255,255,1),inset_-8px_0_0_rgba(0,0,0,0.25)] hover:border-gray-400 hover:scale-105 hover:-translate-y-2 transition-all duration-500 ease-out relative overflow-hidden transform-gpu w-full max-w-sm"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent opacity-60 pointer-events-none"></div>
                  <div className="absolute top-0 left-0 w-1/3 h-1/3 bg-gradient-to-br from-white/30 to-transparent rounded-3xl blur-xl opacity-50"></div>
                  <div className="p-10 text-center h-full flex flex-col justify-center min-h-[460px] relative z-10">
                    <div className="mb-8">
                      <div className="w-24 h-24 bg-gradient-to-br from-orange-100 to-yellow-100 rounded-2xl flex items-center justify-center mx-auto shadow-md">
                        <span className="text-5xl">{card.icon}</span>
                      </div>
                    </div>
                    <h3 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-3 leading-tight">
                      {card.title}
                    </h3>
                    <p className="text-lg text-gray-600 leading-relaxed font-medium">
                      {card.subtitle}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {isImportOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6">
              <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-800">Import DUE จาก Excel</h3>
                  <button
                    type="button"
                    onClick={() => {
                      if (importLoading) return;
                      setIsImportOpen(false);
                      setImportMessage(null);
                      setImportFile(null);
                    }}
                    className="text-gray-500 hover:text-gray-700 font-semibold"
                  >
                    ✕
                  </button>
                </div>
                <div className="px-6 py-5 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">ไฟล์ Excel (.xlsx)</label>
                    <input
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={(e) => setImportFile(e.target.files?.[0] ?? null)}
                      className="block w-full text-sm text-gray-700"
                      disabled={importLoading}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">รหัสผ่าน</label>
                    <input
                      type="password"
                      value={importKey}
                      onChange={(e) => setImportKey(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-rose-400"
                      placeholder="ใส่รหัสผ่านเพื่อ Import"
                      disabled={importLoading}
                    />
                  </div>
                  {importMessage && (
                    <div className="text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                      {importMessage}
                    </div>
                  )}
                </div>
                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      if (importLoading) return;
                      setIsImportOpen(false);
                      setImportMessage(null);
                      setImportFile(null);
                    }}
                    className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                    disabled={importLoading}
                  >
                    ปิด
                  </button>
                  <button
                    type="button"
                    onClick={handleImportExcel}
                    className="px-4 py-2 rounded-lg bg-rose-500 hover:bg-rose-600 text-white font-semibold disabled:opacity-60"
                    disabled={importLoading}
                  >
                    {importLoading ? 'กำลัง Import...' : 'Import'}
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <link href="https://fonts.googleapis.com/css2?family=Kalam:wght@300;400;700&display=swap" rel="stylesheet" />
      <div className="absolute inset-0">
        <div className="absolute top-12 left-16 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-24 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse delay-700"></div>
      </div>

      <div className="container mx-auto px-8 py-8 relative z-10 max-w-[95%]">
        <div className="mb-8 relative">
          <h1 className="text-4xl font-extrabold text-white">
            🚚 DUE DELIVERY
            <div className="text-2xl font-normal text-white/70 mt-2">
              (บันทึกกำหนดส่งงาน)
            </div>
          </h1>
          <div className="absolute top-0 right-0">
            <button
              onClick={() => {
                if (view === 'form') {
                  setEditingRecord(null);
                  setView('list');
                  return;
                }
                if (view === 'list') {
                  setView('menu');
                  return;
                }
                window.location.href = '/dashboard';
              }}
              className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-12 py-6 rounded-lg text-2xl font-bold shadow-lg transition-all duration-200 border border-white/30 hover:border-white/50 hover:shadow-xl"
            >
              ← BACK
            </button>
          </div>
        </div>

        {view === 'list' ? (
          <div className="space-y-3 pb-20">
            <div className="sticky top-0 z-30 space-y-3">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-semibold text-white">
                      {selectedType === 'domestic' ? 'Domestic Records' : 'International Records'}
                    </h2>
                    <p className="text-white/60">
                      {listMode === 'delivered'
                        ? 'รายการงานส่งแล้ว'
                        : 'รายการงานคงค้าง (ยังไม่ถึง DUE)'}
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      placeholder="Search customer, model, part, PO, event..."
                      className="w-full lg:w-80 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-emerald-300"
                    />
                    {listMode === 'pending' && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingRecord(null);
                          setFormData(createEmptyForm(selectedType));
                          setView('form');
                        }}
                        className="px-6 py-3 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600"
                      >
                        ➕ Add Record
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setIsSelectMode(prev => !prev);
                        setSelectedIds([]);
                      }}
                      className="px-6 py-3 rounded-xl bg-white/15 text-white/80 hover:bg-white/25"
                    >
                      ⚙️ ตัวเลือก
                    </button>
                    {isSelectMode && (
                      <button
                        type="button"
                        onClick={handleEditSelected}
                        className="px-6 py-3 rounded-xl bg-amber-500 text-white hover:bg-amber-600"
                      >
                        ✏️ แก้ไขที่เลือก ({selectedIds.length})
                      </button>
                    )}
                    {isSelectMode && listMode === 'delivered' && (
                      <button
                        type="button"
                        onClick={handleRestoreSelected}
                        className="px-6 py-3 rounded-xl bg-sky-500 text-white hover:bg-sky-600"
                      >
                        ↩ ส่งกลับรายการคงค้าง ({selectedIds.length})
                      </button>
                    )}
                    {listMode === 'pending' ? (
                      <button
                        type="button"
                        onClick={() => setListMode('delivered')}
                        className="px-6 py-3 rounded-xl bg-purple-600 text-white hover:bg-purple-700 flex items-center gap-2"
                      >
                        📂 งานส่งแล้ว
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setListMode('pending')}
                        className="px-6 py-3 rounded-xl bg-white/10 text-white/80 hover:bg-white/20"
                      >
                        ↩ รายการคงค้าง
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div
                ref={dueTableXRef}
                onScroll={() => syncDueHorizontalScroll('table')}
                className="overflow-auto pb-2 max-h-[max(240px,calc(100vh-420px))]"
              >
                <div className="min-w-[3000px]">
                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20">
                    <div className="sticky top-0 z-50 bg-neutral-900 px-2 py-2 border-b border-white/20 shadow-md shadow-black/50">
                      <div
                        className={`grid min-w-[3000px] ${
                          isSelectMode
                            ? 'grid-cols-[60px_280px_140px_140px_110px_150px_260px_110px_120px_130px_140px_150px_120px_150px_130px_110px_110px_110px_110px_110px_160px]'
                            : 'grid-cols-[280px_140px_140px_110px_150px_260px_110px_120px_130px_140px_150px_120px_150px_130px_110px_110px_110px_110px_110px_160px]'
                        } items-stretch gap-0 text-white text-xs font-semibold uppercase tracking-wide text-center w-full min-h-[64px]`}
                      >
                        {isSelectMode && <span className="px-2 py-2 flex items-center justify-center">เลือก</span>}
                        <span
                          className={`px-2 py-2 flex items-center justify-center leading-tight whitespace-normal break-words ${
                            isSelectMode ? 'border-l border-white/20' : ''
                          }`}
                        >
                          Customer
                        </span>
                        <span className="px-2 py-2 flex items-center justify-center border-l border-white/20 leading-tight whitespace-normal break-words">Product Request No.</span>
                        <span className="px-2 py-2 flex items-center justify-center border-l border-white/20 leading-tight whitespace-normal break-words">
                          Sample Produce
                          <br />
                          Request Sheet
                        </span>
                        <span className="px-2 py-2 flex items-center justify-center border-l border-white/20 leading-tight whitespace-normal break-words">Model</span>
                        <span className="px-2 py-2 flex items-center justify-center border-l border-white/20 leading-tight whitespace-normal break-words">Part No.</span>
                        <span className="px-2 py-2 flex items-center justify-center border-l border-white/20 leading-tight whitespace-normal break-words">Part Name</span>
                        <span className="px-2 py-2 flex items-center justify-center border-l border-white/20 leading-tight whitespace-normal break-words">DWG REV</span>
                        <span className="px-2 py-2 flex items-center justify-center border-l border-white/20 leading-tight whitespace-normal break-words">DWG NO.</span>
                        <span className="px-2 py-2 flex items-center justify-center border-l border-white/20 leading-tight whitespace-normal break-words">Event</span>
                        <span className="px-2 py-2 flex items-center justify-center border-l border-white/20 leading-tight whitespace-normal break-words">Supplier</span>
                        <span className="px-2 py-2 flex items-center justify-center border-l border-white/20 leading-tight whitespace-normal break-words">Q'TY to Customer</span>
                        <span className="px-2 py-2 flex items-center justify-center border-l border-white/20 leading-tight whitespace-normal break-words">Due RK to Customer</span>
                        <span className="px-2 py-2 flex items-center justify-center border-l border-white/20 leading-tight whitespace-normal break-words">MYOB</span>
                        <span className="px-2 py-2 flex items-center justify-center border-l border-white/20 leading-tight whitespace-normal break-words">PR / PO</span>
                        <span className="px-2 py-2 flex items-center justify-center border-l border-white/20 leading-tight whitespace-normal break-words">เลขที่ใบเบิก</span>
                        <span className="px-2 py-2 flex items-center justify-center border-l border-white/20 leading-tight whitespace-normal break-words">PUCHASE</span>
                        <span className="px-2 py-2 flex items-center justify-center border-l border-white/20 leading-tight whitespace-normal break-words">Invoice In</span>
                        <span className="px-2 py-2 flex items-center justify-center border-l border-white/20 leading-tight whitespace-normal break-words">Invoice Out</span>
                        <span className="px-2 py-2 flex items-center justify-center border-l border-white/20 leading-tight whitespace-normal break-words">DATE OUT</span>
                        <span className="px-2 py-2 flex items-center justify-center border-l border-white/20 leading-tight whitespace-normal break-words">Action</span>
                      </div>
                    </div>

                    {filteredByType.length === 0 ? (
                      <div className="p-12 text-center">
                        <div className="text-5xl mb-4">📄</div>
                        <div className="text-2xl text-white">No DUE records yet</div>
                        <div className="text-white/60">Press “Add Record” to create a new entry</div>
                      </div>
                    ) : (
                      <div className="px-2">
                        {filteredByType.map((record, index) => (
                          <div
                            key={record.id}
                            className={index === 0 ? '' : 'border-t border-white/20'}
                          >
                            <div
                              className={`grid min-w-[3000px] ${
                                isSelectMode
                                  ? 'grid-cols-[60px_280px_140px_140px_110px_150px_260px_110px_120px_130px_140px_150px_120px_150px_130px_110px_110px_110px_110px_110px_160px]'
                                  : 'grid-cols-[280px_140px_140px_110px_150px_260px_110px_120px_130px_140px_150px_120px_150px_130px_110px_110px_110px_110px_110px_160px]'
                              } items-stretch gap-0 ${getDueRowColor(index)} text-xs font-semibold leading-tight w-full min-h-[44px]`}
                            >
                              {isSelectMode && (
                                <div className="flex items-center justify-center">
                                  <input
                                    type="checkbox"
                                    checked={selectedIds.includes(record.id)}
                                  onChange={() => toggleSelectId(record.id)}
                                  className="h-4 w-4 rounded border-white/40 text-amber-400"
                                />
                              </div>
                            )}
                            <div
                              className={`px-2 py-0 flex items-center justify-start text-left gap-2 whitespace-nowrap overflow-hidden ${
                                isSelectMode ? 'border-l border-white/20' : ''
                              }`}
                            >
                              {(() => {
                                const flagCountry = record.countryOfOrigin || (record.deliveryType === 'domestic' ? 'Thailand' : '');
                                const flagUrl = flagCountry ? getCountryFlagUrl(flagCountry) : '';
                                const customerName = resolveCustomerDisplayName(record.customer);
                                return (
                                  <>
                                    {flagUrl ? (
                                      <img
                                        src={flagUrl}
                                        alt={flagCountry}
                                        className="h-[14px] w-[18px] rounded-sm border border-white/30"
                                        loading="lazy"
                                      />
                                    ) : null}
                                    <span className="min-w-0 truncate" title={customerName}>
                                      {customerName}
                                    </span>
                                  </>
                                );
                              })()}
                            </div>
                            <div className="px-2 py-0 flex items-center justify-center text-center border-l border-white/20 whitespace-nowrap overflow-hidden text-ellipsis" title={record.productRequestNo || ''}>
                              {record.productRequestNo || '-'}
                            </div>
                            <div className="px-2 py-0 flex items-center justify-center text-center border-l border-white/20 whitespace-nowrap overflow-hidden text-ellipsis" title={record.sampleRequestSheet || ''}>
                              {record.sampleRequestSheet || '-'}
                            </div>
                            <div className="px-2 py-0 flex items-center justify-center text-center border-l border-white/20 whitespace-nowrap overflow-hidden text-ellipsis" title={record.model}>
                              {record.model}
                            </div>
                            <div className="px-2 py-0 flex items-center justify-center text-center border-l border-white/20 whitespace-nowrap overflow-hidden text-ellipsis" title={record.partNumber}>
                              {record.partNumber}
                            </div>
                            <div className="px-2 py-0 flex items-center justify-center text-center border-l border-white/20 whitespace-nowrap overflow-hidden text-ellipsis" title={record.partName}>
                              {record.partName}
                            </div>
                            <div className="px-2 py-0 flex items-center justify-center text-center border-l border-white/20">{record.revisionLevel || '-'}</div>
                            <div className="px-2 py-0 flex items-center justify-center text-center border-l border-white/20">{record.revisionNumber || '-'}</div>
                            <div className="px-2 py-0 flex items-center justify-center text-center border-l border-white/20 whitespace-nowrap overflow-hidden text-ellipsis" title={record.event || ''}>
                              {record.event || '-'}
                            </div>
                            <div className="px-2 py-0 flex items-center justify-center text-center border-l border-white/20 whitespace-nowrap overflow-hidden text-ellipsis" title={record.supplier || ''}>
                              {record.supplier || '-'}
                            </div>
                            <div className="px-2 py-0 flex items-center justify-center text-center border-l border-white/20">{record.quantity} PCS</div>
                            <div className="px-2 py-0 flex items-center justify-center text-center border-l border-white/20">{formatDueDate(record.dueRkToCustomer || record.dueDate)}</div>
                            <div className="px-2 py-0 flex items-center justify-center text-center border-l border-white/20 whitespace-nowrap overflow-hidden text-ellipsis" title={record.myobNumber || ''}>
                              {record.myobNumber || '-'}
                            </div>
                            <div
                              className="px-2 py-0 flex items-center justify-center text-center border-l border-white/20 whitespace-nowrap overflow-hidden text-ellipsis"
                              title={record.customerPo || record.prPo || ''}
                            >
                              {record.customerPo || record.prPo || '-'}
                            </div>
                            <div className="px-2 py-0 flex items-center justify-center text-center border-l border-white/20 whitespace-nowrap overflow-hidden text-ellipsis" title={record.withdrawalNumber || ''}>
                              {record.withdrawalNumber || '-'}
                            </div>
                            <div className="px-2 py-0 flex items-center justify-center text-center border-l border-white/20 whitespace-nowrap overflow-hidden text-ellipsis" title={record.purchase || ''}>
                              {record.purchase || '-'}
                            </div>
                            <div className="px-2 py-0 flex items-center justify-center text-center border-l border-white/20 whitespace-nowrap overflow-hidden text-ellipsis" title={record.invoiceIn || ''}>
                              {record.invoiceIn || '-'}
                            </div>
                            <div className="px-2 py-0 flex items-center justify-center text-center border-l border-white/20 whitespace-nowrap overflow-hidden text-ellipsis" title={record.invoiceOut || ''}>
                              {record.invoiceOut || '-'}
                            </div>
                            <div className="px-2 py-0 flex items-center justify-center text-center border-l border-white/20">{record.deliveredAt ? record.deliveredAt.split('T')[0] : '-'}</div>
                            <div className="px-2 py-1 flex items-center justify-center text-center border-l border-white/20 overflow-hidden">
                              <div className="flex items-center justify-center gap-2 w-full">
                                {listMode === 'pending' ? (
                                  <button
                                    onClick={() => openDeliverForm(record)}
                                    className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded-md flex items-center justify-center gap-2 text-xs leading-tight h-8 flex-1 whitespace-nowrap"
                                  >
                                    📁 ส่งงาน
                                  </button>
                                ) : (
                                  <span className="bg-white/15 text-white/80 px-3 py-1 rounded-md text-xs leading-tight h-8 flex items-center justify-center flex-1 whitespace-nowrap">
                                    ส่งแล้ว
                                  </span>
                                )}
                                <button
                                  type="button"
                                  onClick={() => deleteDueRecord(record)}
                                  className="bg-red-600 hover:bg-red-700 text-white h-8 w-10 rounded-md flex items-center justify-center text-xs"
                                  title="ลบรายการ"
                                >
                                  🗑
                                </button>
                              </div>
                            </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="fixed left-0 right-0 bottom-0 z-40 pb-6">
              <div className="container mx-auto px-8 max-w-[95%]">
                <div
                  ref={dueBottomScrollRef}
                  onScroll={() => syncDueHorizontalScroll('bar')}
                  className="due-scrollbar h-6 overflow-x-scroll overflow-y-hidden rounded-xl border border-white/50 bg-white/10 backdrop-blur-sm shadow-lg"
                >
                  <div style={{ width: Math.max(dueTableScrollWidth, 0), height: 1 }} />
                </div>
              </div>
            </div>

            {isDeliverTypeOpen && deliverRecord && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6">
                <div className="w-full max-w-lg rounded-2xl border border-white/30 bg-white/15 p-6 text-white shadow-2xl backdrop-blur-sm">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-2xl font-semibold">เลือกประเภทงาน</h3>
                      <p className="text-sm text-white/80">กรุณาเลือกก่อนทำรายการส่งงาน</p>
                    </div>
                    <button
                      type="button"
                      onClick={closeDeliverType}
                      className="text-white/80 hover:text-white"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => handleSelectDeliverType('new')}
                      className="w-full rounded-xl bg-emerald-500 px-6 py-4 text-left font-semibold text-white hover:bg-emerald-600"
                    >
                      งาน NEW MODEL (ตัดสต๊อก)
                      <div className="text-sm text-white/80 font-normal mt-1">เปิดฟอร์มยืนยันและตัดสต๊อกตามจำนวน DUE</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectDeliverType('mass')}
                      className="w-full rounded-xl bg-purple-600 px-6 py-4 text-left font-semibold text-white hover:bg-purple-700"
                    >
                      งาน MASS (ไม่ตัดสต๊อก)
                      <div className="text-sm text-white/80 font-normal mt-1">บันทึกส่งงานโดยไม่ตัดสต๊อก</div>
                    </button>
                  </div>
                </div>
              </div>
            )}
            {isDeliverFormOpen && deliverRecord && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6">
                <div
                  className={`w-full max-w-3xl rounded-2xl border p-6 shadow-2xl backdrop-blur-sm ${
                    isStockInsufficient
                      ? 'bg-rose-500/30 border-rose-200/60 text-rose-100'
                      : 'bg-white/15 border-white/30 text-white'
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-2xl font-semibold">ยืนยันการส่งงาน</h3>
                      <p className="text-sm text-white/80">ตรวจสอบข้อมูลก่อนตัดสต๊อก</p>
                    </div>
                    <button
                      type="button"
                      onClick={closeDeliverForm}
                      className="text-white/80 hover:text-white"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="rounded-xl border border-white/20 bg-white/10 p-4">
                      <div className="font-semibold mb-2">ข้อมูลชิ้นงาน</div>
                      <div>MYOB: {deliverRecord.myobNumber || '-'}</div>
                      <div>PART NO: {deliverRecord.partNumber || '-'}</div>
                      <div>PART NAME: {deliverRecord.partName || '-'}</div>
                      <div>EVENT: {deliverRecord.event || '-'}</div>
                    </div>
                    <div className="rounded-xl border border-white/20 bg-white/10 p-4">
                      <div className="font-semibold mb-2">ข้อมูลลูกค้า</div>
                      <div>CUSTOMER: {deliverRecord.customer || '-'}</div>
                      <div>PO: {deliverRecord.customerPo || '-'}</div>
                      <div>SUPPLIER: {deliverFormData.supplier || '-'}</div>
                      <div>จำนวนคงเหลือ: {getRecordBalance(deliverRecord)} PCS</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-sm mb-1">จำนวนที่จะตัด (PCS)</label>
                      <input
                        name="quantity"
                        value={deliverRecord.quantity}
                        disabled
                        className="w-full rounded-xl border border-white/30 bg-white/10 px-4 py-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm mb-1">วันที่จ่ายออก</label>
                      <input
                        name="issueDate"
                        type="date"
                        value={deliverFormData.issueDate}
                        onChange={handleDeliverInputChange}
                        className="w-full rounded-xl border border-white/30 bg-white/10 px-4 py-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm mb-1">Due ที่ส่ง</label>
                      <input
                        name="dueDate"
                        type="date"
                        value={deliverFormData.dueDate}
                        onChange={handleDeliverInputChange}
                        className="w-full rounded-xl border border-white/30 bg-white/10 px-4 py-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm mb-1">Supplier</label>
                      <input
                        name="supplier"
                        value={deliverFormData.supplier}
                        onChange={handleDeliverInputChange}
                        className="w-full rounded-xl border border-white/30 bg-white/10 px-4 py-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm mb-1">PUCHASE</label>
                      <input
                        name="purchase"
                        value={deliverFormData.purchase}
                        onChange={handleDeliverInputChange}
                        className="w-full rounded-xl border border-white/30 bg-white/10 px-4 py-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm mb-1">Customer</label>
                      <input
                        name="customer"
                        value={deliverFormData.customer}
                        onChange={handleDeliverInputChange}
                        className="w-full rounded-xl border border-white/30 bg-white/10 px-4 py-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm mb-1">เลขPO customer</label>
                      <input
                        name="customerPo"
                        value={deliverFormData.customerPo}
                        onChange={handleDeliverInputChange}
                        className="w-full rounded-xl border border-white/30 bg-white/10 px-4 py-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm mb-1">INVOICE IN</label>
                      <input
                        name="invoiceIn"
                        value={deliverFormData.invoiceIn}
                        onChange={handleDeliverInputChange}
                        className="w-full rounded-xl border border-white/30 bg-white/10 px-4 py-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm mb-1">invoice out</label>
                      <input
                        name="invoiceNumber"
                        value={deliverFormData.invoiceNumber}
                        onChange={handleDeliverInputChange}
                        className="w-full rounded-xl border border-white/30 bg-white/10 px-4 py-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm mb-1">เลขใบเบิก</label>
                      <input
                        name="withdrawalNumber"
                        value={deliverFormData.withdrawalNumber}
                        onChange={handleDeliverInputChange}
                        className="w-full rounded-xl border border-white/30 bg-white/10 px-4 py-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm mb-1">Q'TY supplier to RK</label>
                      <input
                        name="dueSupplierToRk"
                        value={deliverFormData.dueSupplierToRk}
                        onChange={handleDeliverInputChange}
                        className="w-full rounded-xl border border-white/30 bg-white/10 px-4 py-2 text-white"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm mb-1">หมายเหตุ</label>
                      <textarea
                        name="remarks"
                        value={deliverFormData.remarks}
                        onChange={handleDeliverInputChange}
                        rows={3}
                        className="w-full rounded-xl border border-white/30 bg-white/10 px-4 py-2 text-white"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row justify-between gap-3 mt-6">
                    <button
                      type="button"
                      onClick={closeDeliverForm}
                      className="px-5 py-2 rounded-xl bg-white/20 text-white hover:bg-white/30"
                    >
                      ← ย้อนกลับรายการคงค้าง
                    </button>
                    <button
                      type="button"
                      onClick={handleDeliverConfirm}
                      className="px-6 py-2 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600"
                    >
                      ยืนยันตัดสต๊อก
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-5xl max-h-[90vh] overflow-y-auto bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-semibold text-white">{editingRecord ? 'Edit DUE Record' : 'New DUE Record'}</h2>
                  <p className="text-white/60">Fill in the details to save the delivery due</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEditingRecord(null);
                    setFormData(createEmptyForm(formData.deliveryType));
                    setView('list');
                  }}
                  className="text-white/70 hover:text-white"
                >
                  ✕ Close
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label className="block text-white/80 mb-2">Customer *</label>
                  <input
                    name="customer"
                    value={formData.customer}
                    onChange={handleInputChange}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-300"
                    required
                  />
                </div>
                <div>
                  <label className="block text-white/80 mb-2">Product request no.</label>
                  <input
                    name="productRequestNo"
                    value={formData.productRequestNo}
                    onChange={handleInputChange}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-300"
                  />
                </div>
                <div>
                  <label className="block text-white/80 mb-2">Sample produce request sheet *</label>
                  <input
                    type="text"
                    name="sampleRequestSheet"
                    value={formData.sampleRequestSheet}
                    onChange={handleInputChange}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-emerald-300"
                    required
                  />
                </div>

                <div>
                  <label className="block text-white/80 mb-2">MODEL *</label>
                  <input
                    name="model"
                    value={formData.model}
                    onChange={handleInputChange}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm text-white text-center focus:outline-none focus:ring-2 focus:ring-emerald-300"
                    required
                  />
                </div>

                <div>
                  <label className="block text-white/80 mb-2">PART NO. *</label>
                  <input
                    name="partNumber"
                    value={formData.partNumber}
                    onChange={handleInputChange}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm text-white text-center focus:outline-none focus:ring-2 focus:ring-emerald-300"
                    required
                  />
                </div>

                <div>
                  <label className="block text-white/80 mb-2">PART NAME *</label>
                  <input
                    name="partName"
                    value={formData.partName}
                    onChange={handleInputChange}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm text-white text-center focus:outline-none focus:ring-2 focus:ring-emerald-300"
                    required
                  />
                </div>

                <div>
                  <label className="block text-white/80 mb-2">DWG REV *</label>
                  <input
                    name="revisionLevel"
                    value={formData.revisionLevel}
                    onChange={handleInputChange}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm text-white text-center focus:outline-none focus:ring-2 focus:ring-emerald-300"
                    required
                  />
                </div>

                <div>
                  <label className="block text-white/80 mb-2">DWG NO. *</label>
                  <input
                    name="revisionNumber"
                    value={formData.revisionNumber}
                    onChange={handleInputChange}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm text-white text-center focus:outline-none focus:ring-2 focus:ring-emerald-300"
                    required
                  />
                </div>

                <div>
                  <label className="block text-white/80 mb-2">MYOB *</label>
                  <input
                    name="myobNumber"
                    value={formData.myobNumber}
                    onChange={handleInputChange}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm text-white text-center focus:outline-none focus:ring-2 focus:ring-emerald-300"
                    required
                  />
                </div>

                <div>
                  <label className="block text-white/80 mb-2">Q'TY to Customer *</label>
                  <input
                    type="number"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleInputChange}
                    min="0"
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm text-white text-center focus:outline-none focus:ring-2 focus:ring-emerald-300"
                    required
                  />
                </div>

                <div>
                  <label className="block text-white/80 mb-2">EVENT *</label>
                  <input
                    name="event"
                    value={formData.event}
                    onChange={handleInputChange}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-300"
                    required
                  />
                </div>

                <div>
                  <label className="block text-white/80 mb-2">Supplier</label>
                  <input
                    name="supplier"
                    value={formData.supplier}
                    onChange={handleInputChange}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-300"
                  />
                </div>

                <div>
                  <label className="block text-white/80 mb-2">PR / PO *</label>
                  <input
                    name="customerPo"
                    value={formData.customerPo}
                    onChange={handleInputChange}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-300"
                    required
                  />
                </div>

                <div>
                  <label className="block text-white/80 mb-2">Due RK to Customer *</label>
                  <input
                    type="text"
                    name="dueDate"
                    value={formData.dueDate}
                    onChange={handleInputChange}
                    placeholder="dd/mm/yyyy or urgent/asap"
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-emerald-300"
                    required
                  />
                </div>

                <div>
                  <label className="block text-white/80 mb-2">Country of Origin *</label>
                  <div className="flex items-center gap-3">
                    <div className="relative w-full max-w-[520px]">
                      <select
                        name="countryOfOrigin"
                        value={formData.countryOfOrigin}
                        onChange={handleInputChange}
                        className="w-full appearance-none bg-white/90 border border-white/20 rounded-xl px-3 pr-10 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-emerald-300"
                        required
                      >
                        <option value="">เลือกประเทศ</option>
                        {COUNTRY_OPTIONS.map(country => (
                          <option key={country} value={country} className="text-black">
                            {country}
                          </option>
                        ))}
                      </select>
                      <svg
                        className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-600"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="flex h-[38px] w-[60px] items-center justify-center rounded-xl border border-white/20 bg-white/90">
                      {formData.countryOfOrigin ? (
                        <img
                          src={getCountryFlagUrl(formData.countryOfOrigin)}
                          alt={formData.countryOfOrigin}
                          className="h-[18px] w-[24px] rounded-sm"
                        />
                      ) : (
                        <span className="text-lg">🏳️</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div />
              </div>


                <div className="flex justify-end gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingRecord(null);
                      setFormData(createEmptyForm(formData.deliveryType));
                      setView('list');
                    }}
                    className="px-6 py-3 rounded-xl bg-white/10 text-white/80 hover:bg-white/20"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600"
                  >
                    {editingRecord ? 'Update' : 'Save'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface PackingFormData {
  supplier: string;
  model: string;
  partNumber: string;
  partName: string;
  qtyPerBox: number;
  weightPerPiece: number;
  totalWeight: number;
  boxWeight: number; // น้ำหนักรวมกล่อง (รวมน้ำหนักกล่องเปล่า)
  boxType: string;
  boxWidth: number;
  boxLength: number;
  boxHeight: number;
  boxesPerPallet: number;
  weightPerPallet: number;
  palletWidth: number;
  palletLength: number;
  palletHeight: number;
  totalPiecesOnPallet: number;
  palletsPerTruck: number; // จำนวนพาเลทต่อรถ
  maxPalletsPerTruck: number; // จำนวนพาเลทสูงสุดต่อรถ
  totalPiecesPerTruck: number; // จำนวนชิ้นงานรวมต่อรถ
  maxPiecesPerTruck: number; // จำนวนชิ้นงานสูงสุดต่อรถ
  truckSize1: string; // ขนาดรถใช้ขนส่ง แถวที่ 1
  truckSize2?: string; // ขนาดรถใช้ขนส่ง แถวที่ 2
  remarks?: string;
  partImage?: string; // Base64 encoded image or URL
}

interface PackingRecord extends PackingFormData {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export default function PackingPage() {
  return <DueDeliveryPage />;
}

function PackingLegacy() {
  const [packingRecords, setPackingRecords] = useState<PackingRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<PackingRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingRecord, setEditingRecord] = useState<PackingRecord | null>(null);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [formData, setFormData] = useState<PackingFormData>({
    supplier: '',
    model: '',
    partNumber: '',
    partName: '',
    qtyPerBox: 0,
    weightPerPiece: 0,
    totalWeight: 0,
    boxWeight: 0,
    boxType: '',
    boxWidth: 0,
    boxLength: 0,
    boxHeight: 0,
    boxesPerPallet: 0,
    weightPerPallet: 0,
    palletWidth: 0,
    palletLength: 0,
    palletHeight: 0,
    totalPiecesOnPallet: 0,
    palletsPerTruck: 0,
    maxPalletsPerTruck: 0,
    totalPiecesPerTruck: 0,
    maxPiecesPerTruck: 0,
    truckSize1: '',
    truckSize2: '',
    remarks: '',
    partImage: '',
  });

  // Auto-calculate fields
  useEffect(() => {
    if (formData.qtyPerBox > 0 && formData.weightPerPiece > 0) {
      const totalWeight = formData.qtyPerBox * formData.weightPerPiece;
      setFormData(prev => ({ ...prev, totalWeight }));
    }
  }, [formData.qtyPerBox, formData.weightPerPiece]);

  useEffect(() => {
    if (formData.qtyPerBox > 0 && formData.boxesPerPallet > 0) {
      const totalPiecesOnPallet = formData.qtyPerBox * formData.boxesPerPallet;
      setFormData(prev => ({ ...prev, totalPiecesOnPallet }));
    }
  }, [formData.qtyPerBox, formData.boxesPerPallet]);

  useEffect(() => {
    if (formData.totalWeight > 0 && formData.boxesPerPallet > 0) {
      const weightPerPallet = formData.totalWeight * formData.boxesPerPallet;
      setFormData(prev => ({ ...prev, weightPerPallet }));
    }
  }, [formData.totalWeight, formData.boxesPerPallet]);

  const fetchPackingRecords = async () => {
    try {
      // Load data from localStorage
      const savedData = localStorage.getItem('packingRecords');
      if (savedData) {
        const parsedData: PackingRecord[] = JSON.parse(savedData);
        setPackingRecords(parsedData);
        setFilteredRecords(parsedData);
      } else {
        // If no saved data, start with empty array
        setPackingRecords([]);
        setFilteredRecords([]);
      }
    } catch (error) {
      console.error('Error fetching packing records:', error);
      // If error parsing, start fresh
      setPackingRecords([]);
      setFilteredRecords([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPackingRecords();
  }, []);

  // Filter records based on search term
  useEffect(() => {
    if (!searchTerm) {
      setFilteredRecords(packingRecords);
    } else {
      const filtered = packingRecords.filter(record => {
        const search = searchTerm.toLowerCase();
        return (
          record.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
          record.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
          record.partNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          record.partName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          record.truckSize1.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (record.truckSize2 && record.truckSize2.toLowerCase().includes(searchTerm.toLowerCase())) ||
          record.boxType.toLowerCase().includes(searchTerm.toLowerCase())
        );
      });
      setFilteredRecords(filtered);
    }
  }, [searchTerm, packingRecords]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: ['qtyPerBox', 'weightPerPiece', 'totalWeight', 'boxWeight', 'boxWidth', 'boxLength', 'boxHeight', 
               'boxesPerPallet', 'weightPerPallet', 'palletWidth', 'palletLength', 'palletHeight', 
               'totalPiecesOnPallet', 'palletsPerTruck', 'maxPalletsPerTruck', 'totalPiecesPerTruck', 'maxPiecesPerTruck'].includes(name) ? Number(value) : value,
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check if file is an image
      if (!file.type.startsWith('image/')) {
        alert('กรุณาเลือกไฟล์รูปภาพเท่านั้น');
        return;
      }
      
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('ขนาดไฟล์ต้องไม่เกิน 5MB');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64String = event.target?.result as string;
        setFormData(prev => ({ ...prev, partImage: base64String }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageClick = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setImageModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingRecord) {
        // Update existing record
        const updatedRecords = packingRecords.map(record => 
          record.id === editingRecord.id 
            ? { ...formData, id: editingRecord.id, createdAt: editingRecord.createdAt, updatedAt: new Date().toISOString() }
            : record
        );
        setPackingRecords(updatedRecords);
        localStorage.setItem('packingRecords', JSON.stringify(updatedRecords));
      } else {
        // Add new record
        const newRecord: PackingRecord = {
          ...formData,
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        const updatedRecords = [...packingRecords, newRecord];
        setPackingRecords(updatedRecords);
        localStorage.setItem('packingRecords', JSON.stringify(updatedRecords));
      }
    } catch (error) {
      console.error('Error saving packing record:', error);
      alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง');
      return;
    }
    
    // Reset form and close modal
    setFormData({
      supplier: '',
      model: '',
      partNumber: '',
      partName: '',
      qtyPerBox: 0,
      weightPerPiece: 0,
      totalWeight: 0,
      boxWeight: 0,
      boxType: '',
      boxWidth: 0,
      boxLength: 0,
      boxHeight: 0,
      boxesPerPallet: 0,
      weightPerPallet: 0,
      palletWidth: 0,
      palletLength: 0,
      palletHeight: 0,
      totalPiecesOnPallet: 0,
      palletsPerTruck: 0,
      maxPalletsPerTruck: 0,
      totalPiecesPerTruck: 0,
      maxPiecesPerTruck: 0,
      truckSize1: '',
      truckSize2: '',
      remarks: '',
      partImage: '',
    });
    setIsFormOpen(false);
    setEditingRecord(null);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">กำลังโหลด...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-900 via-fuchsia-900 to-purple-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-72 h-72 bg-violet-400/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-96 h-96 bg-fuchsia-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-purple-400/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>
      
      <div className="container mx-auto px-8 py-8 relative z-10 max-w-[95%]">
        {/* Header with Back Button */}
        <div className="mb-8 relative">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-violet-100 to-fuchsia-200 bg-clip-text text-transparent">
            📦 PACKING INFORMATION
            <div className="text-2xl font-normal text-white/70 mt-2">
              (ข้อมูลการบรรจุ)
            </div>
          </h1>
          
          {/* Back Button */}
          <div className="absolute top-0 right-0">
            <button
              onClick={() => window.location.href = '/dashboard'}
              className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-12 py-6 rounded-lg text-2xl font-bold shadow-lg transition-all duration-200 border border-white/30 hover:border-white/50 hover:shadow-xl"
            >
              ← BACK
            </button>
          </div>
        </div>

        {/* Add New Record Button */}
        <button
          onClick={() => {
            setEditingRecord(null);
            setFormData({
              supplier: '',
              model: '',
              partNumber: '',
              partName: '',
              qtyPerBox: 0,
              weightPerPiece: 0,
              totalWeight: 0,
              boxWeight: 0,
              boxType: '',
              boxWidth: 0,
              boxLength: 0,
              boxHeight: 0,
              boxesPerPallet: 0,
              weightPerPallet: 0,
              palletWidth: 0,
              palletLength: 0,
              palletHeight: 0,
              totalPiecesOnPallet: 0,
              palletsPerTruck: 0,
              maxPalletsPerTruck: 0,
              totalPiecesPerTruck: 0,
              maxPiecesPerTruck: 0,
              truckSize1: '',
              truckSize2: '',
              remarks: '',
              partImage: '',
            });
            setIsFormOpen(true);
          }}
          className="bg-violet-600 hover:bg-violet-700 text-white px-6 py-3 rounded-lg font-medium shadow-sm transition-colors mb-6"
        >
          📦 เพิ่มข้อมูลการบรรจุใหม่
        </button>

        {/* Search Box */}
        <div className="mb-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="ค้นหา Supplier, Model, Part Number, Part Name, Box Type, Truck Size..."
              className="block w-full pl-10 pr-3 py-2 border border-white/30 rounded-md leading-5 bg-white/10 backdrop-blur-sm placeholder-white/60 text-white focus:outline-none focus:placeholder-white/40 focus:ring-1 focus:ring-white/50 focus:border-white/50"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {searchTerm && (
            <p className="mt-2 text-sm text-white/70">
              พบ {filteredRecords.length} รายการจากทั้งหมด {packingRecords.length} รายการ
            </p>
          )}
        </div>

        {/* Data Cards */}
        <div className="space-y-6">
          {filteredRecords.length === 0 ? (
            <div className="bg-white/10 backdrop-blur-sm rounded-xl shadow-2xl border border-white/20 p-12 text-center">
              <div className="text-6xl mb-4">📦</div>
              <div className="text-2xl text-white mb-2">ไม่มีข้อมูลการบรรจุ</div>
              <div className="text-white/60">คลิกปุ่ม "เพิ่มข้อมูลการบรรจุใหม่" เพื่อเริ่มต้น</div>
            </div>
          ) : (
            filteredRecords.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((record) => (
              <div key={record.id} className="bg-white/10 backdrop-blur-sm rounded-xl shadow-2xl border border-white/20 p-6 hover:bg-white/15 transition-all duration-300">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center space-x-4">
                    {/* รูปชิ้นงาน */}
                    <div className="flex-shrink-0">
                      {record.partImage ? (
                        <img 
                          src={record.partImage} 
                          alt="Part Image" 
                          className="w-20 h-20 object-cover rounded-lg border-2 border-white/30 cursor-pointer hover:scale-110 transition-transform shadow-lg"
                          onClick={() => handleImageClick(record.partImage!)}
                        />
                      ) : (
                        <div className="w-20 h-20 bg-white/10 rounded-lg flex items-center justify-center text-white/40 border-2 border-white/20">
                          <div className="text-center">
                            <div className="text-2xl">📷</div>
                            <div className="text-xs">No Image</div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* ข้อมูลหลัก */}
                    <div>
                      <h3 className="text-xl font-bold text-white mb-1">{record.partName}</h3>
                      <div className="text-white/80 space-y-1">
                        <div><span className="font-medium">Supplier:</span> {record.supplier}</div>
                        <div><span className="font-medium">Model:</span> {record.model} | <span className="font-medium">Part Number:</span> {record.partNumber}</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* ปุ่มจัดการ */}
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setEditingRecord(record);
                        setFormData({
                          supplier: record.supplier,
                          model: record.model,
                          partNumber: record.partNumber,
                          partName: record.partName,
                          qtyPerBox: record.qtyPerBox,
                          weightPerPiece: record.weightPerPiece,
                          totalWeight: record.totalWeight,
                          boxWeight: record.boxWeight,
                          boxType: record.boxType,
                          boxWidth: record.boxWidth,
                          boxLength: record.boxLength,
                          boxHeight: record.boxHeight,
                          boxesPerPallet: record.boxesPerPallet,
                          weightPerPallet: record.weightPerPallet,
                          palletWidth: record.palletWidth,
                          palletLength: record.palletLength,
                          palletHeight: record.palletHeight,
                          totalPiecesOnPallet: record.totalPiecesOnPallet,
                          palletsPerTruck: record.palletsPerTruck,
                          maxPalletsPerTruck: record.maxPalletsPerTruck,
                          totalPiecesPerTruck: record.totalPiecesPerTruck,
                          maxPiecesPerTruck: record.maxPiecesPerTruck,
                          truckSize1: record.truckSize1,
                          truckSize2: record.truckSize2 || '',
                          remarks: record.remarks || '',
                          partImage: record.partImage || '',
                        });
                        setIsFormOpen(true);
                      }}
                      className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg transition-colors shadow-lg"
                    >
                      ✏️ แก้ไข
                    </button>
                    <button
                      onClick={() => {
                        const updatedRecords = packingRecords.filter(r => r.id !== record.id);
                        setPackingRecords(updatedRecords);
                        localStorage.setItem('packingRecords', JSON.stringify(updatedRecords));
                      }}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors shadow-lg"
                    >
                      🗑️ ลบ
                    </button>
                  </div>
                </div>

                {/* ข้อมูลรายละเอียด */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* ข้อมูลชิ้นงาน */}
                  <div className="bg-white/5 rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-white mb-3 flex items-center">
                      <span className="mr-2">🔧</span>ข้อมูลชิ้นงาน
                    </h4>
                    <div className="space-y-2 text-sm text-white/90">
                      <div className="flex justify-between">
                        <span>จำนวน/กล่อง:</span>
                        <span className="font-medium">{record.qtyPerBox} ชิ้น</span>
                      </div>
                      <div className="flex justify-between">
                        <span>น้ำหนัก/ตัว:</span>
                        <span className="font-medium">{record.weightPerPiece} kg</span>
                      </div>
                      <div className="flex justify-between">
                        <span>น้ำหนักรวม:</span>
                        <span className="font-medium">{record.totalWeight} kg</span>
                      </div>
                      <div className="flex justify-between">
                        <span>น้ำหนักรวมกล่อง:</span>
                        <span className="font-medium">{record.boxWeight} kg</span>
                      </div>
                    </div>
                  </div>

                  {/* ข้อมูลกล่องและพาเลท */}
                  <div className="bg-white/5 rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-white mb-3 flex items-center">
                      <span className="mr-2">📦</span>กล่อง & พาเลท
                    </h4>
                    <div className="space-y-2 text-sm text-white/90">
                      <div className="flex justify-between">
                        <span>ชนิดกล่อง:</span>
                        <span className="font-medium">{record.boxType}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>ขนาดกล่อง:</span>
                        <span className="font-medium">{record.boxWidth}×{record.boxLength}×{record.boxHeight} mm</span>
                      </div>
                      <div className="flex justify-between">
                        <span>กล่อง/พาเลท:</span>
                        <span className="font-medium">{record.boxesPerPallet} กล่อง</span>
                      </div>
                      <div className="flex justify-between">
                        <span>น้ำหนัก/พาเลท:</span>
                        <span className="font-medium">{record.weightPerPallet} kg</span>
                      </div>
                      <div className="flex justify-between">
                        <span>ขนาดพาเลท:</span>
                        <span className="font-medium">{record.palletWidth}×{record.palletLength}×{record.palletHeight} cm</span>
                      </div>
                      <div className="flex justify-between">
                        <span>ชิ้นงาน/พาเลท:</span>
                        <span className="font-medium">{record.totalPiecesOnPallet} ชิ้น</span>
                      </div>
                    </div>
                  </div>

                  {/* ข้อมูลการขนส่ง */}
                  <div className="bg-white/5 rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-white mb-3 flex items-center">
                      <span className="mr-2">🚛</span>การขนส่ง
                    </h4>
                    <div className="space-y-2 text-sm text-white/90">
                      <div className="flex justify-between">
                        <span>ขนาดรถ 1:</span>
                        <span className="font-medium">{record.truckSize1}</span>
                      </div>
                      {record.truckSize2 && (
                        <div className="flex justify-between">
                          <span>ขนาดรถ 2:</span>
                          <span className="font-medium">{record.truckSize2}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span>พาเลท/รถ:</span>
                        <span className="font-medium">{record.palletsPerTruck} พาเลท</span>
                      </div>
                      {record.maxPalletsPerTruck > 0 && (
                        <div className="flex justify-between">
                          <span>พาเลทสูงสุด:</span>
                          <span className="font-medium">{record.maxPalletsPerTruck} พาเลท</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span>ชิ้นงาน/รถ:</span>
                        <span className="font-medium">{record.totalPiecesPerTruck} ชิ้น</span>
                      </div>
                      {record.maxPiecesPerTruck > 0 && (
                        <div className="flex justify-between">
                          <span>ชิ้นงานสูงสุด:</span>
                          <span className="font-medium">{record.maxPiecesPerTruck} ชิ้น</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* หมายเหตุ */}
                {record.remarks && (
                  <div className="mt-4 bg-white/5 rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-white mb-2 flex items-center">
                      <span className="mr-2">📝</span>หมายเหตุ
                    </h4>
                    <p className="text-white/90 text-sm">{record.remarks}</p>
                  </div>
                )}

                {/* วันที่สร้างและอัปเดต */}
                <div className="mt-4 pt-4 border-t border-white/10 flex justify-between text-xs text-white/60">
                  <span>สร้าง: {new Date(record.createdAt).toLocaleString('th-TH')}</span>
                  <span>อัปเดต: {new Date(record.updatedAt).toLocaleString('th-TH')}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Form Modal */}
        {isFormOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white p-6 rounded-lg w-full max-w-6xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold mb-4 text-gray-800">
                {editingRecord ? '✏️ แก้ไขข้อมูลการบรรจุ' : '📦 เพิ่มข้อมูลการบรรจุใหม่'}
              </h2>
              
              <form className="space-y-6" onSubmit={handleSubmit}>
                {/* ข้อมูลพื้นฐาน */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">📋 ข้อมูลสินค้า</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Supplier *</label>
                      <input
                        type="text"
                        name="supplier"
                        value={formData.supplier}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Model *</label>
                      <input
                        type="text"
                        name="model"
                        value={formData.model}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Part Number *</label>
                      <input
                        type="text"
                        name="partNumber"
                        value={formData.partNumber}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Part Name *</label>
                      <input
                        type="text"
                        name="partName"
                        value={formData.partName}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* รูปชิ้นงาน */}
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">🖼️ รูปชิ้นงาน</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">อัปโหลดรูปชิ้นงาน</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">รองรับไฟล์: JPG, PNG, GIF (ขนาดไม่เกิน 5MB)</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">ตัวอย่างรูป</label>
                      {formData.partImage ? (
                        <div className="relative">
                          <img 
                            src={formData.partImage} 
                            alt="Part Preview" 
                            className="w-32 h-32 object-cover rounded-lg border border-gray-300 cursor-pointer hover:scale-105 transition-transform"
                            onClick={() => handleImageClick(formData.partImage!)}
                          />
                          <button
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, partImage: '' }))}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <div className="w-32 h-32 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                          <div className="text-center">
                            <div className="text-gray-400 text-2xl mb-1">📷</div>
                            <div className="text-xs text-gray-500">ไม่มีรูป</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* ข้อมูลการบรรจุ */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">📦 ข้อมูลกล่อง</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">จำนวนต่อกล่อง *</label>
                      <input
                        type="number"
                        name="qtyPerBox"
                        value={formData.qtyPerBox}
                        onChange={handleChange}
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">น้ำหนักต่อตัว (kg) *</label>
                      <input
                        type="number"
                        name="weightPerPiece"
                        value={formData.weightPerPiece}
                        onChange={handleChange}
                        min="0"
                        step="0.001"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">น้ำหนักรวม (kg)</label>
                      <input
                        type="number"
                        name="totalWeight"
                        value={formData.totalWeight}
                        onChange={handleChange}
                        min="0"
                        step="0.001"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        readOnly
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">น้ำหนักรวมกล่อง (kg) *</label>
                      <input
                        type="number"
                        name="boxWeight"
                        value={formData.boxWeight}
                        onChange={handleChange}
                        min="0"
                        step="0.001"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        placeholder="รวมน้ำหนักกล่องเปล่า"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">ชนิดของกล่อง *</label>
                      <select
                        name="boxType"
                        value={formData.boxType}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        required
                      >
                        <option value="">เลือกชนิดกล่อง</option>
                        <option value="Cardboard">กล่องกระดาษ</option>
                        <option value="Plastic">กล่องพลาสติก</option>
                        <option value="Metal">กล่องโลหะ</option>
                        <option value="Wood">กล่องไม้</option>
                        <option value="Other">อื่นๆ</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">ความกว้าง (mm) *</label>
                      <input
                        type="number"
                        name="boxWidth"
                        value={formData.boxWidth}
                        onChange={handleChange}
                        min="0"
                        step="1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">ความยาว (mm) *</label>
                      <input
                        type="number"
                        name="boxLength"
                        value={formData.boxLength}
                        onChange={handleChange}
                        min="0"
                        step="1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">ความสูง (mm) *</label>
                      <input
                        type="number"
                        name="boxHeight"
                        value={formData.boxHeight}
                        onChange={handleChange}
                        min="0"
                        step="1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* ข้อมูลพาเลท */}
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">🏗️ ข้อมูลพาเลท</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">จำนวนกล่องต่อพาเลท *</label>
                      <input
                        type="number"
                        name="boxesPerPallet"
                        value={formData.boxesPerPallet}
                        onChange={handleChange}
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">น้ำหนักต่อพาเลท (kg) *</label>
                      <input
                        type="number"
                        name="weightPerPallet"
                        value={formData.weightPerPallet}
                        onChange={handleChange}
                        min="0"
                        step="0.001"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        placeholder="ระบุน้ำหนักต่อพาเลท"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">ชิ้นงานทั้งหมดบนพาเลท</label>
                      <input
                        type="number"
                        name="totalPiecesOnPallet"
                        value={formData.totalPiecesOnPallet}
                        onChange={handleChange}
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        readOnly
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">ความกว้างพาเลท (cm) *</label>
                      <input
                        type="number"
                        name="palletWidth"
                        value={formData.palletWidth}
                        onChange={handleChange}
                        min="0"
                        step="0.1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">ความยาวพาเลท (cm) *</label>
                      <input
                        type="number"
                        name="palletLength"
                        value={formData.palletLength}
                        onChange={handleChange}
                        min="0"
                        step="0.1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">ความสูงพาเลท (cm) *</label>
                      <input
                        type="number"
                        name="palletHeight"
                        value={formData.palletHeight}
                        onChange={handleChange}
                        min="0"
                        step="0.1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* ข้อมูลการขนส่ง */}
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">🚛 ข้อมูลการขนส่ง</h3>
                  
                  {/* แถวที่ 1 */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">ขนาดรถใช้ขนส่ง (แถวที่ 1) *</label>
                      <select
                        name="truckSize1"
                        value={formData.truckSize1}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        required
                      >
                        <option value="">เลือกขนาดรถ</option>
                        <option value="รถกระบะ">รถกระบะ</option>
                        <option value="รถ 4 ล้อ">รถ 4 ล้อ</option>
                        <option value="รถ 6 ล้อ">รถ 6 ล้อ</option>
                        <option value="รถ 10 ล้อ">รถ 10 ล้อ</option>
                        <option value="รถเทรลเลอร์">รถเทรลเลอร์</option>
                        <option value="Container 20ft">Container 20ft</option>
                        <option value="Container 40ft">Container 40ft</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">จำนวนพาเลทต่อรถ *</label>
                      <input
                        type="number"
                        name="palletsPerTruck"
                        value={formData.palletsPerTruck}
                        onChange={handleChange}
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        placeholder="จำนวนพาเลทจริง"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">จำนวนชิ้นงานรวมต่อรถ *</label>
                      <input
                        type="number"
                        name="totalPiecesPerTruck"
                        value={formData.totalPiecesPerTruck}
                        onChange={handleChange}
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        placeholder="ชิ้นงานรวมจริง"
                        required
                      />
                    </div>
                  </div>

                  {/* แถวที่ 2 */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">ขนาดรถใช้ขนส่ง (แถวที่ 2)</label>
                      <select
                        name="truckSize2"
                        value={formData.truckSize2 || ''}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      >
                        <option value="">เลือกขนาดรถ</option>
                        <option value="รถกระบะ">รถกระบะ</option>
                        <option value="รถ 4 ล้อ">รถ 4 ล้อ</option>
                        <option value="รถ 6 ล้อ">รถ 6 ล้อ</option>
                        <option value="รถ 10 ล้อ">รถ 10 ล้อ</option>
                        <option value="รถเทรลเลอร์">รถเทรลเลอร์</option>
                        <option value="Container 20ft">Container 20ft</option>
                        <option value="Container 40ft">Container 40ft</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">จำนวนพาเลทสูงสุดต่อรถ</label>
                      <input
                        type="number"
                        name="maxPalletsPerTruck"
                        value={formData.maxPalletsPerTruck}
                        onChange={handleChange}
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        placeholder="ความจุสูงสุด"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">จำนวนชิ้นงานสูงสุดต่อรถ</label>
                      <input
                        type="number"
                        name="maxPiecesPerTruck"
                        value={formData.maxPiecesPerTruck}
                        onChange={handleChange}
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        placeholder="ความจุสูงสุด"
                      />
                    </div>
                  </div>

                  {/* หมายเหตุ */}
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">หมายเหตุ</label>
                      <textarea
                        name="remarks"
                        value={formData.remarks || ''}
                        onChange={handleChange}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        placeholder="ใส่หมายเหตุเพิ่มเติม..."
                      />
                    </div>
                  </div>
                </div>

                {/* ปุ่มควบคุม */}
                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setIsFormOpen(false);
                      setEditingRecord(null);
                    }}
                    className="px-6 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors"
                  >
                    ❌ ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-violet-600 hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 transition-colors"
                  >
                    {editingRecord ? '💾 อัปเดต' : '💾 บันทึก'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Image Modal */}
        {imageModalOpen && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="relative max-w-4xl max-h-full">
              <button
                onClick={() => setImageModalOpen(false)}
                className="absolute -top-10 right-0 text-white hover:text-gray-300 text-2xl font-bold z-10"
              >
                ✕
              </button>
              <img
                src={selectedImage}
                alt="รูปชิ้นงานขนาดใหญ่"
                className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
