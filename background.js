// Background script for handling extension events

importScripts('google-docs-api.js');

// Rate Limiter for API requests
class RateLimiter {
    constructor(maxRequests = 20, timeWindow = 60000) {
        this.requests = [];
        this.maxRequests = maxRequests;
        this.timeWindow = timeWindow;
    }

    canMakeRequest() {
        const now = Date.now();

        // Remove old requests
        this.requests = this.requests.filter(
            time => now - time < this.timeWindow
        );

        if (this.requests.length >= this.maxRequests) {
            return false;
        }

        this.requests.push(now);
        return true;
    }
}

const apiLimiter = new RateLimiter(20, 60000); // 20 requests per minute

// Secure logging
class SecureLogger {
    static log(level, message, data = {}) {
        // Remove sensitive data
        const sanitized = this.sanitizeData(data);

        const logEntry = {
            timestamp: new Date().toISOString(),
            level,
            message,
            data: sanitized,
            version: chrome.runtime.getManifest().version
        };

        console[level](message, sanitized);
    }

    static sanitizeData(data) {
        const sensitive = ['token', 'password', 'auth', 'secret', 'key'];
        const sanitized = JSON.parse(JSON.stringify(data));

        function removeSensitive(obj) {
            for (const key in obj) {
                if (sensitive.some(s => key.toLowerCase().includes(s))) {
                    obj[key] = '[REDACTED]';
                } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                    removeSensitive(obj[key]);
                }
            }
        }

        removeSensitive(sanitized);
        return sanitized;
    }

    static error(message, data) {
        this.log('error', message, data);
    }

    static warn(message, data) {
        this.log('warn', message, data);
    }

    static info(message, data) {
        this.log('info', message, data);
    }
}

// Extension installation handler
chrome.runtime.onInstalled.addListener(() => {
    SecureLogger.info('Easy Screenshot extension installed');
});

// Hotkeys are now handled in content.js due to chrome.commands conflicts with popup behavior
// Icon click handler is not needed as it automatically opens popup.html
// Context menu is not needed as popup is accessible via regular click

// Token validation
async function validateToken(token) {
    try {
        const response = await fetch(`https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${token}`);
        const data = await response.json();

        if (data.error || data.expires_in < 300) { // < 5 minutes
            return false;
        }
        return true;
    } catch (error) {
        SecureLogger.error('Token validation error', { message: error.message });
        return false;
    }
}

// Google Auth Token function with validation
function getGoogleAuthToken(interactive = false) {
    return new Promise((resolve, reject) => {
        chrome.identity.getAuthToken({ interactive }, (token) => {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
            } else {
                resolve(token);
            }
        });
    });
}

// Get valid token with automatic refresh
async function getValidToken() {
    try {
        const token = await getGoogleAuthToken(false);

        if (token && await validateToken(token)) {
            return token;
        }

        // If token is invalid, get a new one
        if (token) {
            await chrome.identity.removeCachedAuthToken({ token });
        }
        return await getGoogleAuthToken(true);

    } catch (error) {
        SecureLogger.error('Token refresh error', { message: error.message });
        throw error;
    }
}

// Authentication status check function
async function checkAuthStatus() {
    try {
        // First check local authentication state
        const localAuthState = await chrome.storage.local.get(['isGoogleAuthenticated']);

        // If explicitly set to false, return false
        if (localAuthState.isGoogleAuthenticated === false) {

            return false;
        }

        // If undefined, check through API
        if (localAuthState.isGoogleAuthenticated === undefined) {

            try {
                const token = await getGoogleAuthToken(false);
                const isAuthenticated = !!token;

                // Save check result
                await chrome.storage.local.set({ isGoogleAuthenticated: isAuthenticated });


                return isAuthenticated;
            } catch (apiError) {

                await chrome.storage.local.set({ isGoogleAuthenticated: false });
                return false;
            }
        }

        // If locally set to true, verify with API
        if (localAuthState.isGoogleAuthenticated === true) {

            try {
                const token = await getGoogleAuthToken(false);
                const isAuthenticated = !!token;

                // If token unavailable, update local state
                if (!isAuthenticated) {
                    await chrome.storage.local.set({ isGoogleAuthenticated: false });
                }


                return isAuthenticated;
            } catch (apiError) {

                await chrome.storage.local.set({ isGoogleAuthenticated: false });
                return false;
            }
        }

        return false;
    } catch (error) {
        console.error('Auth check error:', error);
        // In case of error, consider user as unauthenticated
        await chrome.storage.local.set({ isGoogleAuthenticated: false });
        return false;
    }
}

