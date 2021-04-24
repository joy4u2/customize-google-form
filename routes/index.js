var express = require('express');
var got = require('got');
var cheerio = require('cheerio');
var html = require('html');

var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

/* GET result */
router.get('/download', async function(req, res, next) {
  let port = process.env.PORT || '3000';

  let { id, bootstrap, submitText } = req.query;
  let url = 'http://localhost:' + port;
  let query = `?id=${id}&submitText=${submitText}`;

  url += ((bootstrap === 'on') ? '/form-bootstrap' : '/form') + query;

  let raw = getPage(await getPageBody(url));
  let data = html.prettyPrint(raw, { indent_size: 2 });

  res.header('Content-Type', 'text/html');
  res.attachment('google-form-customize.html');
  res.send(data);
});

/* GET form without bootstrap */
router.get('/form', async function (req, res, next) {
  let url = `https://docs.google.com/forms/d/e/${req.query.id}/viewform?usp=sf_link`;

  let formData = getGoogleFormData(await getPageBody(url));
  let data = {
    title: formData.formTitle,
    data: formData,
    submitText: req.query['submitText']
  }

  res.render('form', data);
});

/* GET form with bootstrap page */
router.get('/form-bootstrap', async function (req, res, next) {
  let url = `https://docs.google.com/forms/d/e/${req.query.id}/viewform?usp=sf_link`;

  let formData = getGoogleFormData(await getPageBody(url));
  let data = {
    title: formData.formTitle,
    data: formData,
    submitText: req.query['submitText']
  }

  res.render('form-bootstrap', data);
});

/* get html body */
async function getPageBody(url) {
  let response = await got(url);
  return response.body;
}

/* get GoogleFormData */
function getGoogleFormData(html) {
  let $ = cheerio.load(html);
  let data = { formTitle: '', formAction: null, dataParams: [] };

  data.formTitle = $('.freebirdFormviewerViewHeaderTitle').text()

  data.formAction = $('form')[0].attribs.action;

  $('.m2').each(function (index, element) {
    if ('data-params' in element.attribs) {
      let raw = element.attribs['data-params'];
      raw = raw.replace(/%.@./, '');
      raw = raw.replace(/\],[a-zA-Z0-9\"\,]*\]/, ']');
      raw = JSON.parse(raw);

      let temporary = {
        name: 'entry.' + raw[4][0][0],
        label: raw[1],
        type: raw[3],
        childs: raw[4][0][1]
      }

      data.dataParams.push(temporary);
    }
  });

  return data;
}

function getPage(html) {
  let $ = cheerio.load(html);
  return $.html();
}

module.exports = router;
