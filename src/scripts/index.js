const fs = require('fs-extra');
const path = require('path');
const matter = require('gray-matter');
const MarkdownIt = require('markdown-it');
const md = new MarkdownIt();
let filePathMap = new Map();

const rawDir = path.join(__dirname, 'raw'); // Directory with raw Obsidian markdown files
const outputDir = path.join(__dirname, 'src'); // Output directory for Eleventy-compatible files

// Ensure the output directory exists
fs.ensureDirSync(outputDir);

// Function to recursively process files in a directory
async function processDirectory(directory) {
  const items = await fs.readdir(directory, { withFileTypes: true });
  for (const item of items) {
    const absolutePath = path.join(directory, item.name);
    if (item.isDirectory()) {
      await processDirectory(absolutePath); // Recurse into subdirectories
    } else if (item.isFile() && path.extname(item.name) === '.md') {
      await processFile(absolutePath, item.name);
    }
  }
}


async function buildFilePathMap(directory) {
    const entries = await fs.readdir(directory, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(directory, entry.name);
        if (entry.isDirectory()) {
            await buildFilePathMap(fullPath); // Recursively process subdirectories
        } else if (entry.isFile() && path.extname(entry.name) === '.md') {
            // Use a web-safe name as the key and store the relative path as the value
            const webSafeName = toWebSafeName(entry.name.replace('.md', ''));
            const webSafePath = toWebSafeName(fullPath.replace(/^.*?\/raw\//, ''));
            filePathMap.set(webSafeName, webSafePath);
        }
    }
}

// Function to process each Markdown file
async function processFile(filePath, fileName) {
    try {
      const data = await fs.readFile(filePath, 'utf8');
      const parsed = matter(data);
  
      // Correctly calculate the current folder path
      const currentFolderPath = path.dirname(filePath); // Make sure this line is correctly placed before the call
  
      // Now pass currentFolderPath correctly to convertMarkdownContent
      parsed.content = convertMarkdownContent(parsed.content, currentFolderPath);
  
      //check title and set to file name.
      if(!parsed.data.title){
        const title = path.basename(fileName, path.extname(fileName));
        parsed.data.title = title;
      }
      
      const folderName = path.basename(currentFolderPath);
      if (Array.isArray(parsed.data.tags)) {
        if (!parsed.data.tags.includes(folderName)) {
          parsed.data.tags.push(folderName);
        }
      } else if (parsed.data.tags) {
        parsed.data.tags = [parsed.data.tags, folderName];
      } else {
        parsed.data.tags = [folderName];
      }

      
  
      const relativeDirPath = path.relative(path.join(__dirname, 'raw'), currentFolderPath);
      const outputFilePath = path.join(__dirname, 'src', relativeDirPath, fileName);
      await fs.ensureDir(path.dirname(outputFilePath));
      const output = matter.stringify(parsed.content, parsed.data);
      await fs.writeFile(outputFilePath, output);
  
      console.log(`${fileName} was successfully processed and saved to ${outputFilePath}`);
    } catch (err) {
      console.error(`An error occurred while processing ${fileName}:`, err);
    }
  }

  function convertMarkdownContent(content) {
    content = content.replace(/!?\[\[([^\]]+)\]\]/g, (match, p1) => {
        const [linkText, displayText] = p1.split("|");
        const webSafeName = toWebSafeName(linkText);

        // Determine if the wikilink is for an image
        const isImageLink = match.startsWith("!");
        
        if (isImageLink) {
            // Construct an <img> tag
            const imagePath = filePathMap.get(webSafeName) || webSafeName;
            // Ensure imagePath includes the parent folder
            const src = `images/${imagePath}`; // Adjust based on how filePathMap stores paths
            const altText = displayText || linkText.replace(/\.(jpg|jpeg|png|gif|svg)$/i, '');
            return `<img src="${src}" alt="${altText}">`;
        } else {
            // Handle non-image links (similar logic as before)
            const relativePath = filePathMap.get(webSafeName);
            if (relativePath) {
                const href = `/${relativePath}`;
                const linkDisplay = displayText || linkText;
                return `<a href="${href}">${linkDisplay}</a>`;
            } else {
                console.warn(`Warning: Unable to resolve path for wikilink '${linkText}'`);
                return match; // Return the original wikilink or some placeholder
            }
        }
    });

    return content;
}



function toWebSafeName(name) {
    return name.replace(/\s+/g, '-').toLowerCase();
  }

// Start processing
buildFilePathMap(rawDir);
console.log(filePathMap);
processDirectory(rawDir).then(() => {
  console.log('All files have been processed.');
}).catch(err => {
  console.error("An error occurred:", err);
});