// Google sign in function
async function signInToGoogle() {
    try {
        if (!apiLimiter.canMakeRequest()) {
            throw new Error('Rate limit exceeded. Please try again later.');
        }



        // Always use standard method, but force clear tokens if needed
        const shouldClearTokens = await shouldShowAccountChooser();

        if (shouldClearTokens) {

            try {
                // Force clear all tokens to show account selection
                await new Promise((resolve) => {
                    chrome.identity.clearAllCachedAuthTokens(() => {

                        resolve();
                    });
                });
            } catch (clearError) {

            }
        }


        const token = await getGoogleAuthToken(true);

        if (token) {
            // Save successful authentication state
            await chrome.storage.local.set({ isGoogleAuthenticated: true });

            // Clear logout flag after successful sign in
            if (shouldClearTokens) {
                await chrome.storage.local.remove(['hasLoggedOut']);

            }


            return { success: true };
        } else {
            throw new Error('Failed to get auth token');
        }
    } catch (error) {
        SecureLogger.error('Google sign in error', { message: error.message });

        // In case of error, set state as unauthenticated
        await chrome.storage.local.set({ isGoogleAuthenticated: false });

        let errorMessage = 'Google sign in error. Please try again.';

        // More detailed error messages
        if (error.message && error.message.includes('Invalid client')) {
            errorMessage = 'Error: Invalid Client ID. Check Google API settings.';
        } else if (error.message && error.message.includes('Access denied')) {
            errorMessage = 'Error: Access denied. Check OAuth 2.0 settings.';
        } else if (error.message && error.message.includes('User rejected the request')) {
            errorMessage = 'User cancelled the authorization process.';
        } else if (error.message && error.message.includes('Authorization page could not be loaded')) {
            errorMessage = 'Error loading authorization page. Please try again.';
        } else if (chrome.runtime.lastError) {
            errorMessage = `Error: ${chrome.runtime.lastError.message}`;
        }

        return { success: false, error: errorMessage };
    }
}

// Function to determine if account chooser should be shown
async function shouldShowAccountChooser() {
    try {
        // If user previously logged out, show account selection
        const result = await chrome.storage.local.get(['hasLoggedOut']);
        return result.hasLoggedOut === true;
    } catch (error) {
        console.error('Error checking logout history:', error);
        return false;
    }
}



// Function to sign out from Google
async function signOutFromGoogle() {
    console.log('Starting sign out process...');

    try {
        // CRITICALLY IMPORTANT: first set local state as unauthenticated
        await chrome.storage.local.set({
            isGoogleAuthenticated: false,
            hasLoggedOut: true // Flag for forced account selection on next sign in
        });
        console.log('Local auth state set to false, logout flag set');

        // Clear all related data on logout
        try {
            await chrome.storage.local.remove(['lastSavedDocumentId']);
            console.log('Cleared local storage data');
        } catch (storageError) {
            console.error('Error clearing storage:', storageError);
        }

        // Try to get and revoke tokens
        try {
            const token = await getGoogleAuthToken(false);
            console.log('Current token:', token ? 'exists' : 'not found');

            if (token) {
                // Revoke consent through Google API (for complete logout)
                try {
                    const revokeUrl = `https://oauth2.googleapis.com/revoke?token=${token}`;
                    const revokeResponse = await fetch(revokeUrl, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded'
                        }
                    });

                    if (revokeResponse.ok) {
                        console.log('Google OAuth consent revoked successfully');
                    } else {
                        console.warn('Failed to revoke Google OAuth consent:', revokeResponse.status);
                    }
                } catch (revokeError) {
                    console.warn('Error revoking Google OAuth consent:', revokeError);
                    // Continue execution - this is not a critical error
                }

                // Additionally try to revoke through alternative endpoint
                try {
                    const alternativeRevokeUrl = `https://accounts.google.com/o/oauth2/revoke?token=${token}`;
                    const altResponse = await fetch(alternativeRevokeUrl, { method: 'GET' });
                    console.log('Alternative revoke attempt:', altResponse.ok ? 'successful' : 'failed');
                } catch (altError) {
                    console.warn('Alternative revoke failed:', altError);
                }

                // Revoke specific token from Chrome cache
                await new Promise((resolve, reject) => {
                    chrome.identity.removeCachedAuthToken({ token }, () => {
                        if (chrome.runtime.lastError) {
                            console.warn('Error removing specific token:', chrome.runtime.lastError);
                            resolve(); // Don't interrupt process
                        } else {
                            console.log('Specific token removed from cache');
                            resolve();
                        }
                    });
                });
            }

            // Clear ALL cached tokens for reliability - twice for complete certainty
            for (let i = 0; i < 2; i++) {
                await new Promise((resolve, reject) => {
                    chrome.identity.clearAllCachedAuthTokens(() => {
                        if (chrome.runtime.lastError) {
                            console.warn(`Error clearing all tokens (attempt ${i + 1}):`, chrome.runtime.lastError);
                            resolve(); // Don't consider critical error
                        } else {
                            console.log(`All cached tokens cleared (attempt ${i + 1})`);
                            resolve();
                        }
                    });
                });

                // Small delay between attempts
                if (i === 0) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
            }

        } catch (tokenError) {
            console.warn('Error during token cleanup:', tokenError);
            // Continue execution - main thing is local state is set
        }

        console.log('Sign out process completed successfully');
        return { success: true };

    } catch (error) {
        console.error('Google sign out error:', error);

        // CRITICALLY IMPORTANT: even in case of error, set local state
        try {
            await chrome.storage.local.set({
                isGoogleAuthenticated: false,
                hasLoggedOut: true
            });
            console.log('Emergency: Local auth state set to false, logout flag set');
        } catch (emergencyError) {
            console.error('CRITICAL: Failed to set local auth state:', emergencyError);
        }

        return { success: false, error: error.message };
    }
}

