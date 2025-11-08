/**
 * Browser-compatible dictionary loader
 * Loads dictionary files using fetch instead of Node.js fs
 */

function loadDictionary() {
    return new Promise(function(resolve, reject) {
        // Get the extension's runtime URL helper
        var getURL = null;
        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL) {
            getURL = chrome.runtime.getURL;
        } else if (typeof browser !== 'undefined' && browser.runtime && browser.runtime.getURL) {
            getURL = browser.runtime.getURL;
        } else {
            reject(new Error('Chrome extension runtime API not available'));
            return;
        }
        
        // Get full URLs for dictionary files
        var affUrl = getURL('dictionary-en/index.aff');
        var dicUrl = getURL('dictionary-en/index.dic');
        
        console.log('Loading dictionary from:', affUrl, dicUrl);
        
        // Load both dictionary files in parallel as text (UTF-8)
        // nspell accepts strings or UTF-8 buffers
        Promise.all([
            fetch(affUrl).then(function(res) {
                if (!res.ok) {
                    throw new Error('Failed to load aff file: ' + res.status + ' ' + res.statusText);
                }
                return res.text();
            }),
            fetch(dicUrl).then(function(res) {
                if (!res.ok) {
                    throw new Error('Failed to load dic file: ' + res.status + ' ' + res.statusText);
                }
                return res.text();
            })
        ]).then(function(results) {
            console.log('Dictionary files loaded successfully');
            console.log('Aff file size:', results[0].length, 'chars');
            console.log('Dic file size:', results[1].length, 'chars');
            console.log('Aff file preview (first 200 chars):', results[0].substring(0, 200));
            resolve({
                aff: results[0],
                dic: results[1]
            });
        }).catch(function(error) {
            console.error('Failed to load dictionary files:', error);
            console.error('Aff URL:', affUrl);
            console.error('Dic URL:', dicUrl);
            reject(error);
        });
    });
}

module.exports = loadDictionary;

