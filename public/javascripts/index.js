/* $('input[name=id]').change(function() {
  let url = this.value;
  let parts = url.split('/');

  this.value = parts[parts.length - 2];
}); */

$("#form-input").submit(function (event) {
  event.preventDefault(); 

  let url = $('#id').val();
  let urlParts = url.split('/');

  let id = urlParts[urlParts.length - 2];
  let bootstrap = $('#bootstrap').prop('checked');
  let submitText = $('#submit-text').val();

  let downloadLink = '';
  let query = '';
  query = downloadLink = 'http://' + window.location.host;

  if (bootstrap) {
    query += `/form-bootstrap?id=${id}&submitText=${submitText}`;
  } else {
    query += `/form?id=${id}&submitText=${submitText}`;
  }

  downloadLink += `/download?id=${id}&submitText=${submitText}&bootstrap=${bootstrap ? 'on' : 'off'}`;

  $('#download').attr('href', downloadLink);

  $('#result').val(`<iframe src="${query}" width="640" height="752" frameborder="0" marginheight="0" marginwidth="0">Loading…</iframe>`);

  $('#frame-result').attr('src', query);
});
