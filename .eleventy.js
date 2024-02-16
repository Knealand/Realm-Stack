module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy({
    "global.out.css": "global.css",
  });
  return {
    passthroughFileCopy: true,
    dir: {
      input: "src",
      includes: "_includes",
      data: "_data",
      output: "_site",
    },
  };
};