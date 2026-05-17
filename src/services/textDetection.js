import Tesseract from 'tesseract.js';

const MIN_TEXT_THRESHOLD = 2;
const MERGE_X_GAP = 8;
const MERGE_Y_GAP = 6;
const OVERLAP_THRESHOLD = 0.3;
const DUPLICATE_SIMILARITY = 0.85;

/**
 * Map a raw PDF font name (like "ABCDEE+Calibri-Bold") to a clean,
 * CSS-friendly font family name for display in the browser.
 */
const mapPDFNameToCSSFamily = (pdfFontName) => {
  if (!pdfFontName || pdfFontName === 'OCR') return null;

  // Strip font subset prefix (e.g., "ABCDEE+Calibri" -> "Calibri")
  let clean = pdfFontName.replace(/^[A-Z]{6}\+/, '');

  // Strip style suffixes (-Bold, -Italic, -Regular, etc.)
  clean = clean.replace(/[-_](Bold|Italic|Regular|BoldItalic|Medium|Light|Semibold|Heavy|Black|Thin|ExtraBold)$/i, '');

  const lower = clean.toLowerCase();

  // Indic scripts - map to web-safe fonts with Noto Sans fallbacks
  // Use whole-word or long-substring matches to avoid false positives
  if (lower.includes('devanagari') || lower === 'mangal' || lower === 'aparajita' || lower === 'kokila') {
    return 'Noto Sans Devanagari, Mangal, Aparajita, sans-serif';
  }
  if (lower.includes('gujarati') || lower === 'shruti') {
    return 'Noto Sans Gujarati, Shruti, sans-serif';
  }
  if (lower.includes('tamil') || lower === 'latha' || lower === 'vijaya') {
    return 'Noto Sans Tamil, Latha, sans-serif';
  }
  if (lower.includes('bengali') || lower === 'shonar' || lower === 'vrinda') {
    return 'Noto Sans Bengali, Vrinda, sans-serif';
  }
  if (lower.includes('telugu') || lower === 'gautami') {
    return 'Noto Sans Telugu, Gautami, sans-serif';
  }
  if (lower.includes('kannada') || lower === 'tunga') {
    return 'Noto Sans Kannada, Tunga, sans-serif';
  }
  if (lower.includes('malayalam') || lower === 'kartika') {
    return 'Noto Sans Malayalam, Kartika, sans-serif';
  }
  if (lower.includes('arabic') || lower === 'traditional arabic' || lower === 'simplified arabic') {
    return 'Noto Sans Arabic, Traditional Arabic, sans-serif';
  }

  // Common Latin fonts
  if (lower.includes('arial') || lower.includes('helvetica')) return 'Arial, Helvetica, sans-serif';
  if (lower.includes('times') || lower.includes('timesnewroman')) return '"Times New Roman", Times, serif';
  if (lower.includes('courier') || lower.includes('consolas')) return '"Courier New", Courier, monospace';
  if (lower.includes('calibri')) return 'Calibri, Arial, sans-serif';
  if (lower.includes('cambria')) return 'Cambria, Georgia, serif';
  if (lower.includes('georgia')) return 'Georgia, serif';
  if (lower.includes('verdana')) return 'Verdana, sans-serif';
  if (lower.includes('tahoma')) return 'Tahoma, sans-serif';
  if (lower.includes('segoe')) return '"Segoe UI", sans-serif';
  if (lower.includes('roboto')) return 'Roboto, sans-serif';
  if (lower.includes('noto')) return 'Noto Sans, sans-serif';

  // Return the cleaned name as-is if no mapping found
  return clean;
};

/**
 * Merge adjacent text items on the same line into contiguous text blocks.
 */
const mergeAdjacentItems = (items) => {
  if (items.length <= 1) return items;

  const sorted = [...items].sort((a, b) => {
    if (Math.abs(a.y - b.y) < MERGE_Y_GAP) {
      return a.x - b.x;
    }
    return a.y - b.y;
  });

  const merged = [];
  if (sorted.length === 0) return merged;

  let currentBlock = { ...sorted[0] };

  for (let i = 1; i < sorted.length; i++) {
    const item = sorted[i];
    const prevItem = currentBlock;

    const isSameLine = Math.abs(item.y - prevItem.y) < MERGE_Y_GAP;
    const horizontalGap = item.x - (prevItem.x + prevItem.width);

    if (isSameLine && horizontalGap < prevItem.fontSize * 2) {
      const needsSpace = horizontalGap > prevItem.fontSize * 0.2;
      currentBlock.text += (needsSpace ? ' ' : '') + item.text;
      currentBlock.width = (item.x + item.width) - currentBlock.x;
      currentBlock.height = Math.max(currentBlock.height, item.height);
      currentBlock.fontSize = Math.max(currentBlock.fontSize, item.fontSize);
    } else {
      merged.push(currentBlock);
      currentBlock = { ...item };
    }
  }
  merged.push(currentBlock);

  return merged;
};

