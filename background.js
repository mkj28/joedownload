
    // Listen for a click on the browser action (extension icon).
    chrome.action.onClicked.addListener((tab) => {
      // Ensure the tab has a URL before trying to inject a script.
      if (tab.url && (tab.url.startsWith('http://') || tab.url.startsWith('https://'))) {
        // Execute the content script in the current tab.
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content.js']
        }, (injectionResults) => {
          if (chrome.runtime.lastError) {
            console.error('Error injecting script: ' + chrome.runtime.lastError.message);
            // Optionally, notify the user about the error, e.g., if scripting is disallowed on the page.
          } else if (injectionResults && injectionResults.length > 0) {
            // You can check results here if content.js returned something directly,
            // but we are using message passing.
            console.log('Content script injected successfully.');
          }
        });
      } else {
        console.log('Cannot inject script into this tab (e.g., chrome:// pages or new tab page).');
      }
    });

    // Listen for messages from the content script.
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === "videoUrl") {
        if (message.url) {
          console.log('Video URL received:', message.url);
          
          // Attempt to derive a filename from the URL
          let filename = '';
          try {
            const urlPath = new URL(message.url).pathname;
            filename = urlPath.substring(urlPath.lastIndexOf('/') + 1);
            // Basic sanitization: remove query parameters or hash from filename
            filename = filename.split('?')[0].split('#')[0];
            if (!filename.toLowerCase().endsWith('.mp4')) {
                // If the extracted part doesn't seem like a full filename,
                // or if it's missing the .mp4 extension, append a default.
                // This can happen if the URL is a blob or has no clear file extension.
                 if (filename && !filename.includes('.')) { // if filename is not empty and has no extension
                    filename += '.mp4';
                 } else if (!filename) {
                    filename = 'video.mp4';
                 }
            }
          } catch (e) {
            console.warn('Could not derive filename from URL, using default.', e);
            filename = 'video.mp4';
          }

          // Ensure filename is not empty
          if (!filename) {
            filename = 'downloaded_video.mp4';
          }

          chrome.downloads.download({
            url: message.url,
            filename: filename, // Suggest a filename
            saveAs: true // Optional: set to false to download automatically to the default folder
          }, (downloadId) => {
            if (chrome.runtime.lastError) {
              console.error('Download failed:', chrome.runtime.lastError.message);
              // Notify user of download failure
              chrome.notifications.create({
                type: 'basic',
                iconUrl: 'icons/icon48.png',
                title: 'Download Failed',
                message: 'Could not download the video: ' + chrome.runtime.lastError.message
              });
            } else if (downloadId === undefined) {
                console.error('Download failed: downloadId is undefined. This can happen if the URL is invalid or blocked.');
                chrome.notifications.create({
                    type: 'basic',
                    iconUrl: 'icons/icon48.png',
                    title: 'Download Failed',
                    message: 'The video URL might be invalid or the download was blocked.'
                });
            } else {
              console.log('Download started with ID:', downloadId);
            }
          });
        } else {
          console.log('No MP4 video URL found on the page.');
          // Notify user that no video was found
          chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon48.png',
            title: 'No Video Found',
            message: 'Could not find an MP4 video link on this page.'
          });
        }
      }
    });

    