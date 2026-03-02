// Amazon Platform Handler for AI Review Responder
// Complete version that integrates with your extension

(function() {
  console.log('Amazon handler loaded');
})();

// Amazon handler object - matches the pattern used in content.js
window.PlatformHandlers = window.PlatformHandlers || {};
window.PlatformHandlers.amazon = {
  
  // Check if URL matches Amazon
  matches: function(url) {
    return url.includes('amazon.com') || 
           url.includes('amazon.') || 
           url.includes('/dp/') || 
           url.includes('/product-reviews/') ||
           url.includes('/gp/') ||
           document.querySelector('[data-hook="review-body"]') !== null;
  },
  
  // Extract review text from Amazon page
  getReviewText: function() {
    console.log('Extracting Amazon review...');
    
    // Try to find the currently clicked/selected review
    const activeElement = document.activeElement;
    let reviewElement = null;
    
    // If user clicked on a review, find the parent review container
    if (activeElement) {
      reviewElement = activeElement.closest('[data-hook="review"], .review, [data-review-id]');
    }
    
    // If no clicked review, find the first visible review
    if (!reviewElement) {
      const reviewContainers = [
        '[data-hook="review"]',
        '.review',
        '[data-review-id]',
        '.a-section.review'
      ];
      
      for (const selector of reviewContainers) {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          // Try to find one that's in viewport
          for (const el of elements) {
            const rect = el.getBoundingClientRect();
            if (rect.top >= 0 && rect.top <= window.innerHeight) {
              reviewElement = el;
              break;
            }
          }
          if (!reviewElement) {
            reviewElement = elements[0];
          }
          break;
        }
      }
    }
    
    // Extract review text
    if (reviewElement) {
      const textSelectors = [
        '[data-hook="review-body"]',
        '.review-text-content',
        '.a-expander-content',
        '.review-data .a-spacing-small',
        '.a-size-base.review-text',
        '.review-text'
      ];
      
      for (const selector of textSelectors) {
        const element = reviewElement.querySelector(selector);
        if (element && element.innerText.trim()) {
          return {
            text: element.innerText.trim(),
            rating: this.extractRating(reviewElement),
            reviewer: this.extractReviewer(reviewElement),
            date: this.extractDate(reviewElement),
            platform: 'amazon'
          };
        }
      }
    }
    
    // Fallback: try direct selectors
    const fallbackSelectors = [
      '[data-hook="review-body"]',
      '.review-text-content .a-size-base',
      'div[data-hook="review-collapsed"]',
      '.review-text-content',
      '.a-expander-content'
    ];
    
    for (const selector of fallbackSelectors) {
      const element = document.querySelector(selector);
      if (element && element.innerText.trim()) {
        return {
          text: element.innerText.trim(),
          rating: this.extractRating(),
          reviewer: this.extractReviewer(),
          platform: 'amazon'
        };
      }
    }
    
    return null;
  },
  
  // Extract rating from review
  extractRating: function(reviewElement = null) {
    const container = reviewElement || document;
    
    const ratingSelectors = [
      'i[data-hook="review-star-rating"] span.a-icon-alt',
      '.a-icon-star .a-icon-alt',
      '.a-icon-star-medium .a-icon-alt',
      '.a-icon-star-small .a-icon-alt',
      '.a-spacing-top-mini .a-icon-alt'
    ];
    
    for (const selector of ratingSelectors) {
      const element = container.querySelector(selector);
      if (element) {
        const ratingText = element.innerText;
        const match = ratingText.match(/(\d+(\.\d+)?)/);
        if (match) return parseFloat(match[1]);
      }
    }
    
    return null;
  },
  
  // Extract reviewer name
  extractReviewer: function(reviewElement = null) {
    const container = reviewElement || document;
    
    const reviewerSelectors = [
      '.a-profile-name',
      'span[data-hook="review-author"]',
      '.review-byline .a-size-base'
    ];
    
    for (const selector of reviewerSelectors) {
      const element = container.querySelector(selector);
      if (element) return element.innerText.trim();
    }
    
    return 'Amazon Customer';
  },
  
  // Extract review date
  extractDate: function(reviewElement = null) {
    const container = reviewElement || document;
    
    const dateSelectors = [
      '[data-hook="review-date"]',
      '.review-date',
      '.a-color-secondary .a-size-base'
    ];
    
    for (const selector of dateSelectors) {
      const element = container.querySelector(selector);
      if (element) {
        const dateText = element.innerText;
        // Parse Amazon date format: "Reviewed in United States on January 1, 2024"
        const match = dateText.match(/on\s+(.+)$/);
        return match ? match[1] : dateText;
      }
    }
    
    return null;
  },
  
  // Find reply box on Amazon
  findReplyBox: function() {
    console.log('Finding Amazon reply box...');
    
    // Amazon comment/reply selectors
    const replySelectors = [
      'textarea#comment-content',
      '.comment-box textarea',
      'textarea[name="commentContent"]',
      '[data-hook="comment-input"]',
      '.a-input-text',
      'textarea.a-input-text',
      'textarea[name="comment"]'
    ];
    
    for (const selector of replySelectors) {
      const textarea = document.querySelector(selector);
      if (textarea && textarea.offsetParent !== null) { // visible
        return textarea;
      }
    }
    
    // Look for any visible textarea
    const textareas = document.querySelectorAll('textarea');
    for (const textarea of textareas) {
      if (textarea.offsetParent !== null && 
          (textarea.placeholder?.toLowerCase().includes('comment') ||
           textarea.placeholder?.toLowerCase().includes('reply'))) {
        return textarea;
      }
    }
    
    return null;
  },
  
  // Fill reply box with response
  fillReplyBox: function(response, replyBox) {
    console.log('Filling Amazon reply box...');
    
    if (!replyBox) return false;
    
    replyBox.value = response;
    replyBox.dispatchEvent(new Event('input', { bubbles: true }));
    replyBox.dispatchEvent(new Event('change', { bubbles: true }));
    
    // Trigger additional events for React/Angular
    replyBox.dispatchEvent(new Event('keydown', { bubbles: true }));
    replyBox.dispatchEvent(new Event('keyup', { bubbles: true }));
    
    return true;
  },
  
  // Highlight post button
  highlightPostButton: function() {
    console.log('Highlighting Amazon post button...');
    
    const buttonSelectors = [
      'input[type="submit"]',
      'button[type="submit"]',
      '.a-button-input',
      'button.a-button-primary',
      'span.a-button a-button-primary button',
      'button[aria-label*="Post"]',
      'button[aria-label*="Comment"]'
    ];
    
    for (const selector of buttonSelectors) {
      const buttons = document.querySelectorAll(selector);
      for (const button of buttons) {
        if (button.offsetParent !== null) { // visible
          // Save original styles
          const originalBoxShadow = button.style.boxShadow;
          const originalBorder = button.style.border;
          
          // Apply highlight
          button.style.boxShadow = '0 0 0 3px #FF9900';
          button.style.border = '2px solid #FF9900';
          button.style.transition = 'all 0.3s ease';
          
          // Remove highlight after 3 seconds
          setTimeout(() => {
            button.style.boxShadow = originalBoxShadow;
            button.style.border = originalBorder;
          }, 3000);
          
          // Scroll to button
          button.scrollIntoView({ behavior: 'smooth', block: 'center' });
          return true;
        }
      }
    }
    return false;
  },
  
  // Detect if we're on an Amazon product page
  isProductPage: function() {
    const url = window.location.href;
    return url.includes('/dp/') || 
           url.includes('/product/') || 
           url.includes('/gp/') ||
           (url.includes('amazon.') && (
             url.includes('/review/') ||
             document.querySelector('[data-hook="review-body"]') !== null
           ));
  },
  
  // Add custom button to Amazon page
  addButton: function() {
    if (!this.isProductPage()) return;
    
    // Don't add duplicate buttons
    if (document.getElementById('ai-review-responder-btn')) return;
    
    console.log('Adding Amazon button...');
    
    // Look for comment/reply sections
    const targetAreas = [
      '.comment-box',
      '.review-comment-section',
      '.a-section.a-spacing-top-small',
      '.add-comment-section',
      '[data-hook="review-footer"]',
      '.review-actions'
    ];
    
    for (const selector of targetAreas) {
      const areas = document.querySelectorAll(selector);
      for (const area of areas) {
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
            transition: all 0.3s ease;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          `;
          
          // Hover effect
          button.addEventListener('mouseenter', () => {
            button.style.background = '#F08800';
            button.style.transform = 'scale(1.02)';
            button.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
          });
          
          button.addEventListener('mouseleave', () => {
            button.style.background = '#FF9900';
            button.style.transform = 'scale(1)';
            button.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
          });
          
          // Click handler
          button.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const reviewData = this.getReviewText();
            if (reviewData && reviewData.text) {
              // Visual feedback
              button.innerText = '✓ Generating...';
              button.style.background = '#00a82d';
              
              // Send message to popup
              chrome.runtime.sendMessage({
                action: 'generateFromContent',
                review: reviewData.text,
                platform: 'amazon',
                rating: reviewData.rating,
                reviewer: reviewData.reviewer
              }, (response) => {
                setTimeout(() => {
                  button.innerText = '🤖 Generate AI Response';
                  button.style.background = '#FF9900';
                }, 2000);
              });
            } else {
              alert('Please click on a review first');
            }
          });
          
          area.appendChild(button);
          return;
        }
      }
    }
  }
};

// Auto-initialize when on Amazon
if (window.location.hostname.includes('amazon')) {
  console.log('AI Responder: Amazon detected');
  
  // Add button after page loads
  setTimeout(() => {
    window.PlatformHandlers.amazon.addButton();
  }, 2000);
  
  // Watch for dynamic content (infinite scroll, AJAX loads)
  const observer = new MutationObserver(() => {
    window.PlatformHandlers.amazon.addButton();
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

// Export for use in content.js
window.extractAmazonReview = function() {
  return window.PlatformHandlers.amazon.getReviewText();
};

window.fillAmazonReply = function(response) {
  const replyBox = window.PlatformHandlers.amazon.findReplyBox();
  return window.PlatformHandlers.amazon.fillReplyBox(response, replyBox);
};

window.isAmazonProductPage = function() {
  return window.PlatformHandlers.amazon.isProductPage();
};