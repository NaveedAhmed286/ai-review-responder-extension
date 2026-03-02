// utils.js - Shared functions with Amazon support

const API_BASE = 'https://responder.aiinfra.work/api';

// Platform detection
function detectPlatform(url) {
  if (!url) return 'unknown';
  if (url.includes('facebook.com')) return 'facebook';
  if (url.includes('google.com') || url.includes('maps.google')) return 'google';
  if (url.includes('twitter.com') || url.includes('x.com')) return 'twitter';
  if (url.includes('instagram.com')) return 'instagram';
  if (url.includes('yelp.com')) return 'yelp';
  if (url.includes('tripadvisor.com')) return 'tripadvisor';
  if (url.includes('amazon.')) return 'amazon';
  return 'unknown';
}

// Get platform display name
function getPlatformDisplayName(platform) {
  const names = {
    'facebook': 'Facebook',
    'google': 'Google',
    'twitter': 'Twitter/X',
    'instagram': 'Instagram',
    'yelp': 'Yelp',
    'tripadvisor': 'TripAdvisor',
    'amazon': 'Amazon',
    'unknown': 'Website'
  };
  return names[platform] || platform;
}

// Get platform color
function getPlatformColor(platform) {
  const colors = {
    'facebook': '#1877f2',
    'google': '#4285f4',
    'twitter': '#1d9bf0',
    'instagram': '#e4405f',
    'yelp': '#d32323',
    'tripadvisor': '#00af87',
    'amazon': '#FF9900'
  };
  return colors[platform] || '#666666';
}

// Format review text with metadata
function formatReviewDisplay(reviewData) {
  if (!reviewData) return '';
  
  let displayText = '';
  
  // Add platform badge
  if (reviewData.platform) {
    displayText += `[${getPlatformDisplayName(reviewData.platform)}]\n`;
  }
  
  // Add rating stars if available
  if (reviewData.rating) {
    const stars = '⭐'.repeat(Math.floor(reviewData.rating));
    displayText += `${stars} ${reviewData.rating} Stars\n`;
  }
  
  // Add reviewer name if available
  if (reviewData.reviewer && reviewData.reviewer !== 'Customer') {
    displayText += `From: ${reviewData.reviewer}\n`;
  }
  
  // Add date if available
  if (reviewData.date) {
    displayText += `Date: ${reviewData.date}\n`;
  }
  
  if (displayText) {
    displayText += '\n';
  }
  
  // Add the actual review text
  displayText += reviewData.text || reviewData;
  
  return displayText;
}

// Show status message
function showStatus(message, type = 'info', duration = 3000) {
  const statusEl = document.getElementById('statusMessage');
  if (!statusEl) return;
  
  statusEl.textContent = message;
  statusEl.className = `status-message ${type}`;
  statusEl.style.display = 'block';
  
  setTimeout(() => {
    statusEl.style.display = 'none';
  }, duration);
}

// Save to storage
async function saveToStorage(key, value) {
  return new Promise((resolve) => {
    chrome.storage.local.set({[key]: value}, resolve);
  });
}

// Load from storage
async function loadFromStorage(key) {
  return new Promise((resolve) => {
    chrome.storage.local.get([key], (result) => {
      resolve(result[key]);
    });
  });
}

// Get pending review from storage
async function getPendingReview() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['pending_review'], (result) => {
      resolve(result.pending_review);
    });
  });
}

// Clear pending review
async function clearPendingReview() {
  return new Promise((resolve) => {
    chrome.storage.local.remove('pending_review', resolve);
  });
}

// API call to your backend
async function callAPI(endpoint, data, licenseKey) {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-License-Key': licenseKey
      },
      body: JSON.stringify(data)
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.detail || 'API error');
    }
    
    return result;
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
}

// Verify license
async function verifyLicense(licenseKey) {
  try {
    const result = await callAPI('/verify', { license_key: licenseKey }, licenseKey);
    return result.valid;
  } catch (error) {
    console.error('Verify error:', error);
    return false;
  }
}

// Get usage stats
async function getUsage(licenseKey) {
  try {
    return await callAPI(`/usage-stats/${licenseKey}`, {}, licenseKey);
  } catch (error) {
    console.error('Usage error:', error);
    return null;
  }
}

// Generate response
async function generateResponse(reviewText, tone, licenseKey, platform = 'manual', rating = 5, customerName = 'Customer') {
  return await callAPI('/quick-generate', {
    review_text: reviewText,
    platform: platform,
    rating: rating,
    customer_name: customerName,
    tone: tone
  }, licenseKey);
}

// Get tone options
function getToneOptions() {
  return [
    { value: 'professional', label: 'Professional' },
    { value: 'friendly', label: 'Friendly' },
    { value: 'enthusiastic', label: 'Enthusiastic' },
    { value: 'formal', label: 'Formal' }
  ];
}

// Validate license key format (UUID)
function isValidLicenseKey(key) {
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidPattern.test(key);
}

// Get platform-specific instructions for AI
function getPlatformInstructions(platform) {
  const instructions = {
    'amazon': 'This is an Amazon review. For high ratings (4-5 stars), thank them warmly. For low ratings (1-2 stars), apologize sincerely and offer specific help. Keep it professional and helpful.',
    'facebook': 'This is a Facebook review. Keep response friendly and conversational. Can be slightly more casual.',
    'google': 'This is a Google Maps review. Be professional and location-appropriate. Mention the business name if relevant.',
    'twitter': 'This is a Twitter/X review. Keep it concise due to character limits. Can be more casual and engaging.',
    'instagram': 'This is an Instagram review. Keep it visually descriptive and engaging. Can use emojis.',
    'yelp': 'This is a Yelp review. Maintain professional tone for business reputation. Be detailed and helpful.',
    'tripadvisor': 'This is a TripAdvisor review. Focus on hospitality and experience. Be warm and inviting.'
  };
  return instructions[platform] || 'Respond professionally to this review.';
}

// Export for Node.js environment if needed
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    detectPlatform,
    getPlatformDisplayName,
    getPlatformColor,
    formatReviewDisplay,
    showStatus,
    saveToStorage,
    loadFromStorage,
    getPendingReview,
    clearPendingReview,
    callAPI,
    verifyLicense,
    getUsage,
    generateResponse,
    getToneOptions,
    isValidLicenseKey,
    getPlatformInstructions
  };
}