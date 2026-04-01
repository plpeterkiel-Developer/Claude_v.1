(function () {
  'use strict';

  var form = document.getElementById('contact-form');
  if (!form) return;

  var submitBtn = document.getElementById('submit-btn');
  var statusEl = document.getElementById('form-status');

  function getTranslation(key) {
    if (window.MKi18n) {
      var lang = document.documentElement.lang || 'da';
      var dict = window.MKi18n.translations[lang];
      if (dict && dict[key]) return dict[key];
    }
    return null;
  }

  function showError(field, msgKey) {
    var group = field.closest('.form-group');
    if (!group) return;
    group.classList.add('has-error');
    var errorEl = group.querySelector('.error-msg');
    if (errorEl) {
      var msg = getTranslation(msgKey);
      if (msg) errorEl.textContent = msg;
    }
  }

  function clearErrors() {
    form.querySelectorAll('.form-group').forEach(function (g) {
      g.classList.remove('has-error');
    });
    statusEl.className = 'form-status';
    statusEl.textContent = '';
  }

  function validate() {
    clearErrors();
    var valid = true;

    var name = form.querySelector('#name');
    if (!name.value.trim()) {
      showError(name, 'contact.form.required');
      valid = false;
    }

    var email = form.querySelector('#email');
    var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.value.trim() || !emailPattern.test(email.value.trim())) {
      showError(email, 'contact.form.emailInvalid');
      valid = false;
    }

    var message = form.querySelector('#message');
    if (!message.value.trim()) {
      showError(message, 'contact.form.required');
      valid = false;
    }

    return valid;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!validate()) return;

    // Disable submit button
    submitBtn.disabled = true;
    var sendingText = getTranslation('contact.form.sending') || 'Sender...';
    submitBtn.textContent = sendingText;

    var formData = new FormData(form);

    fetch(form.action, {
      method: 'POST',
      body: formData,
      headers: { 'Accept': 'application/json' }
    })
      .then(function (response) {
        if (response.ok) {
          var successMsg = getTranslation('contact.form.success') || 'Tak for din besked!';
          statusEl.className = 'form-status success';
          statusEl.textContent = successMsg;
          form.reset();
        } else {
          throw new Error('Form submission failed');
        }
      })
      .catch(function () {
        var errorMsg = getTranslation('contact.form.error') || 'Der opstod en fejl.';
        statusEl.className = 'form-status error';
        statusEl.textContent = errorMsg;
      })
      .finally(function () {
        submitBtn.disabled = false;
        var submitText = getTranslation('contact.form.submit') || 'Send besked';
        submitBtn.textContent = submitText;
      });
  });
})();
