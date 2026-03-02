// background.js - Runs in background with Amazon support

// Install handler
chrome.runtime.onInstalled.addListener(function(details) {
  if (details.reason === 'install') {
    // First install - open welcome page
    chrome.tabs.create({
      url: 'https://responder.aiinfra.work/welcome'
    });
  }
  console.log("Extension installed successfully");
});

// Handle keyboard shortcut
chrome.commands.onCommand.addListener(function(command) {
  if (command === '_execute_action') {
    chrome.action.openPopup();
  }
});

// Listen for messages from content script (Amazon button, etc.)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  
  // Handle generate request from Amazon button
  if (request.action === 'generateFromContent') {
    handleGenerateFromContent(request, sender, sendResponse);
    return true; // Keep channel open for async response
  }
  
  // Handle open popup request
  if (request.action === 'openPopup') {
    chrome.action.openPopup();
    sendResponse({ success: true });
  }
  
  // Handle get platform info
  if (request.action === 'getPlatformInfo') {
    if (sender.tab) {
      const url = sender.tab.url;
      sendResponse({ 
        platform: detectPlatform(url),
        url: url 
      });
    }
  }
});

// Handle generate requests from content script (Amazon button)
async function handleGenerateFromContent(request, sender, sendResponse) {
  try {
    // Get license key from storage
    const result = await chrome.storage.local.get(['license_key']);
    const licenseKey = result.license_key;
    
    if (!licenseKey) {
      // No license key, open popup to ask for one
      chrome.action.openPopup();
      sendResponse({ success: false, error: 'No license key', needsLicense: true });
      return;
    }
    
    // Store the review data temporarily for popup to use
    await chrome.storage.local.set({
      pending_review: {
        text: request.review,
        platform: request.platform || 'amazon',
        rating: request.rating || 5,
        reviewer: request.reviewer || 'Amazon Customer',
        date: request.date || null
      }
    });
    
    // Open popup to show generation
    chrome.action.openPopup();
    
    sendResponse({ success: true });
  } catch (error) {
    console.error('Background error:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// Set badge text based on platform
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    const platform = detectPlatform(tab.url);
    
    // Set badge text and color based on platform
    if (platform !== 'unknown') {
      const badgeConfig = {
        'amazon': { text: 'AMZ', color: '#FF9900' },
        'facebook': { text: 'FB', color: '#1877f2' },
        'google': { text: 'GGL', color: '#4285f4' },
        'twitter': { text: 'TW', color: '#1d9bf0' },
        'instagram': { text: 'IG', color: '#e4405f' },
        'yelp': { text: 'YLP', color: '#d32323' },
        'tripadvisor': { text: 'TRIP', color: '#00af87' }
      };
      
      const config = badgeConfig[platform];
      if (config) {
        chrome.action.setBadgeText({ text: config.text, tabId });
        chrome.action.setBadgeBackgroundColor({ color: config.color, tabId });
      }
    } else {
      chrome.action.setBadgeText({ text: '', tabId });
    }
  }
});

// Check if alarms API is available
if (chrome.alarms) {
  // Check license periodically
  chrome.alarms.create('checkLicense', { periodInMinutes: 60 });
  
  chrome.alarms.onAlarm.addListener(function(alarm) {
    if (alarm.name === 'checkLicense') {
      chrome.storage.local.get(['license_key'], async function(result) {
        if (result.license_key) {
          try {
            const response = await fetch('https://responder.aiinfra.work/api/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ license_key: result.license_key })
            });
            const data = await response.json();
            
            if (!data.valid) {
              // Check if notifications API is available
              if (chrome.notifications) {
                chrome.notifications.create({
                  type: 'basic',
                  iconUrl: 'icons/icon128.png',
                  title: 'License Expired',
                  message: 'Your license key has expired. Please renew to continue using AI Review Responder.'
                });
              }
            }
          } catch (error) {
            console.error('License check failed:', error);
          }
        }
      });
    }
  });
} else {
  console.log("Alarms API not available");
}

// Platform detection function (for badge colors)
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