// Function to get Google Docs documents list
async function getGoogleDocsList() {
    try {
        const token = await getGoogleAuthToken(false);
        if (!token) {
            throw new Error('Google authorization required');
        }

        const documents = await googleDocsAPI.getDocumentsList(token);

        return { success: true, documents };
    } catch (error) {
        console.error('Error getting documents list:', error);

        // Additional diagnostics
        if (error.message.includes('<!DOCTYPE')) {
            console.error('Received HTML instead of JSON - auth or URL issue');
        }

        return { success: false, error: error.message };
    }
}

// Function to save to Google Docs
async function saveToGoogleDocs(screenshotData, filename, documentId = null, position = 'start') {
    let driveFileId = null;

    try {
        const token = await getGoogleAuthToken(false);
        if (!token) {
            throw new Error('Google authorization required');
        }

        // 1. Upload screenshot to Google Drive
        const driveFile = await googleDocsAPI.uploadImageToDrive(token, screenshotData, `${filename}.png`);
        driveFileId = driveFile.id;

        // 2. Set public access
        await googleDocsAPI.makeFilePublic(token, driveFileId);

        const imageUrl = `https://drive.google.com/uc?export=view&id=${driveFileId}`;

        let document;
        if (documentId) {
            // Use existing document
            document = { documentId };
        } else {
            // Create new document
            document = await googleDocsAPI.createDocument(token, filename);
        }

        let headerOffset = 0;

        // Check if document is empty and add header if needed
        if (position === 'start') {
            const isEmpty = await googleDocsAPI.isDocumentEmpty(token, document.documentId);
            if (isEmpty) {
                await googleDocsAPI.insertHeader(token, document.documentId, filename);
                // Top offset + header + 2 line breaks = 1 + header length + 3 characters
                headerOffset = 1 + filename.length + 3;

                // Small delay for Google Docs changes processing
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        // Add additional offset for new documents
        if (!documentId) {
            // For new documents add top offset
            headerOffset += 1; // Additional 1 character offset
        } else if (position === 'start') {
            // For existing documents when inserting at start, add small offset
            headerOffset += 1; // Additional 1 character offset
        }

        await googleDocsAPI.insertImage(token, document.documentId, imageUrl, position, headerOffset);

        // Delete temporary file from Google Drive
        await googleDocsAPI.deleteFileFromDrive(token, driveFileId);

        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon48.png',
            title: 'Screenshot saved',
            message: `Screenshot added to Google Docs document.`
        });

        return { success: true, documentId: document.documentId };
    } catch (error) {
        console.error('Error saving to Google Docs:', error);

        // If error occurred and we have Drive file ID, try to delete it
        if (driveFileId) {
            try {
                const token = await getGoogleAuthToken(false);
                if (token) {
                    await googleDocsAPI.deleteFileFromDrive(token, driveFileId);
                }
            } catch (cleanupError) {
                console.error('Error deleting temporary file:', cleanupError);
            }
        }

        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon48.png',
            title: 'Save error',
            message: `Failed to save screenshot: ${error.message}`
        });
        return { success: false, error: error.message };
    }
}