export const extractPageText = async (pdfPage) => {
  try {
    const textContent = await pdfPage.getTextContent();
    if (!textContent?.items?.length) return [];

    const viewport = pdfPage.getViewport({ scale: 1 });
    const items = [];

    for (const item of textContent.items) {
      const str = item.str;
      if (str === undefined || str === null) continue;

      const transform = item.transform;
      const fontSize = Math.abs(transform[0]) || Math.abs(transform[3]) || 12;

      // Map raw PDF font name to a CSS-friendly font family
      const rawFontName = item.fontName || 'Helvetica';
      const cssFontFamily = mapPDFNameToCSSFamily(rawFontName) || 'Arial, sans-serif';

      // Extract text color from pdf.js if available
      // pdf.js provides color as an array [r, g, b] with values 0-1
      let textColor = '#000000';
      if (item.color && Array.isArray(item.color) && item.color.length >= 3) {
        const r = Math.round(item.color[0] * 255);
        const g = Math.round(item.color[1] * 255);
        const b = Math.round(item.color[2] * 255);
        textColor = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
      }

      items.push({
        text: str,
        x: transform[4],
        y: viewport.height - transform[5] - fontSize,
        width: item.width || (str.length * fontSize * 0.5),
        height: fontSize,
        fontSize: fontSize,
        fontName: cssFontFamily,
        rawFontName: rawFontName,
        textColor: textColor,
        isBold: rawFontName.toLowerCase().includes('bold'),
        isItalic: rawFontName.toLowerCase().includes('italic'),
        isOCR: false
      });
    }

    const validItems = items.filter(item => item.text.trim().length > 0);
    const merged = mergeAdjacentItems(validItems);
    return merged;
  } catch (err) {
    console.error('extractPageText error:', err);
    return [];
  }
};

const runOCR = async (pdfPage) => {
  try {
    const viewport = pdfPage.getViewport({ scale: 1.5 });
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await pdfPage.render({ canvasContext: ctx, viewport }).promise();

    const imageData = canvas.toDataURL('image/png');
    const result = await Tesseract.recognize(imageData, 'eng');

    const words = result.data?.words || [];
    const scale = 1.5;
    return words.map(w => ({
      text: w.text?.trim() || '',
      x: (w.bbox?.x0 || 50) / scale,
      y: (w.bbox?.y0 || 0) / scale,
      width: ((w.bbox?.x1 || 100) - (w.bbox?.x0 || 0)) / scale,
      height: ((w.bbox?.y1 || 20) - (w.bbox?.y0 || 0)) / scale,
      fontSize: Math.max(10, ((w.bbox?.y1 || 20) - (w.bbox?.y0 || 0)) / scale),
      fontName: 'OCR',
      isOCR: true
    })).filter(w => w.text);
  } catch (err) {
    console.error('OCR error:', err);
    return [];
  }
};

export const extractAllTextNative = async (pdfDocument) => {
  const results = [];
  const numPages = pdfDocument.numPages;

  for (let i = 1; i <= numPages; i++) {
    try {
      const page = await pdfDocument.getPage(i);
      const items = await extractPageText(page);
      results.push({ pageIndex: i - 1, pageNum: i, items });
    } catch (err) {
      console.warn(`extractAllTextNative: page ${i} failed:`, err);
      results.push({ pageIndex: i - 1, pageNum: i, items: [] });
    }
  }

  return results;
};

export const extractAllText = async (pdfDocument) => {
  const results = [];
  const numPages = pdfDocument.numPages;

  for (let i = 1; i <= numPages; i++) {
    const page = await pdfDocument.getPage(i);
    const pdfItems = await extractPageText(page);

    let pageItems;
    if (pdfItems.length < MIN_TEXT_THRESHOLD) {
      const ocrItems = await runOCR(page);
      pageItems = ocrItems;
    } else {
      pageItems = pdfItems;
    }

    results.push({ pageIndex: i - 1, pageNum: i, items: pageItems });
  }

  return results;
};

