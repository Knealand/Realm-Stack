const fs = require('fs');
const path = require('path');
const postsStructure = require('../_data/postsStructure')();

// Directory where the generated category pages will be saved
const pagesDir = path.join('..', 'posts');

// Function to generate a category page
function generateCategoryPage(category, items, basePath = pagesDir) {
    const categoryName = category.name;
    const categoryPath = path.join(basePath, categoryName);
    // Content of the category page
    const content = `---
layout: /layout/categoryTemplate.njk
title: "${categoryName}"
items:
${items.map(item => `  - type: "${item.type}"\n    name: "${item.name}"\n    path: "${item.path}"`).join('\n')}
---
`;

    // Write the content to an index.njk file in the category directory
    fs.writeFileSync(path.join(categoryPath, 'index.njk'), content, 'utf-8');

    // Recursively generate pages for subdirectories
    items.filter(item => item.type === 'directory').forEach(subcategory => {
        generateCategoryPage(subcategory, subcategory.children, path.join(basePath, categoryName));
    });
}

// Generate category pages for each top-level category
postsStructure.forEach(category => {
    if (category.type === 'directory') {
        generateCategoryPage(category, category.children);
    }
});

console.log('Category pages generated successfully.');
