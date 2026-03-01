// background.js - Runs in background

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

// Check if alarms API is available
if (chrome.alarms) {
  // Check license periodically
  chrome.alarms.create('checkLicense', {periodInMinutes: 60});
  
  chrome.alarms.onAlarm.addListener(function(alarm) {
    if (alarm.name === 'checkLicense') {
      chrome.storage.local.get(['license_key'], async function(result) {
        if (result.license_key) {
          try {
            const response = await fetch('https://responder.aiinfra.work/api/verify', {
              method: 'POST',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify({license_key: result.license_key})
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