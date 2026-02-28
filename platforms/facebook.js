// Facebook platform handlers

const FacebookHandler = {
    name: 'facebook',
    
    // Check if current page is Facebook
    matches: function(url) {
        return url.includes('facebook.com');
    },
    
    // Find review text on Facebook page
    getReviewText: function() {
        // Try different selectors for Facebook reviews
        const selectors = [
            '[data-testid="review-text"]',
            '[data-pagelet="ProfileReviews"] .x1iorvi4',
            'div[role="article"] span.xdj266r',
            '.x1iorvi4 .x1n2onr6 span'
        ];
        
        for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element && element.innerText) {
                return element.innerText;
            }
        }
        
        // Look for any review-like text
        const possibleReviews = document.querySelectorAll('div[role="article"]');
        for (const review of possibleReviews) {
            const text = review.innerText;
            if (text && text.length > 20 && text.length < 1000) {
                return text;
            }
        }
        
        return null;
    },
    
    // Find reply box on Facebook
    findReplyBox: function() {
        const selectors = [
            'textarea[placeholder*="reply"]',
            'textarea[placeholder*="comment"]',
            'div[role="textbox"][contenteditable="true"]',
            'form textarea'
        ];
        
        for (const selector of selectors) {
            const box = document.querySelector(selector);
            if (box) return box;
        }
        
        return null;
    },
    
    // Fill reply box with response
    fillReplyBox: function(response, replyBox) {
        if (!replyBox) return false;
        
        // Different handling for contenteditable vs textarea
        if (replyBox.tagName === 'TEXTAREA' || replyBox.tagName === 'INPUT') {
            replyBox.value = response;
        } else if (replyBox.isContentEditable) {
            replyBox.innerText = response;
        } else {
            return false;
        }
        
        // Trigger input event
        replyBox.dispatchEvent(new Event('input', { bubbles: true }));
        replyBox.dispatchEvent(new Event('change', { bubbles: true }));
        
        return true;
    },
    
    // Highlight post button
    highlightPostButton: function() {
        const postButton = document.querySelector('[type="submit"], button[aria-label*="Post"], button[aria-label*="Comment"]');
        if (postButton) {
            postButton.style.backgroundColor = '#ff6b35';
            postButton.style.color = 'white';
            postButton.style.transition = 'all 0.3s';
            
            // Remove highlight after 3 seconds
            setTimeout(() => {
                postButton.style.backgroundColor = '';
                postButton.style.color = '';
            }, 3000);
        }
    }
};

// Export for use in content.js
window.PlatformHandlers = window.PlatformHandlers || {};
window.PlatformHandlers.facebook = FacebookHandler;
