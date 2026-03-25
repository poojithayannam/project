export const normalizeFeedback = (rawPayload, designatedPlatform) => {
  let extractedRows = [];
  
  if (Array.isArray(rawPayload.reviews)) {
     extractedRows = rawPayload.reviews;
  } else if (Array.isArray(rawPayload.data)) {
     extractedRows = rawPayload.data;
  } else if (Array.isArray(rawPayload)) {
     extractedRows = rawPayload;
  } else if (typeof rawPayload === 'object' && rawPayload !== null) {
     extractedRows = [rawPayload];
  } else {
     extractedRows = [{ text: String(rawPayload), rating: 3 }];
  }

  // Sanitize, dynamically map wildcard properties, and filter garbage logic
  return extractedRows.map(r => ({
    text: r.review || r.text || r.comment || r.feedback || r.message || r.content || '',
    rating: typeof r.rating === 'number' ? r.rating : (typeof r.stars === 'number' ? r.stars : 3),
    platform: r.platform || designatedPlatform || 'Direct',
    category: r.category || 'General'
  })).filter(r => typeof r.text === 'string' && r.text.trim().length >= 5);
};
