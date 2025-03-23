const pdf = require("pdf-poppler");
const path = require("path");

let file = "TopCV.pdf";

let opts = {
  format: "jpeg",
  out_dir: path.dirname(file),
  out_prefix: "page",
};

pdf
  .convert(file, opts)
  .then((res) => {
    console.log("Successfully converted");
  })
  .catch((error) => {
    console.error(error);
  });