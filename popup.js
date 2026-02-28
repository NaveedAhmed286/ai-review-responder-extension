// popup.js

const API_BASE = 'https://responder.aiinfra.work/api';

document.addEventListener('DOMContentLoaded', async function() {
    
    // Load saved license
    const licenseKey = await loadFromStorage('license_key');
    
    if (licenseKey) {
        // Verify license
        const isValid = await verifyLicense(licenseKey);
        if (isValid) {
            showMainSection(licenseKey);
        } else {
            showLicenseSection('License expired or invalid');
        }
    } else {
        showLicenseSection();
    }
    
    // Get current platform
    getCurrentPlatform();
    
    // Setup event listeners
    setupEventListeners();
});

function showLicenseSection(message = '') {
    document.getElementById('licenseSection').style.display = 'block';
    document.getElementById('mainSection').style.display = 'none';
    
    if (message) {
        showStatus(message, 'error');
    }
}

async function showMainSection(licenseKey) {
    document.getElementById('licenseSection').style.display = 'none';
    document.getElementById('mainSection').style.display = 'block';
    
    // Load usage stats
    const usage = await getUsage(licenseKey);
    if (usage) {
        document.getElementById('usageCount').textContent = usage.used || 0;
        document.getElementById('usageLimit').textContent = usage.limit || '∞';
        
        const percent = usage.limit ? (usage.used / usage.limit) * 100 : 0;
        document.getElementById('usageProgress').style.width = `${Math.min(percent, 100)}%`;
    }
    
    // Get review text from page
    getReviewFromPage();
}

function getCurrentPlatform() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        const url = tabs[0].url;
        const platform = detectPlatform(url);
        
        const platformNames = {
            'facebook': 'Facebook',
            'google': 'Google',
            'twitter': 'Twitter/X',
            'instagram': 'Instagram',
            'yelp': 'Yelp',
            'unknown': 'Current Page'
        };
        
        document.getElementById('currentPlatform').textContent = 
            platformNames[platform] || 'Website';
    });
}

function getReviewFromPage() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {action: "getReviewText"}, function(response) {
            if (response && response.reviewText) {
                document.getElementById('reviewText').textContent = response.reviewText;
                document.getElementById('reviewCard').style.display = 'block';
            } else if (response && response.error) {
                document.getElementById('reviewText').textContent = 
                    'Could not detect review. Try clicking on it first.';
            } else {
                document.getElementById('reviewText').textContent = 
                    'No review detected on this page';
            }
        });
    });
}

function setupEventListeners() {
    // Save license
    document.getElementById('saveLicenseBtn').addEventListener('click', async function() {
        const licenseKey = document.getElementById('licenseKey').value.trim();
        
        if (!licenseKey) {
            showStatus('Please enter a license key', 'error');
            return;
        }
        
        showStatus('Verifying license...', 'info');
        
        const isValid = await verifyLicense(licenseKey);
        
        if (isValid) {
            await saveToStorage('license_key', licenseKey);
            showStatus('License saved!', 'success');
            showMainSection(licenseKey);
        } else {
            showStatus('Invalid license key', 'error');
        }
    });
    
    // Generate response
    document.getElementById('generateBtn').addEventListener('click', async function() {
        const licenseKey = await loadFromStorage('license_key');
        if (!licenseKey) {
            showStatus('Please enter license key first', 'error');
            return;
        }
        
        const reviewText = document.getElementById('reviewText').textContent;
        if (!reviewText || reviewText.includes('Could not') || reviewText.includes('No review')) {
            showStatus('No review detected', 'error');
            return;
        }
        
        const tone = document.getElementById('toneSelect').value;
        
        showStatus('Generating response...', 'info');
        
        try {
            const result = await generateResponse(reviewText, tone, licenseKey);
            
            if (result.success) {
                document.getElementById('responseText').value = result.response;
                document.getElementById('responseSection').style.display = 'block';
                showStatus('Response generated!', 'success');
            } else {
                showStatus('Failed to generate response', 'error');
            }
        } catch (error) {
            showStatus(error.message, 'error');
        }
    });
    
    // Fill reply box
    document.getElementById('fillBtn').addEventListener('click', function() {
        const response = document.getElementById('responseText').value;
        
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {
                action: "fillReply",
                response: response
            }, function(response) {
                if (response && response.success) {
                    showStatus('Response filled! Click Post button', 'success');
                } else {
                    showStatus('Could not fill reply box', 'error');
                }
            });
        });
    });
    
    // Copy button
    document.getElementById('copyBtn').addEventListener('click', function() {
        const response = document.getElementById('responseText').value;
        navigator.clipboard.writeText(response);
        showStatus('Copied to clipboard!', 'success');
    });
    
    // Refresh review
    document.getElementById('refreshReviewBtn').addEventListener('click', function() {
        getReviewFromPage();
    });
    
    // Regenerate
    document.getElementById('regenerateBtn').addEventListener('click', function() {
        document.getElementById('generateBtn').click();
    });
    
    // Logout
    document.getElementById('logoutBtn').addEventListener('click', async function() {
        await saveToStorage('license_key', null);
        showLicenseSection();
    });
    
    // Enter key in license field
    document.getElementById('licenseKey').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            document.getElementById('saveLicenseBtn').click();
        }
    });
}

// Helper functions from utils (duplicated for popup scope)
async function saveToStorage(key, value) {
    return new Promise((resolve) => {
        chrome.storage.local.set({[key]: value}, resolve);
    });
}

async function loadFromStorage(key) {
    return new Promise((resolve) => {
        chrome.storage.local.get([key], (result) => {
            resolve(result[key]);
        });
    });
}

function showStatus(message, type) {
    const statusEl = document.getElementById('statusMessage');
    statusEl.textContent = message;
    statusEl.className = `status-message ${type}`;
    statusEl.style.display = 'block';
    
    setTimeout(() => {
        statusEl.style.display = 'none';
    }, 3000);
}

function detectPlatform(url) {
    if (url.includes('facebook.com')) return 'facebook';
    if (url.includes('google.com')) return 'google';
    if (url.includes('twitter.com') || url.includes('x.com')) return 'twitter';
    if (url.includes('instagram.com')) return 'instagram';
    if (url.includes('yelp.com')) return 'yelp';
    return 'unknown';
}

async function verifyLicense(licenseKey) {
    try {
        const response = await fetch(`${API_BASE}/verify`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({license_key: licenseKey})
        });
        const data = await response.json();
        return data.valid;
    } catch (error) {
        return false;
    }
}

async function getUsage(licenseKey) {
    try {
        const response = await fetch(`${API_BASE}/usage-stats/${licenseKey}`);
        return await response.json();
    } catch (error) {
        return null;
    }
}

async function generateResponse(reviewText, tone, licenseKey) {
    const response = await fetch(`${API_BASE}/quick-generate`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-License-Key': licenseKey
        },
        body: JSON.stringify({
            review_text: reviewText,
            platform: 'manual',
            rating: 5,
            customer_name: 'Customer',
            tone: tone
        })
    });
    return await response.json();
}
