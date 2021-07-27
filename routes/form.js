var express = require("express");
var got = require("got");
var cheerio = require("cheerio");
var html = require("html");

const compose = (...fns) => (value) =>
  fns.reduce((sum, fn) => Promise.resolve(sum).then(fn), value);

async function request(url) {
  let response = await got(url);
  return response.body;
}

function loadDOM(response) {
  return cheerio.load(response);
}

function findGoogleFormData($) {
  let data = {
    isCollectingEmail: false,
    form: null,
  };
  let redundancy = "var FB_PUBLIC_LOAD_DATA_ = ";

  let isCollectingEmail = $(".freebirdFormviewerViewEmailCollectionField");
  data.isCollectingEmail = isCollectingEmail.length > 0 ? true : false;

  $("script").each((index, element) => {
    let inner = $(element).html();
    if (inner.indexOf(redundancy) !== -1) {
      inner = inner.replace(/[\n\r]*/g, "");
      data.form = inner.slice(redundancy.length, -1);
    }
  });

  return data;
}

function convertGoogleFormData(string) {
  if (!string) {
    throw new Error('Not a valid form');
  }

  let raw = JSON.parse(string.form);
  let data = { title: "", description: "", action: "", sections: [] };

  data.title = raw[3];
  data.description = raw[1][0];
  data.action = `https://docs.google.com/forms/u/0/d/${raw[14]}/formResponse`;

  let sections = raw[1][1];
  let section = { title: "", fields: [] };

  // if have email collecting, then add an email input to section first
  if (string.isCollectingEmail) {
    let temp = {
      label: "Email",
      description: "",
      type: 11,
      name: "emailAddress",
    };
    section.fields.push(temp);
  }

  sections.forEach((field) => {
    if (!field[4]) {
      data.sections.push(section);
      section = { title: field[1], fields: [] };
    }
    else if (field[3] === 7) { // check is choice grid
      let temp = {
        label: field[1],
        description: field[2] || "",
        type: field[3],
        columns: field[4][0][1], // get columns label from first child
        child: []
      };

      field[4].forEach(child => {
        temp.child.push({
          type: child[11][0],
          row: child[3][0],
          name: "entry." + child[0],
        });
      });

      section.fields.push(temp);
    }
    else {
      let temp = {
        label: field[1],
        description: field[2] || "",
        type: field[3],
        name: "entry." + field[4][0][0],
        options: field[4][0][1],
      };
      section.fields.push(temp);
    }
  });
  data.sections.push(section);

  return data;
}

var getGoogleFormData = compose(
  request,
  loadDOM,
  findGoogleFormData,
  convertGoogleFormData
);

function loadHTML($) {
  return $.html();
}

function tidyHTML(source) {
  return html.prettyPrint(source, { indent_size: 2 });
}

var getSource = compose(request, loadDOM, loadHTML, tidyHTML);

var router = express.Router();

router.get("/view", async (req, res, next) => {
  try {
    res.status(200).render("form", await getGoogleFormData(req.query.url));
  }
  catch (error) {
    res.status(404).send('Không tìm thấy');
  }
});

router.get("/download", async (req, res, next) => {
  res
    .status(200)
    .header("Content-Type", "text/html")
    .attachment("google-form-customize.html")
    .send(await getSource(req.query.url));
});

module.exports = router;
