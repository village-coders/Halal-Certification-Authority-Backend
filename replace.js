const fs = require('fs');
const path = require('path');

function replaceInFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    content = content.replace(/>Branch</g, '>Manufacturing Facility<');
    content = content.replace(/>Branches</g, '>Manufacturing Facilities<');
    content = content.replace(/>Branch:/g, '>Manufacturing Facility:<');
    content = content.replace(/>\s*Branch\s*</g, '>Manufacturing Facility<');
    content = content.replace(/"Branch"/g, '"Manufacturing Facility"');
    content = content.replace(/"Branches"/g, '"Manufacturing Facilities"');
    content = content.replace(/'Branch'/g, "'Manufacturing Facility'");
    content = content.replace(/'Branches'/g, "'Manufacturing Facilities'");
    content = content.replace(/BRANCHES/g, 'MANUFACTURING FACILITIES');
    content = content.replace(/CREATE BRANCH/g, 'CREATE MANUFACTURING FACILITY');
    content = content.replace(/Go to Branches/g, 'Go to Manufacturing Facilities');
    content = content.replace(/Create a Branch/g, 'Create a Manufacturing Facility');
    content = content.replace(/Branch Name/g, 'Manufacturing Facility Name');
    content = content.replace(/Branch Contact/g, 'Manufacturing Facility Contact');
    content = content.replace(/Branch Address/g, 'Manufacturing Facility Address');
    content = content.replace(/Branch Information/g, 'Manufacturing Facility Information');
    content = content.replace(/register at least one branch/g, 'register at least one manufacturing facility');

    if (content !== original) {
        fs.writeFileSync(filePath, content);
        console.log('Updated', filePath);
    }
}

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

const dirs = [
    'c:\\\\Users\\\\awwal\\\\Documents\\\\Halal Certification Authority\\\\hca-frontend\\\\src',
    'c:\\\\Users\\\\awwal\\\\Documents\\\\Halal Certification Authority\\\\hca-admin\\\\src'
];

dirs.forEach(dir => {
    walkDir(dir, filePath => {
        if (filePath.endsWith('.jsx') || filePath.endsWith('.js')) {
            replaceInFile(filePath);
        }
    });
});
