// JavaScript for popup window

document.addEventListener('DOMContentLoaded', async function() {
    const body = document.body;

    // Remove Google auth section if exists
    const googleAuthDiv = document.querySelector('.google-auth');
    if (googleAuthDiv) {
        googleAuthDiv.style.display = 'none';
    }

    // Show all sections immediately (without auth check)
    body.classList.add('signed-in');

    // Get elements
    const signInBtn = document.getElementById('google-signin');
    const takeScreenshotBtn = document.createElement('button');
    const infoText = document.querySelector('.info-text');

    // Create status display element
    const statusDiv = document.createElement('div');
    statusDiv.className = 'status';
    statusDiv.style.display = 'none';
    statusDiv.style.textAlign = 'center';
    statusDiv.style.padding = '8px 12px';
    statusDiv.style.margin = '8px 0';
    statusDiv.style.borderRadius = '8px';
    statusDiv.style.fontSize = '13px';

    // Create logout button
    const signOutBtn = document.createElement('button');
    signOutBtn.textContent = 'Log out';
    signOutBtn.className = 'google-btn logout-btn';
    signOutBtn.style.background = '#dc3545';
    signOutBtn.style.marginTop = '8px';
    signOutBtn.style.marginBottom = '16px';
    signOutBtn.style.display = 'none';

    // Screenshot button setup
    takeScreenshotBtn.textContent = '📸 Take screenshot';
    takeScreenshotBtn.className = 'google-btn screenshot-btn';

    // Handler for screenshot button
    takeScreenshotBtn.addEventListener('click', async() => {
        try {
            const response = await chrome.runtime.sendMessage({ action: 'takeScreenshot' });
            window.close();
        } catch (error) {
            console.error('Error creating screenshot:', error);
            alert('Error creating screenshot: ' + error.message);
        }
    });

    // Handler for logout button
    signOutBtn.addEventListener('click', async() => {
        try {

            signOutBtn.textContent = 'Signing out...';
            signOutBtn.disabled = true;
            showStatus('Signing out from Google...');

            // Check current authentication status
            const authStatus = await chrome.runtime.sendMessage({ action: 'checkAuthStatus' });


            const response = await chrome.runtime.sendMessage({ action: 'signOutFromGoogle' });


            if (response.success) {
                // Additional local storage cleanup in popup
                try {
                    await chrome.storage.local.set({ isGoogleAuthenticated: false });
                    await chrome.storage.local.remove(['lastSavedDocumentId']);

                } catch (error) {
                    console.error('Error clearing storage in popup:', error);
                }

                // Check status after logout
                const newAuthStatus = await chrome.runtime.sendMessage({ action: 'checkAuthStatus' });


                showStatus('Successfully signed out from Google!', false);
                updateUI(false);

                setTimeout(() => {
                    hideStatus();
                }, 2000);
            } else {
                throw new Error(response.error || 'Unknown error');
            }
        } catch (error) {
            console.error('Sign out error:', error);

            // In case of error, forcibly set local state
            try {
                await chrome.storage.local.set({
                    isGoogleAuthenticated: false,
                    hasLoggedOut: true
                });

                updateUI(false);
                showStatus('Logged out locally (emergency mode)', false);

                setTimeout(() => {
                    hideStatus();
                }, 2000);
            } catch (emergencyError) {
                console.error('Emergency logout failed:', emergencyError);
                showStatus('Sign out error: ' + error.message, true);

                signOutBtn.textContent = '🚪 Log out from Google';
                signOutBtn.disabled = false;

                setTimeout(() => {
                    hideStatus();
                }, 5000);
            }
        }
    });

    // Function to show status
    function showStatus(message, isError = false) {
        statusDiv.textContent = message;
        statusDiv.style.display = 'block';
        statusDiv.style.background = isError ? '#f8d7da' : '#d4edda';
        statusDiv.style.color = isError ? '#721c24' : '#155724';
    }

    // Function to hide status
    function hideStatus() {
        statusDiv.style.display = 'none';
    }

    // Function to update UI based on authentication status
    function updateUI(isAuthenticated) {
        if (isAuthenticated) {
            let authRow = document.querySelector('.auth-row');
            if (!authRow) {
                authRow = document.createElement('div');
                authRow.className = 'auth-row';
                signInBtn.parentNode.insertBefore(authRow, signInBtn.nextSibling);
            } else {
                authRow.innerHTML = '';
            }
            // Insert button inside statusDiv
            statusDiv.innerHTML = '';
            const statusText = document.createElement('span');
            statusText.textContent = 'Now you can save screenshots to Google Docs.';
            statusDiv.appendChild(statusText);
            statusDiv.appendChild(signOutBtn);
            authRow.appendChild(statusDiv);
            statusDiv.style.display = 'flex';
            signOutBtn.style.display = 'flex';
            if (infoText) {
                infoText.style.display = 'none';
            }
            signInBtn.style.display = 'none';
        } else {
            let authRow = document.querySelector('.auth-row');
            if (authRow) authRow.remove();
            signInBtn.textContent = '🔐 Sign in with Google';
            signInBtn.style.background = '#4285f4';
            signInBtn.disabled = false;
            signInBtn.style.display = 'block';
            signOutBtn.style.display = 'none';
            if (infoText) {
                infoText.style.display = 'block';
            }
            hideStatus();
        }
    }

    // Function to check authentication status
    async function checkAuthStatus() {
        try {


            // Check local state
            const localState = await chrome.storage.local.get(['isGoogleAuthenticated']);


            // Check through background script
            const response = await chrome.runtime.sendMessage({ action: 'checkAuthStatus' });


            updateUI(response.authenticated);
        } catch (error) {
            console.error('Auth status check error:', error);
            updateUI(false);
        }
    }

    // Handler for Google sign-in button
    if (signInBtn) {
        signInBtn.addEventListener('click', async() => {
            try {
                signInBtn.textContent = 'Signing in...';
                signInBtn.disabled = true;
                showStatus('Signing in to Google...');
                const response = await chrome.runtime.sendMessage({ action: 'signInToGoogle' });
                if (response.success) {
                    showStatus('Successfully signed in to Google!', false);
                    updateUI(true);
                    setTimeout(() => {
                        hideStatus();
                    }, 2000);
                } else {
                    throw new Error(response.error || 'Unknown error');
                }
            } catch (error) {
                console.error('Sign in error:', error);
                showStatus('Sign in error: ' + error.message, true);
                updateUI(false);
                signInBtn.textContent = '🔐 Sign in with Google';
                signInBtn.disabled = false;
                setTimeout(() => {
                    hideStatus();
                }, 5000);
            }
        });
    }

    // Add elements to DOM
    if (signInBtn) {
        signInBtn.parentNode.insertBefore(statusDiv, signInBtn.nextSibling);
        signInBtn.parentNode.insertBefore(signOutBtn, statusDiv.nextSibling);
        // Add screenshot button after logout button (and status)
        signInBtn.parentNode.insertBefore(takeScreenshotBtn, signOutBtn.nextSibling);
    }

    // Check authentication status on load
    await checkAuthStatus();

    // Informational text
    if (infoText) {
        infoText.textContent = 'If you want to save screenshots to Google Docs, please sign in to your Google account';
    }
});