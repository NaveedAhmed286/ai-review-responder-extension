// options.js - Settings page with Amazon support

document.addEventListener('DOMContentLoaded', async function() {
  // Load all saved settings
  await loadAllSettings();
  
  // Setup event listeners
  setupEventListeners();
});

// Load all settings from storage
async function loadAllSettings() {
  // License key
  const licenseKey = await loadFromStorage('license_key');
  if (licenseKey) {
    document.getElementById('licenseKey').value = licenseKey;
    await loadUsageStats(licenseKey);
  }
  
  // Default settings
  const defaultTone = await loadFromStorage('default_tone') || 'professional';
  const autoFill = await loadFromStorage('auto_fill') || 'yes';
  const showBadges = await loadFromStorage('show_badges') || 'yes';
  const autoDetect = await loadFromStorage('auto_detect') || false;
  const debugMode = await loadFromStorage('debug_mode') || false;
  
  document.getElementById('defaultTone').value = defaultTone;
  document.getElementById('autoFill').value = autoFill;
  document.getElementById('showBadges').value = showBadges;
  document.getElementById('autoDetectReviews').checked = autoDetect;
  document.getElementById('enableDebugMode').checked = debugMode;
  
  // Platform preferences
  const enabledPlatforms = await loadFromStorage('enabled_platforms') || [
    'amazon', 'facebook', 'google', 'twitter', 'instagram', 'yelp', 'tripadvisor'
  ];
  
  // Check all platform checkboxes
  document.querySelectorAll('input[type="checkbox"][id^="platform"]').forEach(checkbox => {
    checkbox.checked = enabledPlatforms.includes(checkbox.value);
  });
  
  // Show/hide usage section based on license
  if (licenseKey) {
    document.getElementById('usageSection').style.display = 'block';
    document.getElementById('noLicenseMessage').style.display = 'none';
  } else {
    document.getElementById('usageSection').style.display = 'none';
    document.getElementById('noLicenseMessage').style.display = 'block';
  }
}

// Setup all event listeners
function setupEventListeners() {
  // Save license button
  document.getElementById('saveLicense').addEventListener('click', handleSaveLicense);
  
  // Verify license button
  document.getElementById('verifyLicense').addEventListener('click', handleVerifyLicense);
  
  // Save platforms button
  document.getElementById('savePlatforms').addEventListener('click', handleSavePlatforms);
  
  // Select/Deselect all platforms
  document.getElementById('selectAllPlatforms').addEventListener('click', () => {
    document.querySelectorAll('input[type="checkbox"][id^="platform"]').forEach(cb => cb.checked = true);
  });
  
  document.getElementById('deselectAllPlatforms').addEventListener('click', () => {
    document.querySelectorAll('input[type="checkbox"][id^="platform"]').forEach(cb => cb.checked = false);
  });
  
  // Refresh usage button
  document.getElementById('refreshUsage').addEventListener('click', async () => {
    const licenseKey = document.getElementById('licenseKey').value.trim();
    if (licenseKey) {
      await loadUsageStats(licenseKey);
    }
  });
  
  // Save settings on change
  document.getElementById('defaultTone').addEventListener('change', handleSaveSettings);
  document.getElementById('autoFill').addEventListener('change', handleSaveSettings);
  document.getElementById('showBadges').addEventListener('change', handleSaveSettings);
  document.getElementById('autoDetectReviews').addEventListener('change', handleSaveSettings);
  document.getElementById('enableDebugMode').addEventListener('change', handleSaveSettings);
  
  // Clear local data
  document.getElementById('clearData').addEventListener('click', async (e) => {
    e.preventDefault();
    if (confirm('Are you sure? This will remove all settings and require re-activation.')) {
      await chrome.storage.local.clear();
      showStatus('All data cleared. Reloading...', 'success');
      setTimeout(() => location.reload(), 1500);
    }
  });
  
  // Show extension ID
  document.getElementById('extensionId').textContent = chrome.runtime.id;
}

// Handle save license button
async function handleSaveLicense() {
  const licenseKey = document.getElementById('licenseKey').value.trim();
  
  if (!licenseKey) {
    showStatus('Please enter a license key', 'error');
    return;
  }
  
  // Validate UUID format
  if (!isValidUUID(licenseKey)) {
    showStatus('Invalid license key format. Should be UUID (e.g., 12345678-1234-1234-1234-123456789012)', 'error');
    return;
  }
  
  showStatus('Verifying license...', 'info');
  
  try {
    const isValid = await verifyLicenseWithBackend(licenseKey);
    
    if (isValid) {
      await saveToStorage('license_key', licenseKey);
      await handleSaveSettings(); // Save other settings
      
      // Get license details
      const usage = await getUsageStats(licenseKey);
      if (usage) {
        showStatus(`License verified! ${usage.used}/${usage.limit} responses used this month`, 'success');
      } else {
        showStatus('License verified successfully!', 'success');
      }
      
      // Show usage section
      document.getElementById('usageSection').style.display = 'block';
      document.getElementById('noLicenseMessage').style.display = 'none';
      
      // Load usage stats
      await loadUsageStats(licenseKey);
    } else {
      showStatus('Invalid or expired license key', 'error');
    }
  } catch (error) {
    console.error('License verification error:', error);
    showStatus('Error verifying license. Please try again.', 'error');
  }
}

