const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else { 
            if (file.endsWith('.tsx') || file.endsWith('.ts')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = [...walk(path.join(__dirname, 'app')), ...walk(path.join(__dirname, 'src'))];

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;
    
    content = content.replace(/https:\/\/api\.happylokam\.com\/api\/v1/g, 'http://10.0.2.2:5000/api/v1');
    content = content.replace(/https:\/\/happylokam\.com\/api\/v1/g, 'http://10.0.2.2:5000/api/v1');

    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        console.log('Updated', file);
    }
});