// Function to create screenshot
async function takeScreenshot() {
    try {
        // Get active tab
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        if (!tab) {
            throw new Error('Active tab not found');
        }

        // Check if tab supports screenshots
        if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
            throw new Error('Screenshots not supported for chrome:// and chrome-extension:// pages');
        }

        // Take screenshot
        const screenshot = await chrome.tabs.captureVisibleTab(null, {
            format: 'png',
            quality: 100
        });

        if (!screenshot) {
            throw new Error('Failed to create screenshot');
        }

        // Send message to content script for processing
        try {
            await chrome.tabs.sendMessage(tab.id, {
                action: 'processScreenshot',
                screenshot: screenshot
            });
        } catch (error) {
            console.error('Error sending message to content script:', error);

            // Try to inject content script and retry
            try {
                console.log('Attempting to inject content script...');

                // Inject CSS
                await chrome.scripting.insertCSS({
                    target: { tabId: tab.id },
                    files: ['widget.css']
                });

                // Inject JavaScript
                await chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    files: ['content.js']
                });

                console.log('Content script injected successfully');

                // Small delay for initialization
                await new Promise(resolve => setTimeout(resolve, 100));

                // Retry sending message
                await chrome.tabs.sendMessage(tab.id, {
                    action: 'processScreenshot',
                    screenshot: screenshot
                });

                console.log('Screenshot processed successfully after injection');

            } catch (injectionError) {
                console.error('Failed to inject content script:', injectionError);

                // If injection failed, create simple modal for download
                await chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    func: (screenshotData) => {
                        // Create simple modal for download
                        const modal = document.createElement('div');
                        modal.style.cssText = `
                            position: fixed;
                            top: 0;
                            left: 0;
                            width: 100%;
                            height: 100%;
                            background: rgba(0, 0, 0, 0.8);
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            z-index: 999999;
                            font-family: Arial, sans-serif;
                        `;

                        const content = document.createElement('div');
                        content.style.cssText = `
                            background: white;
                            border-radius: 12px;
                            padding: 24px;
                            max-width: 500px;
                            text-align: center;
                        `;

                        content.innerHTML = `
                            <h2 style="margin: 0 0 16px 0;">Screenshot Ready</h2>
                            <img src="${screenshotData}" style="max-width: 100%; height: auto; border-radius: 8px; margin-bottom: 16px;" />
                            <div>
                                <button id="download-btn" style="
                                    background: #4285f4;
                                    color: white;
                                    border: none;
                                    padding: 12px 24px;
                                    border-radius: 8px;
                                    cursor: pointer;
                                    margin-right: 8px;
                                ">Download</button>
                                <button id="close-btn" style="
                                    background: #f1f3f4;
                                    color: #5f6368;
                                    border: none;
                                    padding: 12px 24px;
                                    border-radius: 8px;
                                    cursor: pointer;
                                ">Close</button>
                            </div>
                        `;

                        modal.appendChild(content);
                        document.body.appendChild(modal);

                        // Event handlers
                        document.getElementById('download-btn').onclick = () => {
                            const link = document.createElement('a');
                            link.href = screenshotData;
                            link.download = `screenshot_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.png`;
                            link.click();
                            modal.remove();
                        };

                        document.getElementById('close-btn').onclick = () => {
                            modal.remove();
                        };

                        // Close on click outside modal
                        modal.onclick = (e) => {
                            if (e.target === modal) {
                                modal.remove();
                            }
                        };
                    },
                    args: [screenshot]
                });

                console.log('Fallback download modal created');
            }
        }

    } catch (error) {
        console.error('Error creating screenshot:', error);
        throw error;
    }
}

// Message handler from content script and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('📨 Message received in background:', request.action, 'from:', (sender.tab && sender.tab.url) || 'popup');
    try {
        switch (request.action) {
            case 'takeScreenshot':
                console.log('📸 Taking screenshot from message handler...');
                takeScreenshot().then(() => {
                    console.log('✅ Screenshot completed successfully');
                    sendResponse({ success: true });
                }).catch((error) => {
                    console.error('❌ Screenshot creation error:', error);
                    sendResponse({ error: error.message });
                });
                return true; // Asynchronous response

            case 'signInToGoogle':
                signInToGoogle().then(response => {
                    sendResponse(response);
                });
                return true; // Asynchronous response

            case 'signOutFromGoogle':
                signOutFromGoogle().then(response => {
                    sendResponse(response);
                });
                return true; // Asynchronous response

            case 'checkAuthStatus':
                checkAuthStatus().then(authenticated => {
                    sendResponse({ authenticated });
                });
                return true; // Asynchronous response

            case 'saveToGoogleDocs':
                saveToGoogleDocs(request.screenshot, request.filename, request.documentId, request.position).then(response => {
                    sendResponse(response);
                });
                return true; // Asynchronous response

            case 'checkStatus':
                sendResponse({ status: 'active' });
                break;

            case 'getGoogleDocsList':
                getGoogleDocsList().then(response => {
                    sendResponse(response);
                });
                return true; // Asynchronous response

            case 'forceSignOut':
                // Forced logout - local state only
                chrome.storage.local.set({ isGoogleAuthenticated: false }).then(() => {
                    sendResponse({ success: true });
                });
                return true; // Asynchronous response

            default:
                sendResponse({ error: 'Unknown action' });
        }
    } catch (error) {
        console.error('Message handling error:', error);
        sendResponse({ error: error.message });
    }

    return true; // Show that response will be asynchronous
});

// Notification handler
chrome.notifications.onClicked.addListener((notificationId) => {
    // Handle notification click
});

// Tab update handler
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete') {
        // Page fully loaded
    }
});