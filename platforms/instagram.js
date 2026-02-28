// Instagram platform handler

const InstagramHandler = {
    name: 'instagram',
    
    matches: function(url) {
        return url.includes('instagram.com');
    },
    
    getReviewText: function() {
        const selectors = [
            'span._a9zr',
            'div._a9zr',
            'h1 + div span',
            'article div[role="button"] + div span'
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
            'textarea[aria-label*="comment"]',
            'form textarea',
            'div[role="textbox"]'
        ];
        
        for (const selector of selectors) {
            const box = document.querySelector(selector);
            if (box) return box;
        }
        
        return null;
    },
    
    fillReplyBox: function(response, replyBox) {
        if (!replyBox) return false;
        
        if (replyBox.tagName === 'TEXTAREA') {
            replyBox.value = response;
        } else if (replyBox.isContentEditable) {
            replyBox.innerText = response;
        } else {
            return false;
        }
        
        replyBox.dispatchEvent(new Event('input', { bubbles: true }));
        
        return true;
    },
    
    highlightPostButton: function() {
        const postButton = document.querySelector('button[type="submit"]');
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
window.PlatformHandlers.instagram = InstagramHandler;
