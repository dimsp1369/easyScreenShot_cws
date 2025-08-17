// Content script for handling screenshots and displaying the widget

// Global modal state
let isModalOpen = false;

// User data validation
function validateFilename(filename) {
    if (!filename || typeof filename !== 'string') {
        return 'screenshot.png';
    }

    // Remove dangerous characters
    const clean = filename.replace(/[<>:"/\\|?*]/g, '_');

    // Limit length
    const maxLength = 255;
    const truncated = clean.length > maxLength ?
        clean.substring(0, maxLength - 4) + '...' : clean;

    // Add extension if missing
    return truncated.endsWith('.png') ? truncated : truncated + '.png';
}

// Image size validation
function validateImageSize(dataUrl) {
    if (!dataUrl || typeof dataUrl !== 'string') {
        throw new Error('Invalid image data');
    }

    const sizeInBytes = (dataUrl.length * 3) / 4; // base64 to bytes
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (sizeInBytes > maxSize) {
        throw new Error('Image too large. Maximum size: 10MB');
    }

    return true;
}

// Document ID validation
function validateDocumentId(docId) {
    if (!docId || typeof docId !== 'string') {
        return false;
    }

    // Google Doc ID pattern
    const pattern = /^[a-zA-Z0-9-_]{25,}$/;
    return pattern.test(docId);
}

// Function to close modal and update flag
function closeModal(modal) {
    console.log('🔒 Closing modal and resetting flag');
    isModalOpen = false;
    if (modal && modal.parentNode) {
        modal.remove();
    }
}

// =====================================================
// GLOBAL hotkey handler - ALWAYS FIRST!
// =====================================================
// Content script loaded and hotkey handler registered

// Multiple handlers for more reliable interception
const hotkeyHandler = (event) => {
    // Log all Ctrl+Shift combinations for debugging
    if (event.ctrlKey && event.shiftKey) {
        // Debug: Ctrl+Shift combination detected
    }

    // Main working combination: Ctrl+Shift+X
    const isCtrlShiftX = (event.ctrlKey || event.metaKey) && event.shiftKey &&
        (event.key === 'X' || event.key === 'x' || event.keyCode === 88 || event.which === 88);

    if (isCtrlShiftX) {
        // Check if modal is already open
        const existingModal = document.getElementById('screenshot-modal');
        if (existingModal || isModalOpen) {
            // Hotkey blocked - modal already open
            event.preventDefault();
            event.stopImmediatePropagation();
            event.stopPropagation();
            return false;
        }

        // Hotkey Ctrl+Shift+X detected

        event.preventDefault();
        event.stopImmediatePropagation();
        event.stopPropagation();

        // Send message directly to background script for screenshot creation
        chrome.runtime.sendMessage({ action: 'takeScreenshot' }).catch((error) => {
            console.error('Error sending screenshot request from hotkey:', error);
        });

        return false;
    }
};

// Register handler in different phases for reliability
document.addEventListener('keydown', hotkeyHandler, true); // capture phase
document.addEventListener('keydown', hotkeyHandler, false); // bubble phase

// Additionally register on window for global interception
window.addEventListener('keydown', hotkeyHandler, true);

// Also try keyup for cases when keydown is blocked
document.addEventListener('keyup', (event) => {
    const isCtrlShiftX = (event.ctrlKey || event.metaKey) && event.shiftKey &&
        (event.key === 'X' || event.key === 'x' || event.keyCode === 88 || event.which === 88);

    if (isCtrlShiftX) {
        // Check if modal is already open
        const existingModal = document.getElementById('screenshot-modal');
        if (existingModal || isModalOpen) {
            console.log('🚫 Hotkey blocked on keyup - modal already open (DOM check:', !!existingModal, ', flag:', isModalOpen, ')');
            event.preventDefault();
            return false;
        }

        console.log('🔥 Hotkey Ctrl+Shift+X detected on keyup');
        event.preventDefault();
        chrome.runtime.sendMessage({ action: 'takeScreenshot' });
    }
}, true);

// Additional loading check
setTimeout(() => {
    console.log('⏰ Content script still alive after 2 seconds');
}, 2000);

// Check if this script has already been executed on this page
if (window.screenshotWidgetInitialized) {
    console.log('Easy Screenshot already initialized, skipping...');
    // Stop execution but register message handler
} else {
    window.screenshotWidgetInitialized = true;
    console.log('Initializing Easy Screenshot on:', window.location.href);
}

let widget = null;
let isProcessing = false;

// Widget creation
function createWidget() {
    if (widget) {
        return;
    }

    widget = document.createElement('div');
    widget.id = 'screenshot-widget';
    widget.innerHTML = `
        <div class="widget-container">
            <div class="widget-button" title="Take Screenshot | Hotkey: Ctrl+Shift+X">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1H5C3.9 1 3 1.9 3 3V21C3 22.1 3.9 23 5 23H19C20.1 23 21 22.1 21V9ZM19 21H5V3H13V9H19V21Z" fill="currentColor"/>
                </svg>
                <div class="hotkey-hint">Ctrl+Shift+X</div>
            </div>
            <div class="widget-status" style="display: none;">
                <div class="spinner"></div>
            </div>
        </div>
    `;

    // Add click handler
    const button = widget.querySelector('.widget-button');
    button.addEventListener('click', handleScreenshotClick);

    // Add widget to page
    document.body.appendChild(widget);

    // Position widget
    positionWidget();
}

// Widget positioning
function positionWidget() {
    if (!widget) return;

    widget.style.position = 'fixed';
    widget.style.top = '20px';
    widget.style.right = '20px';
    widget.style.zIndex = '999999';
}

// Widget click handler
async function handleScreenshotClick() {
    if (isProcessing) {
        return;
    }

    isProcessing = true;
    showStatus(true);

    try {
        // Send message to background script for screenshot creation
        const response = await chrome.runtime.sendMessage({ action: 'takeScreenshot' });

        if (response && response.error) {
            console.error('Screenshot creation error:', response.error);
            showStatus(false);
            isProcessing = false;
        }
    } catch (error) {
        console.error('Screenshot creation error:', error);
        showStatus(false);
        isProcessing = false;
    }
}

// Show/hide processing status
function showStatus(show) {
    if (!widget) {
        return;
    }

    const button = widget.querySelector('.widget-button');
    const status = widget.querySelector('.widget-status');

    if (show) {
        button.style.display = 'none';
        status.style.display = 'flex';
    } else {
        button.style.display = 'flex';
        status.style.display = 'none';
    }
}

// Create modal window for screenshot preview and saving
async function createScreenshotModal(screenshotData) {
    console.log('Creating screenshot modal...');

    // Set flag that modal is opening
    isModalOpen = true;

    // Remove existing modal if it exists
    const existingModal = document.getElementById('screenshot-modal');
    if (existingModal) {
        existingModal.remove();
    }

    // Check authentication status
    let isAuthenticated = false;
    try {
        const authResponse = await chrome.runtime.sendMessage({ action: 'checkAuthStatus' });
        isAuthenticated = authResponse.authenticated;
        console.log('Auth status in modal:', isAuthenticated);
    } catch (error) {
        console.error('Error checking auth status in modal:', error);
        isAuthenticated = false;
    }

    // Create modal window
    const modal = document.createElement('div');
    modal.id = 'screenshot-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
        font-family: Arial, sans-serif;
    `;

    // Create modal container
    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background: white;
        border-radius: 12px;
        padding: 24px;
        max-width: 600px;
        width: 90%;
        max-height: 80vh;
        overflow-y: auto;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
    `;

    // Title
    const title = document.createElement('h2');
    title.textContent = 'Screenshot preview';
    title.style.cssText = `
        margin: 0 0 20px 0;
        color: #333;
        font-size: 20px;
        font-weight: 600;
    `;

    // Screenshot image
    const image = document.createElement('img');
    image.src = screenshotData;
    image.style.cssText = `
        width: 100%;
        max-width: 100%;
        height: auto;
        border-radius: 8px;
        margin-bottom: 20px;
        border: 1px solid #e0e0e0;
    `;

    // Container for control elements
    const controlsContainer = document.createElement('div');
    controlsContainer.style.cssText = `
        display: flex;
        flex-direction: column;
        gap: 16px;
    `;

    // Filename field
    const filenameContainer = document.createElement('div');
    filenameContainer.style.cssText = `
        display: flex;
        flex-direction: column;
        gap: 8px;
    `;

    const filenameLabel = document.createElement('label');
    filenameLabel.textContent = 'File name:';
    filenameLabel.style.cssText = `
        font-weight: 500;
        color: #555;
        font-size: 14px;
    `;

    const filenameInput = document.createElement('input');
    filenameInput.type = 'text';
    filenameInput.value = `screenshot_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}`;
    filenameInput.style.cssText = `
        padding: 12px;
        border: 2px solid #e0e0e0;
        border-radius: 8px;
        font-size: 14px;
        transition: border-color 0.3s;
    `;

    filenameInput.addEventListener('focus', () => {
        filenameInput.style.borderColor = '#4285f4';
    });

    filenameInput.addEventListener('blur', () => {
        filenameInput.style.borderColor = '#e0e0e0';
    });

    filenameContainer.appendChild(filenameLabel);
    filenameContainer.appendChild(filenameInput);

    // Create container for Google Docs elements (show only if authenticated)
    let docsContainer = null;
    let docsSelect = null;

    if (isAuthenticated) {
        console.log('User is authenticated, showing Google Docs options');

        // Dropdown list for selecting Google Docs document
        docsContainer = document.createElement('div');
        docsContainer.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 8px;
        `;

        const docsLabel = document.createElement('label');
        docsLabel.textContent = 'Select Google Docs document:';
        docsLabel.style.cssText = `
            font-weight: 500;
            color: #555;
            font-size: 14px;
        `;

        docsSelect = document.createElement('select');
        docsSelect.style.cssText = `
            padding: 12px;
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            font-size: 14px;
            transition: border-color 0.3s;
            background-color: white;
        `;

        // Option for creating new document
        const newDocOption = document.createElement('option');
        newDocOption.value = '';
        newDocOption.textContent = 'Create new document';
        docsSelect.appendChild(newDocOption);

        // Load documents list
        loadGoogleDocsList(docsSelect);

        docsContainer.appendChild(docsLabel);
        docsContainer.appendChild(docsSelect);
    } else {
        console.log('User is not authenticated, hiding Google Docs options');

        // Create informational message for unauthenticated users
        docsContainer = document.createElement('div');
        docsContainer.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 8px;
            text-align: center;
            padding: 16px;
            background: #f8f9fa;
            border-radius: 8px;
            margin: 8px 0;
        `;

        const infoMessage = document.createElement('p');
        infoMessage.textContent = 'Sign in to Google to save screenshots to Google Docs';
        infoMessage.style.cssText = `
            margin: 0;
            color: #6c757d;
            font-size: 14px;
        `;

        docsContainer.appendChild(infoMessage);
    }

    // Container for buttons
    const buttonsContainer = document.createElement('div');
    buttonsContainer.style.cssText = `
        display: flex;
        gap: 12px;
        justify-content: flex-end;
        margin-top: 20px;
    `;

    // "Download" button
    const downloadButton = document.createElement('button');
    downloadButton.textContent = 'Download';
    downloadButton.style.cssText = `
        padding: 12px 24px;
        background-color: #34a853;
        color: white;
        border: none;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: background-color 0.3s;
    `;

    downloadButton.addEventListener('mouseenter', () => {
        downloadButton.style.backgroundColor = '#2d8f47';
    });

    downloadButton.addEventListener('mouseleave', () => {
        downloadButton.style.backgroundColor = '#34a853';
    });

    downloadButton.addEventListener('click', () => {
        downloadScreenshot(screenshotData, filenameInput.value);
        closeModal(modal);
    });

    // "Save to Google Docs" button - show only if authenticated
    let saveToDocsButton = null;

    if (isAuthenticated) {
        saveToDocsButton = document.createElement('button');
        saveToDocsButton.textContent = 'Save to Google Docs';
        saveToDocsButton.style.cssText = `
            padding: 12px 24px;
            background-color: #4285f4;
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: background-color 0.3s;
        `;

        saveToDocsButton.addEventListener('mouseenter', () => {
            saveToDocsButton.style.backgroundColor = '#3367d6';
        });

        saveToDocsButton.addEventListener('mouseleave', () => {
            saveToDocsButton.style.backgroundColor = '#4285f4';
        });

        saveToDocsButton.addEventListener('click', () => {
            if (!docsSelect) {
                console.error('Google Docs select not available');
                return;
            }
            const selectedDocumentId = docsSelect.value;
            saveToGoogleDocs(screenshotData, filenameInput.value, selectedDocumentId, 'end');
            closeModal(modal);
        });
    }

    // "Cancel" button
    const cancelButton = document.createElement('button');
    cancelButton.textContent = 'Cancel';
    cancelButton.style.cssText = `
        padding: 12px 24px;
        background-color: #f1f3f4;
        color: #5f6368;
        border: none;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: background-color 0.3s;
    `;

    cancelButton.addEventListener('mouseenter', () => {
        cancelButton.style.backgroundColor = '#e8eaed';
    });

    cancelButton.addEventListener('mouseleave', () => {
        cancelButton.style.backgroundColor = '#f1f3f4';
    });

    cancelButton.addEventListener('click', () => {
        closeModal(modal);
    });

    // Assemble all elements
    buttonsContainer.appendChild(cancelButton);
    buttonsContainer.appendChild(downloadButton);

    // Add Google Docs button only if user is authenticated
    if (isAuthenticated && saveToDocsButton) {
        buttonsContainer.appendChild(saveToDocsButton);
    }

    controlsContainer.appendChild(filenameContainer);
    controlsContainer.appendChild(docsContainer);

    modalContent.appendChild(title);
    modalContent.appendChild(image);
    modalContent.appendChild(controlsContainer);
    modalContent.appendChild(buttonsContainer);

    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    // Close on click outside modal
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal(modal);
        }
    });

    // Close on Escape key
    document.addEventListener('keydown', function closeOnEscape(e) {
        if (e.key === 'Escape') {
            closeModal(modal);
            document.removeEventListener('keydown', closeOnEscape);
        }
    });

    // Focus on filename input field
    filenameInput.focus();
    filenameInput.select();
}