const calculateOverlapRatio = (a, b) => {
  const xOverlap = Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x));
  const yOverlap = Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y));

  if (xOverlap <= 0 || yOverlap <= 0) return 0;

  const intersectionArea = xOverlap * yOverlap;
  const minArea = Math.min(
    (a.width || 1) * (a.height || 1),
    (b.width || 1) * (b.height || 1)
  );

  if (minArea <= 0) return 0;
  return intersectionArea / minArea;
};

const calculateTextSimilarity = (textA, textB) => {
  const a = textA.toLowerCase().trim();
  const b = textB.toLowerCase().trim();

  if (!a || !b) return 0;
  if (a === b) return 1;

  const getBigrams = (str) => {
    const grams = new Set();
    for (let i = 0; i < str.length - 1; i++) {
      grams.add(str.substring(i, i + 2));
    }
    return grams;
  };

  const bigramsA = getBigrams(a);
  const bigramsB = getBigrams(b);

  if (bigramsA.size === 0 || bigramsB.size === 0) return 0;

  let intersection = 0;
  for (const gram of bigramsA) {
    if (bigramsB.has(gram)) intersection++;
  }

  const union = bigramsA.size + bigramsB.size - intersection;
  if (union === 0) return 0;

  return intersection / union;
};

export const detectOverlaps = (extractedText) => {
  const overlapResults = [];

  for (const pageData of extractedText) {
    const items = pageData.items;
    if (items.length < 2) continue;

    const adjacency = Array.from({ length: items.length }, () => []);
    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        if (calculateOverlapRatio(items[i], items[j]) >= OVERLAP_THRESHOLD) {
          adjacency[i].push(j);
          adjacency[j].push(i);
        }
      }
    }

    const visited = new Set();
    for (let i = 0; i < items.length; i++) {
      if (visited.has(i) || adjacency[i].length === 0) continue;

      const group = [items[i]];
      visited.add(i);

      const queue = [i];
      while (queue.length > 0) {
        const node = queue.shift();
        for (const neighbor of adjacency[node]) {
          if (!visited.has(neighbor)) {
            visited.add(neighbor);
            group.push(items[neighbor]);
            queue.push(neighbor);
          }
        }
      }

      if (group.length > 1) {
        const ratios = [];
        for (let gi = 0; gi < group.length; gi++) {
          for (let gj = gi + 1; gj < group.length; gj++) {
            ratios.push(calculateOverlapRatio(group[gi], group[gj]));
          }
        }
        overlapResults.push({
          pageIndex: pageData.pageIndex,
          pageNum: pageData.pageNum,
          items: group,
          maxOverlapRatio: Math.max(...ratios)
        });
      }
    }
  }

  return overlapResults;
};

export const detectDuplicates = (extractedText) => {
  const allItems = [];

  for (const pageData of extractedText) {
    for (const item of pageData.items) {
      allItems.push({
        ...item,
        pageIndex: pageData.pageIndex,
        pageNum: pageData.pageNum
      });
    }
  }

  if (allItems.length < 2) return [];

  const checked = new Set();
  const duplicateResults = [];

  for (let i = 0; i < allItems.length; i++) {
    if (checked.has(i)) continue;
    if (!allItems[i].text?.trim()) continue;

    const group = [allItems[i]];
    checked.add(i);

    for (let j = i + 1; j < allItems.length; j++) {
      if (checked.has(j)) continue;
      if (!allItems[j].text?.trim()) continue;

      const similarity = calculateTextSimilarity(allItems[i].text, allItems[j].text);
      if (similarity >= DUPLICATE_SIMILARITY) {
        group.push(allItems[j]);
        checked.add(j);
      }
    }

    if (group.length > 1) {
      duplicateResults.push({
        items: group,
        maxSimilarity: Math.max(
          ...group.slice(1).map(item =>
            calculateTextSimilarity(group[0].text, item.text)
          )
        )
      });
    }
  }

  return duplicateResults;
};

export const detectAllIssues = (extractedText) => {
  const overlaps = detectOverlaps(extractedText);
  const duplicates = detectDuplicates(extractedText);
  return { overlaps, duplicates };
};

