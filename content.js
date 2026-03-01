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

  // Initialize
  function initialize() {
    const url = window.location.href;
    // Detect platform
    for (const [name, handler] of Object.entries(platformHandlers)) {
      if (handler.matches(url)) {
        currentPlatform = name;
        currentHandler = handler;
        console.log(`AI Responder: Detected ${name} platform`);
        break;
      }
    }
    if (!currentHandler) {
      console.log('AI Responder: Unknown platform');
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
      const reviewText = currentHandler.getReviewText();
      sendResponse({reviewText: reviewText});
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
}