// Function to load Google Docs documents list
async function loadGoogleDocsList(selectElement) {
    try {
        // Check authentication before loading list
        const authResponse = await chrome.runtime.sendMessage({ action: 'checkAuthStatus' });
        if (!authResponse.authenticated) {
            console.log('User not authenticated, skipping documents list loading');
            return;
        }

        const response = await chrome.runtime.sendMessage({
            action: 'getGoogleDocsList'
        });

        if (response.success && response.documents) {
            // Get ID of last saved document
            const lastSavedDocId = await getLastSavedDocumentId();

            response.documents.forEach(doc => {
                const option = document.createElement('option');
                option.value = doc.documentId;
                option.textContent = doc.title || 'Untitled';
                selectElement.appendChild(option);

                // Select last saved document
                if (doc.documentId === lastSavedDocId) {
                    option.selected = true;
                }
            });

            // If last document not found in list, select "Create new document"
            if (lastSavedDocId && !response.documents.find(doc => doc.documentId === lastSavedDocId)) {
                selectElement.value = '';
            }
        } else {
            console.error('Error loading documents list:', response.error);
            // Add option with error message
            const errorOption = document.createElement('option');
            errorOption.value = '';
            errorOption.textContent = 'Error loading documents';
            errorOption.disabled = true;
            selectElement.appendChild(errorOption);
        }
    } catch (error) {
        console.error('Error getting documents list:', error);
        // Add option with error message
        const errorOption = document.createElement('option');
        errorOption.value = '';
        errorOption.textContent = 'Error loading documents';
        errorOption.disabled = true;
        selectElement.appendChild(errorOption);
    }
}

