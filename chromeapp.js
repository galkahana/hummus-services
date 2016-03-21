'use-strict';


var theChromeApp;

switch (process.platform) {
    case 'darwin':
        theChromeApp =  'google chrome';
        break;
    case 'win32':
        theChromeApp =  'chrome';
        break;
    default:
        theChromeApp = 'google-chrome'; // linux
        break;
}

module.exports = theChromeApp;