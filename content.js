// content.js - Runs on websites

// 🛑 DON'T run on my own website
if (window.location.hostname === 'responder.aiinfra.work') {
  console.log('AI Responder: Skipping own website to prevent layout issues');
  // Exit early - don't run any extension code on your own site
} else {
  // Only run on other websites
  mainExtension();
}

// Main extension function - only runs on supported platforms
function mainExtension() {
  
  // Load platform handlers
  const platformHandlers = window.PlatformHandlers || {};
  
  // Current platform
  let currentPlatform = null;
  let currentHandler = null;
  
  // Define Amazon handler directly in content.js (as fallback)
  const amazonHandler = {
    matches: function(url) {
      return url.includes('amazon.com') || 
             url.includes('amazon.') || 
             url.includes('/dp/') || 
             url.includes('/product-reviews/') ||
             document.querySelector('[data-hook="review-body"]') !== null;
    },
    
    getReviewText: function() {
      // Amazon review selectors
      const selectors = [
        '[data-hook="review-body"]',
        '.review-text-content',
        '.a-expander-content',
        '.review-data .a-spacing-small',
        '.a-size-base.review-text',
        '.review-text-content .a-size-base',
        'div[data-hook="review-collapsed"]'
      ];
      
      for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element && element.innerText.trim()) {
          return {
            text: element.innerText.trim(),
            rating: this.extractRating(),
            platform: 'amazon'
          };
        }
      }
      return null;
    },
    
    extractRating: function() {
      const ratingSelectors = [
        'i[data-hook="review-star-rating"] span.a-icon-alt',
        '.a-icon-star .a-icon-alt',
        '.a-icon-star-medium .a-icon-alt',
        'span.a-size-base.a-color-base'
      ];
      
      for (const selector of ratingSelectors) {
        const element = document.querySelector(selector);
        if (element) {
          const ratingText = element.innerText;
          const match = ratingText.match(/(\d+(\.\d+)?)/);
          if (match) return parseFloat(match[1]);
        }
      }
      return null;
    },
    
    findReplyBox: function() {
      // Amazon comment/reply selectors
      const selectors = [
        'textarea#comment-content',
        '.comment-box textarea',
        'textarea[name="commentContent"]',
        '[data-hook="comment-input"]',
        '.a-input-text',
        'textarea.a-input-text'
      ];
      
      for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element) return element;
      }
      
      // Look for any visible textarea
      const textareas = document.querySelectorAll('textarea');
      for (const textarea of textareas) {
        if (textarea.offsetParent !== null) { // visible
          return textarea;
        }
      }
      
      return null;
    },
    
    fillReplyBox: function(response, replyBox) {
      if (!replyBox) return false;
      
      replyBox.value = response;
      replyBox.dispatchEvent(new Event('input', { bubbles: true }));
      replyBox.dispatchEvent(new Event('change', { bubbles: true }));
      
      // Try to trigger React/Angular events
      replyBox.dispatchEvent(new Event('keydown', { bubbles: true }));
      replyBox.dispatchEvent(new Event('keyup', { bubbles: true }));
      
      return true;
    },
    
    highlightPostButton: function() {
      // Find and highlight submit button
      const buttonSelectors = [
        'input[type="submit"]',
        'button[type="submit"]',
        '.a-button-input',
        'button.a-button-primary',
        'span.a-button a-button-primary button'
      ];
      
      for (const selector of buttonSelectors) {
        const button = document.querySelector(selector);
        if (button) {
          button.style.boxShadow = '0 0 0 2px #FF9900';
          button.style.transition = 'box-shadow 0.3s ease';
          
          // Remove highlight after 3 seconds
          setTimeout(() => {
            button.style.boxShadow = '';
          }, 3000);
          
          // Scroll to button
          button.scrollIntoView({ behavior: 'smooth', block: 'center' });
          break;
        }
      }
    }
  };
  
  // Define Facebook handler
  const facebookHandler = {
    matches: function(url) {
      return url.includes('facebook.com');
    },
    
    getReviewText: function() {
      const selectors = [
        '[data-testid="review_feed"] [data-testid="review"]',
        '[role="article"] .userContent',
        '.review-text',
        'div[data-pagelet^="ProfilePlusReview"]'
      ];
      
      for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element && element.innerText.trim()) {
          return {
            text: element.innerText.trim(),
            platform: 'facebook'
          };
        }
      }
      return null;
    },
    
    findReplyBox: function() {
      const selectors = [
        'form[method="post"] textarea',
        'div[role="dialog"] textarea',
        '[aria-label*="comment"]',
        '[aria-label*="reply"]',
        '.notranslate._5yk2'
      ];
      
      for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element) return element;
      }
      return null;
    },
    
    fillReplyBox: function(response, replyBox) {
      replyBox.value = response;
      replyBox.dispatchEvent(new Event('input', { bubbles: true }));
      return true;
    },
    
    highlightPostButton: function() {
      const buttons = document.querySelectorAll('[role="button"]');
      for (const button of buttons) {
        if (button.innerText.includes('Post') || button.innerText.includes('Comment')) {
          button.style.boxShadow = '0 0 0 2px #1877f2';
          setTimeout(() => button.style.boxShadow = '', 3000);
          button.scrollIntoView({ behavior: 'smooth' });
          break;
        }
      }
    }
  };
  
  // Define Google handler
  const googleHandler = {
    matches: function(url) {
      return url.includes('google.com/maps') || url.includes('google.com/business');
    },
    
    getReviewText: function() {
      const selectors = [
        '.review-text',
        '[data-review-id] .review-full-text',
        '.wiI7pd',
        '.RsguE'
      ];
      
      for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element && element.innerText.trim()) {
          return {
            text: element.innerText.trim(),
            platform: 'google'
          };
        }
      }
      return null;
    },
    
    findReplyBox: function() {
      const selectors = [
        'textarea[placeholder*="reply"]',
        'div[contenteditable="true"]',
        '[aria-label*="Reply"]'
      ];
      
      for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element) return element;
      }
      return null;
    },
    
    fillReplyBox: function(response, replyBox) {
      if (replyBox.tagName === 'TEXTAREA' || replyBox.tagName === 'INPUT') {
        replyBox.value = response;
      } else if (replyBox.isContentEditable) {
        replyBox.innerText = response;
      }
      replyBox.dispatchEvent(new Event('input', { bubbles: true }));
      return true;
    },
    
    highlightPostButton: function() {
      const buttons = document.querySelectorAll('button');
      for (const button of buttons) {
        if (button.innerText.includes('Post') || button.innerText.includes('Reply')) {
          button.style.boxShadow = '0 0 0 2px #1a73e8';
          setTimeout(() => button.style.boxShadow = '', 3000);
          button.scrollIntoView({ behavior: 'smooth' });
          break;
        }
      }
    }
  };
  
  // Define Twitter handler
  const twitterHandler = {
    matches: function(url) {
      return url.includes('twitter.com') || url.includes('x.com');
    },
    
    getReviewText: function() {
      const selectors = [
        '[data-testid="tweetText"]',
        'article div[lang]',
        '.css-901oao'
      ];
      
      for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element && element.innerText.trim()) {
          return {
            text: element.innerText.trim(),
            platform: 'twitter'
          };
        }
      }
      return null;
    },
    
    findReplyBox: function() {
      const selectors = [
        '[data-testid="tweetTextarea_0"]',
        'div[aria-label*="Tweet"]',
        'div[contenteditable="true"]'
      ];
      
      for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element) return element;
      }
      return null;
    },
    
    fillReplyBox: function(response, replyBox) {
      if (replyBox.tagName === 'TEXTAREA' || replyBox.tagName === 'INPUT') {
        replyBox.value = response;
      } else if (replyBox.isContentEditable) {
        replyBox.innerText = response;
      }
      replyBox.dispatchEvent(new Event('input', { bubbles: true }));
      return true;
    },
    
    highlightPostButton: function() {
      const buttons = document.querySelectorAll('[data-testid="tweetButton"]');
      for (const button of buttons) {
        button.style.boxShadow = '0 0 0 2px #1d9bf0';
        setTimeout(() => button.style.boxShadow = '', 3000);
        button.scrollIntoView({ behavior: 'smooth' });
        break;
      }
    }
  };
  
  // Define Instagram handler
  const instagramHandler = {
    matches: function(url) {
      return url.includes('instagram.com');
    },
    
    getReviewText: function() {
      const selectors = [
        'div._a9zr',
        'span._aap6',
        'h1._a9zc'
      ];
      
      for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element && element.innerText.trim()) {
          return {
            text: element.innerText.trim(),
            platform: 'instagram'
          };
        }
      }
      return null;
    },
    
    findReplyBox: function() {
      const selectors = [
        'textarea[aria-label*="comment"]',
        'form textarea'
      ];
      
      for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element) return element;
      }
      return null;
    },
    
    fillReplyBox: function(response, replyBox) {
      replyBox.value = response;
      replyBox.dispatchEvent(new Event('input', { bubbles: true }));
      return true;
    },
    
    highlightPostButton: function() {
      const buttons = document.querySelectorAll('button');
      for (const button of buttons) {
        if (button.innerText.includes('Post')) {
          button.style.boxShadow = '0 0 0 2px #0095f6';
          setTimeout(() => button.style.boxShadow = '', 3000);
          button.scrollIntoView({ behavior: 'smooth' });
          break;
        }
      }
    }
  };
  
  // Define Yelp handler
  const yelpHandler = {
    matches: function(url) {
      return url.includes('yelp.com');
    },
    
    getReviewText: function() {
      const selectors = [
        'p.comment__09f24__DZ7Zz',
        'span.raw__09f24__T4Ezm',
        'div.css-1qn4bxc'
      ];
      
      for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element && element.innerText.trim()) {
          return {
            text: element.innerText.trim(),
            platform: 'yelp'
          };
        }
      }
      return null;
    },
    
    findReplyBox: function() {
      const selectors = [
        'textarea[name="text"]',
        'div[contenteditable="true"]',
        '.comment-textarea'
      ];
      
      for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element) return element;
      }
      return null;
    },
    
    fillReplyBox: function(response, replyBox) {
      if (replyBox.tagName === 'TEXTAREA' || replyBox.tagName === 'INPUT') {
        replyBox.value = response;
      } else if (replyBox.isContentEditable) {
        replyBox.innerText = response;
      }
      replyBox.dispatchEvent(new Event('input', { bubbles: true }));
      return true;
    },
    
    highlightPostButton: function() {
      const buttons = document.querySelectorAll('button');
      for (const button of buttons) {
        if (button.innerText.includes('Post') || button.innerText.includes('Submit')) {
          button.style.boxShadow = '0 0 0 2px #d32323';
          setTimeout(() => button.style.boxShadow = '', 3000);
          button.scrollIntoView({ behavior: 'smooth' });
          break;
        }
      }
    }
  };
  
  // Define TripAdvisor handler
  const tripadvisorHandler = {
    matches: function(url) {
      return url.includes('tripadvisor.com');
    },
    
    getReviewText: function() {
      const selectors = [
        '.review-content p',
        '.prw_rup.prw_reviews_text_summary_hsx',
        'div._2wrUUKlw'
      ];
      
      for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element && element.innerText.trim()) {
          return {
            text: element.innerText.trim(),
            platform: 'tripadvisor'
          };
        }
      }
      return null;
    },
    
    findReplyBox: function() {
      const selectors = [
        'textarea[name="comment"]',
        '.comment-textarea',
        'div[contenteditable="true"]'
      ];
      
      for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element) return element;
      }
      return null;
    },
    
    fillReplyBox: function(response, replyBox) {
      if (replyBox.tagName === 'TEXTAREA' || replyBox.tagName === 'INPUT') {
        replyBox.value = response;
      } else if (replyBox.isContentEditable) {
        replyBox.innerText = response;
      }
      replyBox.dispatchEvent(new Event('input', { bubbles: true }));
      return true;
    },
    
    highlightPostButton: function() {
      const buttons = document.querySelectorAll('button');
      for (const button of buttons) {
        if (button.innerText.includes('Submit') || button.innerText.includes('Post')) {
          button.style.boxShadow = '0 0 0 2px #00af87';
          setTimeout(() => button.style.boxShadow = '', 3000);
          button.scrollIntoView({ behavior: 'smooth' });
          break;
        }
      }
    }
  };
  
  // Combine all handlers
  const handlers = {
    amazon: amazonHandler,
    facebook: facebookHandler,
    google: googleHandler,
    twitter: twitterHandler,
    instagram: instagramHandler,
    yelp: yelpHandler,
    tripadvisor: tripadvisorHandler
  };
  
  // Initialize
  function initialize() {
    const url = window.location.href;
    
    // Detect platform
    for (const [name, handler] of Object.entries(handlers)) {
      if (handler.matches(url)) {
        currentPlatform = name;
        currentHandler = handler;
        console.log(`AI Responder: Detected ${name} platform`);
        
        // Add visual indicator for Amazon
        if (name === 'amazon') {
          addAmazonButton();
        }
        break;
      }
    }
    
    if (!currentHandler) {
      console.log('AI Responder: Unknown platform');
    }
  }
  
  // Add Amazon-specific button
  function addAmazonButton() {
    // Look for comment/reply sections
    const targetAreas = [
      '.comment-box',
      '.review-comment-section',
      '.a-section.a-spacing-top-small',
      '.add-comment-section',
      '[data-hook="review-footer"]'
    ];
    
    for (const selector of targetAreas) {
      const areas = document.querySelectorAll(selector);
      areas.forEach(area => {
        if (!area.querySelector('#ai-review-responder-btn')) {
          const button = document.createElement('button');
          button.id = 'ai-review-responder-btn';
          button.innerText = '🤖 Generate AI Response';
          button.style.cssText = `
            background: #FF9900;
            color: white;
            border: none;
            padding: 8px 15px;
            border-radius: 20px;
            cursor: pointer;
            font-size: 14px;
            margin: 10px 0;
            display: inline-block;
            font-family: 'Amazon Ember', Arial, sans-serif;
            font-weight: bold;
            transition: background 0.3s;
          `;
          
          button.addEventListener('mouseenter', () => {
            button.style.background = '#F08800';
          });
          
          button.addEventListener('mouseleave', () => {
            button.style.background = '#FF9900';
          });
          
          button.addEventListener('click', async () => {
            const reviewData = amazonHandler.getReviewText();
            if (reviewData && reviewData.text) {
              // Send message to popup to generate response
              chrome.runtime.sendMessage({
                action: 'generateFromContent',
                review: reviewData.text,
                platform: 'amazon',
                rating: reviewData.rating
              });
              
              // Visual feedback
              button.innerText = '✓ Generating...';
              setTimeout(() => {
                button.innerText = '🤖 Generate AI Response';
              }, 2000);
            } else {
              alert('Please click on a review first');
            }
          });
          
          area.appendChild(button);
        }
      });
    }
  }
  
  // Listen for messages from popup
  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    
    // Get review text from page
    if (request.action === "getReviewText") {
      if (!currentHandler) {
        sendResponse({error: "Platform not supported"});
        return true;
      }
      
      const reviewData = currentHandler.getReviewText();
      sendResponse({
        reviewText: reviewData?.text || null,
        platform: currentPlatform,
        metadata: reviewData?.rating ? { rating: reviewData.rating } : null
      });
    }
    
    // Fill reply box with response
    else if (request.action === "fillReply") {
      if (!currentHandler) {
        sendResponse({error: "Platform not supported"});
        return true;
      }
      
      const replyBox = currentHandler.findReplyBox();
      if (!replyBox) {
        sendResponse({error: "Could not find reply box"});
        return true;
      }
      
      const success = currentHandler.fillReplyBox(request.response, replyBox);
      if (success) {
        currentHandler.highlightPostButton();
        sendResponse({success: true});
      } else {
        sendResponse({error: "Could not fill reply box"});
      }
    }
    
    // Get platform info
    else if (request.action === "getPlatform") {
      sendResponse({
        platform: currentPlatform,
        hasHandler: !!currentHandler
      });
    }
    
    return true;
  });
  
  // Run when page loads
  initialize();
  
  // Also run on dynamic page changes (for single-page apps)
  let lastUrl = location.href;
  new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
      lastUrl = url;
      setTimeout(initialize, 1000); // Wait for page to load
    }
  }).observe(document, {subtree: true, childList: true});
  
  // Also watch for dynamic content on Amazon
  if (window.location.hostname.includes('amazon')) {
    const observer = new MutationObserver(() => {
      addAmazonButton();
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
}