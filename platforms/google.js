// Google Maps/Reviews platform handler

const GoogleHandler = {
    name: 'google',
    
    matches: function(url) {
        return url.includes('google.com') || url.includes('maps.google');
    },
    
    getReviewText: function() {
        const selectors = [
            '.review-text',
            '[data-review-id] .review-full-text',
            '.section-review-text',
            'div[jsname*="review"]',
            '.rogA2c'
        ];
        
        for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element && element.innerText) {
                return element.innerText;
            }
        }
        
        return null;
    },
    
    findReplyBox: function() {
        const selectors = [
            'input[aria-label*="reply"]',
            'textarea[aria-label*="reply"]',
            'div[role="textbox"]',
            'input[placeholder*="Reply"]'
        ];
        
        for (const selector of selectors) {
            const box = document.querySelector(selector);
            if (box) return box;
        }
        
        return null;
    },
    
    fillReplyBox: function(response, replyBox) {
        if (!replyBox) return false;
        
        if (replyBox.tagName === 'TEXTAREA' || replyBox.tagName === 'INPUT') {
            replyBox.value = response;
        } else if (replyBox.isContentEditable) {
            replyBox.innerText = response;
        } else {
            return false;
        }
        
        replyBox.dispatchEvent(new Event('input', { bubbles: true }));
        replyBox.dispatchEvent(new Event('change', { bubbles: true }));
        
        return true;
    },
    
    highlightPostButton: function() {
        const postButton = document.querySelector('[jsname*="reply"], button[aria-label*="Post"]');
        if (postButton) {
            postButton.style.backgroundColor = '#ff6b35';
            postButton.style.color = 'white';
            
            setTimeout(() => {
                postButton.style.backgroundColor = '';
                postButton.style.color = '';
            }, 3000);
        }
    }
};

window.PlatformHandlers = window.PlatformHandlers || {};
window.PlatformHandlers.google = GoogleHandler;
