// Twitter/X platform handler

const TwitterHandler = {
    name: 'twitter',
    
    matches: function(url) {
        return url.includes('twitter.com') || url.includes('x.com');
    },
    
    getReviewText: function() {
        const selectors = [
            '[data-testid="tweetText"]',
            'article div[lang]',
            '.tweet-text',
            '[data-testid="tweet"]'
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
            '[data-testid="tweetTextarea"]',
            '[data-testid="reply"] textarea',
            'div[role="textbox"]',
            'textarea[placeholder*="Reply"]'
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
        const postButton = document.querySelector('[data-testid="tweetButton"]');
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
window.PlatformHandlers.twitter = TwitterHandler;
