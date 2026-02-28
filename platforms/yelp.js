// Yelp platform handler

const YelpHandler = {
    name: 'yelp',
    
    matches: function(url) {
        return url.includes('yelp.com');
    },
    
    getReviewText: function() {
        const selectors = [
            '.comment__09f24__gu0rG',
            'p[class*="comment"]',
            '.review-content p'
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
            'textarea[placeholder*="Reply"]',
            '.reply-form textarea',
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
        
        replyBox.value = response;
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
window.PlatformHandlers.yelp = YelpHandler;
