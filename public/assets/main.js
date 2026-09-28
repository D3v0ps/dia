/* Dia Konsult & Rekrytering – meny, stödkalkylator och kontaktformulär. */
(function () {
  'use strict';

  var PHONE_DISPLAY = '076\u00a0568\u00a060\u00a018';

  // Tusentalsavgränsning med hårt mellanslag så att belopp aldrig bryts över två rader.
  function kr(n) {
    return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  }

  /* ---------- Meny (mobil) ---------- */

  var header = document.querySelector('.site-header');
  var toggle = header && header.querySelector('.menu-toggle');
  var nav = document.getElementById('huvudmeny');

  if (header && toggle && nav) {
    var setMenuOpen = function (open) {
      header.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', String(open));
    };

    toggle.addEventListener('click', function () {
      setMenuOpen(toggle.getAttribute('aria-expanded') !== 'true');
    });

    nav.addEventListener('click', function (event) {
      if (event.target.closest('a')) setMenuOpen(false);
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && header.classList.contains('is-open')) {
        setMenuOpen(false);
        toggle.focus();
      }
    });

    document.addEventListener('click', function (event) {
      if (header.classList.contains('is-open') && !header.contains(event.target)) setMenuOpen(false);
    });

    window.matchMedia('(min-width: 1024px)').addEventListener('change', function (event) {
      if (event.matches) setMenuOpen(false);
    });
  }

  /* ---------- Stödkalkylator ---------- */

  var AVGIFT = 0.3142; // arbetsgivaravgift
  var LONETAK = 20000; // stödet räknas på lön upp till 20 000 kr/mån
  var NIVA_TEXT = {
    '1': '20–24 år: 6 mån–2 år utan arbete. 25+: 1–2 år.',
    '2': '2–3 år utan arbete.',
    '2.5': 'Över 3 år utan arbete, nyanländ eller etableringsprogrammet.'
  };

  var calc = document.getElementById('stodkalkylator');

  if (calc) {
    var lonInput = calc.querySelector('#lon');
    var announcer = calc.querySelector('[data-announce]');
    var announceTimer;

    var setOut = function (name, text) {
      calc.querySelectorAll('[data-out="' + name + '"]').forEach(function (el) {
        el.textContent = text;
      });
    };

    var updateCalc = function () {
      var lon = Number(lonInput.value);
      var niva = calc.querySelector('input[name="niva"]:checked').value;
      var ar = calc.querySelector('input[name="alder"]:checked').value === '20-24' ? 1 : 2;

      var perMan = Math.round(Math.min(lon, LONETAK) * AVGIFT * Number(niva));
      var perAr = perMan * 12;
      var kost = Math.round(lon * (1 + AVGIFT));

      setOut('lon', kr(lon) + ' kr');
      setOut('nivaText', NIVA_TEXT[niva] || '');
      setOut('perMan', kr(perMan) + ' kr');
      setOut('perAr', kr(perAr) + ' kr');
      setOut('total', kr(perAr * ar) + ' kr');
      setOut('period', ar === 1 ? 'ett år' : 'två år');
      setOut('kost', kr(kost));
      setOut('netto', kr(kost - perMan));
      lonInput.setAttribute('aria-valuetext', kr(lon) + ' kronor');

      // Läs upp resultatet för skärmläsare först när användaren slutat ändra.
      clearTimeout(announceTimer);
      announceTimer = setTimeout(function () {
        announcer.textContent = 'Stöd per månad ' + kr(perMan) + ' kronor, per år ' + kr(perAr) + ' kronor.';
      }, 800);
    };

    calc.addEventListener('input', updateCalc);
    calc.addEventListener('change', updateCalc);
    updateCalc();
  }

  /* ---------- Kontaktformulär ---------- */

  var form = document.getElementById('kontaktformular');

  if (form) {
    var fields = form.querySelector('.form-fields');
    var success = form.querySelector('.form-success');
    var status = form.querySelector('.form-status');
    var submit = form.querySelector('button[type="submit"]');
    var submitLabel = submit.innerHTML;
    var fallbackEmail = form.getAttribute('data-fallback-email');

    var isEmail = function (value) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    };

    var isPhone = function (value) {
      return /^[+\d\s()-]+$/.test(value) && value.replace(/\D/g, '').length >= 7;
    };

    var setFieldError = function (input, message) {
      var error = document.getElementById(input.id + '-fel');
      if (message) {
        input.setAttribute('aria-invalid', 'true');
      } else {
        input.removeAttribute('aria-invalid');
      }
      if (error) {
        error.textContent = message || '';
        error.hidden = !message;
      }
      return !message;
    };

    var validate = function () {
      var namn = form.elements.namn;
      var kontakt = form.elements.kontakt;
      var kontaktValue = kontakt.value.trim();

      var namnOk = setFieldError(namn, namn.value.trim() ? '' : 'Fyll i ditt namn.');
      var kontaktOk = setFieldError(
        kontakt,
        !kontaktValue ? 'Fyll i telefonnummer eller e-post.'
          : isEmail(kontaktValue) || isPhone(kontaktValue) ? ''
            : 'Ange ett giltigt telefonnummer eller en e-postadress.'
      );

      if (!namnOk) {
        namn.focus();
      } else if (!kontaktOk) {
        kontakt.focus();
      }
      return namnOk && kontaktOk;
    };

    var setStatus = function (html, isError) {
      status.innerHTML = html;
      status.classList.toggle('is-error', Boolean(isError));
    };

    var mailtoHref = function (data) {
      var subject = 'Förfrågan via webbplatsen' + (data.foretag ? ' – ' + data.foretag : '');
      var body = [
        'Namn: ' + data.namn,
        'Företag: ' + (data.foretag || '–'),
        'Telefon/e-post: ' + data.kontakt,
        '',
        'Roll vi vill tillsätta:',
        data.roll || '–'
      ].join('\r\n');
      return 'mailto:' + fallbackEmail + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
    };

    var showSuccess = function () {
      fields.hidden = true;
      success.hidden = false;
      success.focus();
    };

    // Om formuläret inte kan skickas härifrån öppnas e-postprogrammet med allt ifyllt.
    var openMailFallback = function (data) {
      var href = mailtoHref(data);
      setStatus(
        'Formuläret kunde inte skickas direkt, så vi öppnade ditt e-postprogram med meddelandet ifyllt – tryck på skicka där. ' +
        'Öppnades inget? <a href="' + href + '">Skicka via e-post</a> eller ring ' + PHONE_DISPLAY + '.'
      );
      window.location.href = href;
    };

    form.querySelectorAll('input, textarea').forEach(function (input) {
      input.addEventListener('input', function () {
        if (input.getAttribute('aria-invalid') === 'true') setFieldError(input, '');
      });
    });

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      setStatus('');
      if (!validate()) return;

      var data = {
        namn: form.elements.namn.value.trim(),
        foretag: form.elements.foretag.value.trim(),
        kontakt: form.elements.kontakt.value.trim(),
        roll: form.elements.roll.value.trim(),
        webbplats: form.elements.webbplats.value
      };

      if (data.webbplats) {
        showSuccess();
        return;
      }

      submit.disabled = true;
      submit.textContent = 'Skickar…';

      var controller = 'AbortController' in window ? new AbortController() : null;
      var timeout = setTimeout(function () {
        if (controller) controller.abort();
      }, 10000);

      fetch(form.action, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(data),
        signal: controller ? controller.signal : undefined
      })
        .then(function (response) {
          if (response.ok) {
            showSuccess();
          } else if (response.status === 400) {
            setStatus('Något i formuläret stämmer inte. Kontrollera uppgifterna och försök igen.', true);
          } else {
            openMailFallback(data);
          }
        })
        .catch(function () {
          openMailFallback(data);
        })
        .then(function () {
          clearTimeout(timeout);
          submit.disabled = false;
          submit.innerHTML = submitLabel;
        });
    });
  }

  /* ---------- Årtal i sidfoten ---------- */

  document.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });
})();
