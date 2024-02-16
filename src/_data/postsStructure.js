const fs = require('fs');
const path = require('path');

function readDirectoryRecursively(dir, basePath = '/') {
  const result = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  entries.forEach(entry => {
    if (entry.isDirectory()) {
      const subdirPath = path.join(dir, entry.name);
      result.push({
        type: 'directory',
        name: entry.name,
        path: path.join(basePath, entry.name),
        children: readDirectoryRecursively(subdirPath, path.join(basePath, entry.name))
      });
    } else if (entry.name.endsWith('.md')) {
      result.push({
        type: 'file',
        name: entry.name,
        path: path.join(basePath, entry.name.replace('.md', '.html')), // Convert .md to .html
      });
    }
  });

  return result;
}

module.exports = () => {
  //const postsDir = path.join(__dirname, '..', '..', 'posts');
  //return readDirectoryRecursively(postsDir);
  return readDirectoryRecursively('../posts');
};