// Handle verify license button
async function handleVerifyLicense() {
  const licenseKey = document.getElementById('licenseKey').value.trim();
  
  if (!licenseKey) {
    showStatus('Please enter a license key', 'error');
    return;
  }
  
  showStatus('Checking license status...', 'info');
  
  try {
    const isValid = await verifyLicenseWithBackend(licenseKey);
    
    if (isValid) {
      const usage = await getUsageStats(licenseKey);
      if (usage) {
        showStatus(`✓ License active - ${usage.used}/${usage.limit} responses used`, 'success');
      } else {
        showStatus('✓ License is valid and active', 'success');
      }
    } else {
      showStatus('✗ License is invalid or expired', 'error');
    }
  } catch (error) {
    showStatus('Error checking license', 'error');
  }
}

// Handle save platforms button
async function handleSavePlatforms() {
  const enabledPlatforms = [];
  
  document.querySelectorAll('input[type="checkbox"][id^="platform"]').forEach(checkbox => {
    if (checkbox.checked) {
      enabledPlatforms.push(checkbox.value);
    }
  });
  
  await saveToStorage('enabled_platforms', enabledPlatforms);
  showStatus('Platform preferences saved!', 'success');
  
  // Log which platforms are enabled
  if (enabledPlatforms.includes('amazon')) {
    console.log('Amazon support enabled');
  }
}

// Handle save all settings
async function handleSaveSettings() {
  const settings = {
    default_tone: document.getElementById('defaultTone').value,
    auto_fill: document.getElementById('autoFill').value,
    show_badges: document.getElementById('showBadges').value,
    auto_detect: document.getElementById('autoDetectReviews').checked,
    debug_mode: document.getElementById('enableDebugMode').checked
  };
  
  // Save all settings
  for (const [key, value] of Object.entries(settings)) {
    await saveToStorage(key, value);
  }
  
  // Also save platforms if they exist
  await handleSavePlatforms();
  
  showStatus('Settings saved successfully!', 'success');
}

// Load usage statistics
async function loadUsageStats(licenseKey) {
  try {
    const usage = await getUsageStats(licenseKey);
    
    if (usage) {
      document.getElementById('usageUsed').textContent = usage.used || 0;
      document.getElementById('usageLimit').textContent = usage.limit || '∞';
      
      // Calculate progress percentage
      const percent = usage.limit ? (usage.used / usage.limit) * 100 : 0;
      document.getElementById('usageProgress').style.width = `${Math.min(percent, 100)}%`;
      
      // Set reset date
      const resetDate = usage.reset_date || '1st of every month';
      document.getElementById('resetDate').textContent = resetDate;
      
      // Set license tier
      let tier = 'Basic';
      if (usage.limit === 500) tier = 'Pro';
      if (usage.limit === 1000) tier = 'Business';
      if (usage.limit === 999999) tier = 'Unlimited';
      document.getElementById('licenseTier').textContent = tier;
      
      // Show warning if close to limit
      if (usage.limit && usage.used >= usage.limit * 0.9) {
        showStatus(`⚠️ You've used ${usage.used}/${usage.limit} responses. Consider upgrading soon.`, 'info');
      }
    }
  } catch (error) {
    console.error('Failed to load usage stats:', error);
  }
}

// Verify license with backend
async function verifyLicenseWithBackend(licenseKey) {
  try {
    const response = await fetch('https://responder.aiinfra.work/api/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ license_key: licenseKey })
    });
    
    const data = await response.json();
    return data.valid;
  } catch (error) {
    console.error('Verify error:', error);
    return false;
  }
}

// Get usage stats from backend
async function getUsageStats(licenseKey) {
  try {
    const response = await fetch(`https://responder.aiinfra.work/api/usage-stats/${licenseKey}`);
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error('Usage stats error:', error);
    return null;
  }
}

// Validate UUID format
function isValidUUID(uuid) {
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidPattern.test(uuid);
}

// Show status message
function showStatus(message, type) {
  const statusEl = document.getElementById('status');
  statusEl.textContent = message;
  statusEl.className = `status ${type}`;
  statusEl.style.display = 'block';
  
  // Hide after 5 seconds
  setTimeout(() => {
    statusEl.style.display = 'none';
  }, 5000);
}

// Storage helpers
async function saveToStorage(key, value) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [key]: value }, resolve);
  });
}

async function loadFromStorage(key) {
  return new Promise((resolve) => {
    chrome.storage.local.get([key], (result) => {
      resolve(result[key]);
    });
  });
}

// Export for debugging (optional)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    isValidUUID,
    showStatus,
    saveToStorage,
    loadFromStorage
  };
}