// Function to get ID of last saved document
async function getLastSavedDocumentId() {
    try {
        const result = await chrome.storage.local.get(['lastSavedDocumentId']);
        return result.lastSavedDocumentId || null;
    } catch (error) {
        console.error('Error getting last document ID:', error);
        return null;
    }
}

// Function to save ID of last used document
async function saveLastDocumentId(documentId) {
    try {
        await chrome.storage.local.set({ lastSavedDocumentId: documentId });
    } catch (error) {
        console.error('Error saving last document ID:', error);
    }
}

// Function to clear ID of last saved document
async function clearLastDocumentId() {
    try {
        await chrome.storage.local.remove(['lastSavedDocumentId']);
    } catch (error) {
        console.error('Error clearing last document ID:', error);
    }
}

// Function to download screenshot
function downloadScreenshot(screenshotData, filename) {
    try {
        // Input data validation
        validateImageSize(screenshotData);
        filename = validateFilename(filename);

        const link = document.createElement('a');
        link.href = screenshotData;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        console.log('Screenshot downloaded successfully:', filename);
    } catch (error) {
        console.error('Download error:', error);
        alert('Error downloading screenshot: ' + error.message);
    }
}

// Function to save to Google Docs
async function saveToGoogleDocs(screenshotData, filename, documentId, position) {
    try {
        // Input data validation
        if (!screenshotData || typeof screenshotData !== 'string') {
            throw new Error('Invalid screenshot data');
        }

        validateImageSize(screenshotData);
        filename = validateFilename(filename);

        if (documentId && !validateDocumentId(documentId)) {
            throw new Error('Invalid document ID format');
        }

        // Position validation
        const validPositions = ['start', 'end'];
        if (position && !validPositions.includes(position)) {
            position = 'end'; // default fallback
        }

        // Additional authentication check before saving
        const authResponse = await chrome.runtime.sendMessage({ action: 'checkAuthStatus' });
        if (!authResponse.authenticated) {
            console.error('User not authenticated, cannot save to Google Docs');
            alert('Please sign in to Google to save screenshots to Google Docs');
            return;
        }

        console.log('Saving to Google Docs, authenticated:', authResponse.authenticated);

        const response = await chrome.runtime.sendMessage({
            action: 'saveToGoogleDocs',
            screenshot: screenshotData,
            filename: filename,
            documentId: documentId,
            position: position
        });

        if (response.success) {
            // Save ID of used document (if it's not a new document)
            if (documentId) {
                await saveLastDocumentId(documentId);
            } else if (response.documentId) {
                // If new document was created, save its ID
                await saveLastDocumentId(response.documentId);
            }
            console.log('Successfully saved to Google Docs');
        } else {
            console.error('Error saving to Google Docs:', response.error);
            alert('Error saving to Google Docs: ' + response.error);
        }
    } catch (error) {
        console.error('Error saving to Google Docs:', error);
        alert('Error saving to Google Docs: ' + error.message);
    }
}

// Message handler from background script - always register
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Content script received message:', request.action);

    if (request.action === 'processScreenshot') {
        try {
            // Since createScreenshotModal is now async, handle it asynchronously
            createScreenshotModal(request.screenshot).then(() => {
                sendResponse({ success: true });
                console.log('Screenshot modal created successfully');
            }).catch((error) => {
                console.error('Error creating screenshot modal:', error);
                sendResponse({ success: false, error: error.message });
            });
        } catch (error) {
            console.error('Error creating screenshot modal:', error);
            sendResponse({ success: false, error: error.message });
        }
    }

    return true; // Asynchronous response
});

// Widget initialization on page load
function initializeWidget() {
    // Check that we're on a web page, not a special Chrome page
    if (window.location.protocol === 'chrome:' ||
        window.location.protocol === 'chrome-extension:' ||
        window.location.protocol === 'moz-extension:') {
        return;
    }

    // Widget no longer displays automatically, only through popup
}

// Initialization
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeWidget);
} else {
    initializeWidget();
}

// Hotkey handler moved to beginning of file