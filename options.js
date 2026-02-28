// options.js

document.addEventListener('DOMContentLoaded', async function() {
    // Load saved settings
    const licenseKey = await loadFromStorage('license_key');
    const defaultTone = await loadFromStorage('default_tone') || 'professional';
    const autoFill = await loadFromStorage('auto_fill') || 'yes';
    
    if (licenseKey) {
        document.getElementById('licenseKey').value = licenseKey;
    }
    
    document.getElementById('defaultTone').value = defaultTone;
    document.getElementById('autoFill').value = autoFill;
    
    // Save license
    document.getElementById('saveLicense').addEventListener('click', async function() {
        const licenseKey = document.getElementById('licenseKey').value.trim();
        const defaultTone = document.getElementById('defaultTone').value;
        const autoFill = document.getElementById('autoFill').value;
        
        if (!licenseKey) {
            showStatus('Please enter license key', 'error');
            return;
        }
        
        // Verify license
        showStatus('Verifying...', 'info');
        
        try {
            const response = await fetch('https://responder.aiinfra.work/api/verify', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({license_key: licenseKey})
            });
            
            const data = await response.json();
            
            if (data.valid) {
                await saveToStorage('license_key', licenseKey);
                await saveToStorage('default_tone', defaultTone);
                await saveToStorage('auto_fill', autoFill);
                
                showStatus('Settings saved successfully!', 'success');
            } else {
                showStatus('Invalid license key', 'error');
            }
        } catch (error) {
            showStatus('Error verifying license', 'error');
        }
    });
});

function showStatus(message, type) {
    const statusEl = document.getElementById('status');
    statusEl.textContent = message;
    statusEl.className = `status ${type}`;
    
    setTimeout(() => {
        statusEl.style.display = 'none';
    }, 3000);
}

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
