// google-docs-api.js

const googleDocsAPI = {
    /**
     * Gets the list of user's Google Docs documents.
     * @param {string} token - OAuth 2.0 token.
     * @returns {Promise<Array>} - Array of documents.
     */
    async getDocumentsList(token) {
        // Use Google Drive API to get documents list
        // Add trashed=false to exclude deleted files
        const response = await fetch('https://www.googleapis.com/drive/v3/files?q=mimeType%3D%27application%2Fvnd.google-apps.document%27%20and%20trashed%3Dfalse&orderBy=modifiedTime%20desc&pageSize=50', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`Google Drive API error (getDocumentsList): ${error.error.message}`);
        }

        const data = await response.json();

        // Transform Drive data to format compatible with our code
        // Additionally filter deleted files in case they still get into response
        const allFiles = data.files || [];
        const activeFiles = allFiles.filter(file => !file.trashed);

        const documents = activeFiles.map(file => ({
            documentId: file.id,
            title: file.name,
            modifiedTime: file.modifiedTime
        }));

        return documents;
    },

    /**
     * Creates a new Google Docs document.
     * @param {string} token - OAuth 2.0 token.
     * @param {string} title - Document title.
     * @returns {Promise<Object>} - Created document object.
     */
    async createDocument(token, title) {
        const response = await fetch('https://docs.googleapis.com/v1/documents', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                title: title,
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`Google Docs API error (createDocument): ${error.error.message}`);
        }
        return await response.json();
    },

    /**
     * Uploads image to Google Drive.
     * @param {string} token - OAuth 2.0 token.
     * @param {string} imageDataUri - Screenshot in Data URI format.
     * @param {string} filename - Filename.
     * @returns {Promise<Object>} - File object from Google Drive.
     */
    async uploadImageToDrive(token, imageDataUri, filename) {
        function dataURItoBlob(dataURI) {
            const byteString = atob(dataURI.split(',')[1]);
            const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
            const ab = new ArrayBuffer(byteString.length);
            const ia = new Uint8Array(ab);
            for (let i = 0; i < byteString.length; i++) {
                ia[i] = byteString.charCodeAt(i);
            }
            return new Blob([ab], { type: mimeString });
        }

        const blob = dataURItoBlob(imageDataUri);
        const metadata = { name: filename, mimeType: 'image/png' };

        const form = new FormData();
        form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
        form.append('file', blob);

        const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
            body: form,
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`Google Drive API error (upload): ${error.error.message}`);
        }
        return await response.json();
    },

    /**
     * Makes file in Google Drive publicly readable.
     * @param {string} token - OAuth 2.0 token.
     * @param {string} fileId - File ID in Google Drive.
     * @returns {Promise<void>}
     */
    async makeFilePublic(token, fileId) {
        const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                role: 'reader',
                type: 'anyone',
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`Google Drive API error (permissions): ${error.error.message}`);
        }
    },

    /**
     * Deletes file from Google Drive.
     * @param {string} token - OAuth 2.0 token.
     * @param {string} fileId - File ID in Google Drive.
     * @returns {Promise<void>}
     */
    async deleteFileFromDrive(token, fileId) {
        const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`Google Drive API error (delete): ${error.error.message}`);
        }
    },

    /**
     * Gets Google Docs document information.
     * @param {string} token - OAuth 2.0 token.
     * @param {string} documentId - Document ID.
     * @returns {Promise<Object>} - Document information.
     */
    async getDocumentInfo(token, documentId) {
        const response = await fetch(`https://docs.googleapis.com/v1/documents/${documentId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`Google Docs API error (getDocumentInfo): ${error.error.message}`);
        }

        return await response.json();
    },

    /**
     * Inserts image into Google Docs document by URL.
     * @param {string} token - OAuth 2.0 token.
     * @param {string} documentId - Document ID.
     * @param {string} imageUrl - Image URL.
     * @param {string} position - Insert position: 'start' or 'end'.
     * @param {number} headerOffset - Header offset (if header was added).
     * @returns {Promise<Object>} - Operation result.
     */
    async insertImage(token, documentId, imageUrl, position = 'start', headerOffset = 0) {
        // Get document information to determine correct index
        const documentInfo = await this.getDocumentInfo(token, documentId);
        const content = documentInfo.body.content;

        let insertIndex = 1; // Default to beginning

        if (position === 'start') {
            // Insert at beginning with header offset consideration
            insertIndex = 1 + headerOffset;
        } else if (position === 'end') {
            // Insert at end of document
            if (content.length === 0) {
                insertIndex = 1;
            } else {
                // endIndex of last element - 1 (otherwise error)
                const last = content[content.length - 1];
                insertIndex = Math.max(1, (last.endIndex || 1) - 1);
            }
        }

        // Check that index doesn't exceed document size
        const documentEndIndex = content.length > 0 ? content[content.length - 1].endIndex : 1;
        if (insertIndex >= documentEndIndex) {
            insertIndex = Math.max(1, documentEndIndex - 1);
        }

        const requests = [{
            insertInlineImage: {
                location: {
                    index: insertIndex,
                },
                uri: imageUrl,
                objectSize: {
                    width: {
                        magnitude: 480, // Image width in document
                        unit: 'PT',
                    },
                },
            },
        }, ];

        const response = await fetch(`https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                requests: requests,
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`Google Docs API error (insertImage): ${error.error.message}`);
        }
        return await response.json();
    },

    /**
     * Returns URL for editing document.
     * @param {string} documentId - Document ID.
     * @returns {string} - Document URL.
     */
    getDocumentUrl(documentId) {
        return `https://docs.google.com/document/d/${documentId}/edit`;
    },

    /**
     * Inserts header at beginning of Google Docs document.
     * @param {string} token - OAuth 2.0 token.
     * @param {string} documentId - Document ID.
     * @param {string} title - Document title.
     * @returns {Promise<Object>} - Operation result.
     */
    async insertHeader(token, documentId, title) {
        const requests = [{
            insertText: {
                location: {
                    index: 1,
                },
                text: '\n', // Add top offset
            },
        }, {
            insertText: {
                location: {
                    index: 2,
                },
                text: title,
            },
        }, {
            updateParagraphStyle: {
                range: {
                    startIndex: 2,
                    endIndex: title.length + 2,
                },
                paragraphStyle: {
                    namedStyleType: 'HEADING_1',
                },
                fields: 'namedStyleType',
            },
        }, {
            insertText: {
                location: {
                    index: title.length + 2,
                },
                text: '\n\n',
            },
        }];

        const response = await fetch(`https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                requests: requests,
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`Google Docs API error (insertHeader): ${error.error.message}`);
        }
        return await response.json();
    },

    /**
     * Checks if document is empty.
     * @param {string} token - OAuth 2.0 token.
     * @param {string} documentId - Document ID.
     * @returns {Promise<boolean>} - true if document is empty.
     */
    async isDocumentEmpty(token, documentId) {
        const documentInfo = await this.getDocumentInfo(token, documentId);
        const content = documentInfo.body.content;

        // Document is considered empty if it has no content or only empty paragraphs
        if (content.length === 0) {
            return true;
        }

        // Check if document has text (excluding empty paragraphs)
        for (const element of content) {
            if (element.paragraph && element.paragraph.elements) {
                for (const textElement of element.paragraph.elements) {
                    if (textElement.textRun && textElement.textRun.content.trim() !== '') {
                        return false;
                    }
                }
            }
        }

        return true;
    },
};