// utils.js - Shared functions

const API_BASE = 'https://responder.aiinfra.work/api';

// Platform detection
function detectPlatform(url) {
    if (url.includes('facebook.com')) return 'facebook';
    if (url.includes('google.com') || url.includes('maps.google')) return 'google';
    if (url.includes('twitter.com') || url.includes('x.com')) return 'twitter';
    if (url.includes('instagram.com')) return 'instagram';
    if (url.includes('yelp.com')) return 'yelp';
    if (url.includes('tripadvisor.com')) return 'tripadvisor';
    return 'unknown';
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
        return false;
    }
}

// Get usage stats
async function getUsage(licenseKey) {
    try {
        return await callAPI(`/usage-stats/${licenseKey}`, {}, licenseKey);
    } catch (error) {
        return null;
    }
}

// Generate response
async function generateResponse(reviewText, tone, licenseKey) {
    return await callAPI('/quick-generate', {
        review_text: reviewText,
        platform: 'manual',
        rating: 5,
        customer_name: 'Customer',
        tone: tone
    }, licenseKey);
}