/**
 * Convert extracted text items to editable annotations.
 * Each annotation represents a text block that can be edited inline.
 * The annotation has proper width/height to cover the original PDF text.
 */
export const convertToAnnotations = (extractedText) => {
  const annotations = [];
  let annotationId = Date.now();
  const seenKeys = new Set();

  for (const pageData of extractedText) {
    const pageIndex = pageData.pageIndex;

    for (let i = 0; i < pageData.items.length; i++) {
      const item = pageData.items[i];
      if (!item.text?.trim()) continue;

      const uniqueKey = `${pageIndex}_${item.text}_${Math.floor(item.x / 3)}_${Math.floor(item.y / 3)}`;
      if (seenKeys.has(uniqueKey)) continue;
      seenKeys.add(uniqueKey);

      // Calculate proper dimensions to cover original text
      // Add padding to ensure full coverage of original PDF text
      const padding = 4;
      const width = (item.width || (item.text.length * item.fontSize * 0.6)) + padding * 2;
      const height = (item.height || item.fontSize) + padding * 2;

      // Use the CSS-mapped font family (already mapped in extractPageText)
      const fontFamily = item.fontName || 'Arial, sans-serif';

      annotations.push({
        id: `det_${annotationId++}_${Math.random().toString(36).substr(2, 5)}`,
        uniqueKey,
        type: 'detected',
        text: item.text.trim(),
        originalText: item.text.trim(),
        x: Math.max(0, (item.x || 0) - padding),
        y: Math.max(0, (item.y || 0) - padding),
        width: width,
        height: height,
        fontSize: item.fontSize || 12,
        fontFamily: fontFamily,
        textColor: item.textColor || '#000000',
        isBold: item.isBold || false,
        isItalic: item.isItalic || false,
        isUnderline: false,
        textAlign: 'left',
        pageIndex,
        isSelected: false,
        detectionInfo: null,
        editCount: 0
      });
    }
  }

  // Detect and mark overlaps
  const overlapGroups = detectOverlaps(extractedText);
  const overlapItemKeys = new Set();

  for (const group of overlapGroups) {
    for (const item of group.items) {
      const key = `${group.pageIndex}_${item.text}_${Math.floor(item.x / 3)}_${Math.floor(item.y / 3)}`;
      overlapItemKeys.add(key);
    }
  }

  let overlapIdx = 0;
  for (const group of overlapGroups) {
    overlapIdx++;
    const groupId = `ovl_${overlapIdx}`;

    for (const item of group.items) {
      const key = `${group.pageIndex}_${item.text}_${Math.floor(item.x / 3)}_${Math.floor(item.y / 3)}`;
      const ann = annotations.find(a => a.uniqueKey === key);
      if (ann) {
        ann.type = 'overlap';
        ann.detectionInfo = {
          severity: group.maxOverlapRatio > 0.5 ? 'high' : 'medium',
          groupId,
          groupSize: group.items.length,
          overlapRatio: Math.round(group.maxOverlapRatio * 100)
        };
      }
    }
  }

  // Detect duplicates
  const duplicateGroups = detectDuplicates(extractedText);
  let dupIdx = 0;

  for (const group of duplicateGroups) {
    const nonOverlapItems = group.items.filter(item => {
      const key = `${item.pageIndex}_${item.text}_${Math.floor(item.x / 3)}_${Math.floor(item.y / 3)}`;
      return !overlapItemKeys.has(key);
    });

    if (nonOverlapItems.length < 2) continue;

    dupIdx++;
    const groupId = `dup_${dupIdx}`;

    for (const item of nonOverlapItems) {
      const key = `${item.pageIndex}_${item.text}_${Math.floor(item.x / 3)}_${Math.floor(item.y / 3)}`;
      const ann = annotations.find(a => a.uniqueKey === key);
      if (ann && ann.type === 'detected') {
        ann.type = 'duplicate';
        ann.detectionInfo = {
          severity: group.maxSimilarity > 0.95 ? 'high' : 'medium',
          groupId,
          groupSize: nonOverlapItems.length,
          locations: nonOverlapItems
            .filter(other => other !== item)
            .map(other => `P${other.pageNum + 1}`)
            .join(', '),
          similarity: Math.round(group.maxSimilarity * 100)
        };
      }
    }
  }

  return annotations;
};
