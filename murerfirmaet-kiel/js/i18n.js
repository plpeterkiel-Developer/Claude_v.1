(function () {
  'use strict';

  var translations = {
    da: {
      // Nav
      'nav.home': 'Forside',
      'nav.services': 'Ydelser',
      'nav.about': 'Om os',
      'nav.gallery': 'Galleri',
      'nav.contact': 'Kontakt',

      // A11y
      'a11y.skip': 'Spring til indhold',

      // Home — Hero
      'home.hero.title': 'Professionel Flise- & Murerarbejde',
      'home.hero.subtitle': 'Håndværk i højeste kvalitet — Storkøbenhavn siden 2005',
      'home.hero.cta': 'Få et uforpligtende tilbud',
      'home.hero.cta2': 'Se vores arbejde',

      // Home — Services
      'home.services.title': 'Vores ydelser',
      'home.services.subtitle': 'Vi leverer skræddersyede løsninger til ethvert projekt — fra elegante badeværelser til solide murerkonstruktioner.',
      'home.services.bathroom.title': 'Badeværelsesfliser',
      'home.services.bathroom.desc': 'Komplet fliseløsning til dit badeværelse — fra design til færdigt resultat.',
      'home.services.kitchen.title': 'Køkkenfliser',
      'home.services.kitchen.desc': 'Stilfulde fliser der forvandler dit køkken med holdbare og smukke overflader.',
      'home.services.masonry.title': 'Murerarbejde',
      'home.services.masonry.desc': 'Professionelt murerarbejde — reparation, renovering og nyopførelse.',
      'home.services.all': 'Se alle ydelser',

      // Home — Why
      'home.why.title': 'Hvorfor vælge os?',
      'home.why.experience': 'Års erfaring',
      'home.why.projects': 'Gennemførte projekter',
      'home.why.satisfaction': 'Kundetilfredshed',

      // Home — Testimonial
      'home.testimonial.quote': '\u201CMurerfirmaet Kiel leverede et fantastisk resultat i vores badeværelse. Professionelt arbejde fra start til slut — vi kan kun anbefale dem.\u201D',
      'home.testimonial.author': '— Maria & Thomas, Frederiksberg',

      // Home — CTA
      'home.cta.title': 'Klar til at starte dit projekt?',
      'home.cta.subtitle': 'Kontakt os i dag for en uforpligtende snak om dine ønsker og behov.',
      'home.cta.button': 'Kontakt os',

      // Services page
      'services.hero.title': 'Vores ydelser',
      'services.hero.subtitle': 'Kvalitetsløsninger til ethvert flise- og murerprojekt',
      'services.bathroom.title': 'Badeværelsesfliser',
      'services.bathroom.desc': 'Vi er specialister i badeværelsesrenovering og flisearbejde. Fra det moderne minimalistiske design til det klassiske, tidløse look — vi skaber badeværelser der imponerer.',
      'services.bathroom.l1': 'Komplet badeværelsesrenovering',
      'services.bathroom.l2': 'Væg- og gulvfliser',
      'services.bathroom.l3': 'Brusenicher og vådrum',
      'services.bathroom.l4': 'Vandtætning og membranarbejde',
      'services.kitchen.title': 'Køkkenfliser',
      'services.kitchen.desc': 'Giv dit køkken et løft med professionelt flisearbejde. Vi hjælper dig med at vælge de rette materialer og skabe et køkken der er både smukt og praktisk.',
      'services.kitchen.l1': 'Stænkplader og vægfliser',
      'services.kitchen.l2': 'Gulvfliser i alle formater',
      'services.kitchen.l3': 'Mosaikarbejde og dekorfliser',
      'services.floor.title': 'Gulvfliser',
      'services.floor.desc': 'Professionel gulvflisearbejde til alle rum i hjemmet. Vi arbejder med alle typer fliser og formater — fra store formater til intrikate mønstre.',
      'services.floor.l1': 'Klinker og natursten',
      'services.floor.l2': 'Store formater og plankfliser',
      'services.floor.l3': 'Gulvvarme-kompatible løsninger',
      'services.masonry.title': 'Murerarbejde',
      'services.masonry.desc': 'Solidt og pålideligt murerarbejde til både indendørs og udendørs projekter. Vi har stor erfaring med alle typer murerkonstruktioner.',
      'services.masonry.l1': 'Opmuring og murereparation',
      'services.masonry.l2': 'Pudsning og facaderenovering',
      'services.masonry.l3': 'Skorstensreparation',
      'services.masonry.l4': 'Betonarbejde og fundament',
      'services.renovation.title': 'Renovering',
      'services.renovation.desc': 'Helhedsløsninger til renovering af badeværelser, køkkener og andre rum. Vi styrer hele processen fra start til slut.',
      'services.renovation.l1': 'Total badeværelsesrenovering',
      'services.renovation.l2': 'Delvis renovering og opgradering',
      'services.renovation.l3': 'Rådgivning og projektplanlægning',
      'services.cta.title': 'Har du et projekt i tankerne?',
      'services.cta.subtitle': 'Vi kommer gerne forbi til en uforpligtende snak og vurdering.',
      'services.cta.button': 'Kontakt os',

      // About page
      'about.hero.title': 'Om os',
      'about.hero.subtitle': 'Mød folkene bag Murerfirmaet Kiel',
      'about.story.title': 'Vores historie',
      'about.story.p1': 'Murerfirmaet Kiel blev grundlagt med en simpel vision: at levere håndværk af højeste kvalitet til private hjem i Storkøbenhavn. Med over 20 års erfaring i branchen har vi opbygget et omdømme baseret på pålidelighed, præcision og æstetisk sans.',
      'about.story.p2': 'Vi er specialister i badeværelsesrenovering og flisearbejde, men vores kompetencer spænder bredt inden for murerarbejde og renovering. Uanset om det drejer sig om et enkelt badeværelse eller en komplet renovering, leverer vi altid et resultat, vi selv er stolte af.',
      'about.values.title': 'Vores værdier',
      'about.values.quality.title': 'Kvalitetshåndværk',
      'about.values.quality.desc': 'Vi går aldrig på kompromis med kvaliteten. Hvert projekt udføres med omhu og præcision ned til mindste detalje.',
      'about.values.reliable.title': 'Pålidelighed',
      'about.values.reliable.desc': 'Vi overholder aftaler, tidsplaner og budgetter. Du kan stole på, at vi leverer det, vi lover.',
      'about.values.personal.title': 'Personlig service',
      'about.values.personal.desc': 'Hver kunde er unik. Vi lytter til dine ønsker og tilpasser vores arbejde til netop dine behov.',
      'about.area.title': 'Vores dækningsområde',
      'about.area.desc': 'Vi betjener hele Storkøbenhavn og omegn, herunder København, Frederiksberg, Amager, Nordhavn, Hellerup, Gentofte, Lyngby og omliggende kommuner.',
      'about.cta.title': 'Lad os tale om dit projekt',
      'about.cta.subtitle': 'Vi ser frem til at høre fra dig.',
      'about.cta.button': 'Kontakt os',

      // Gallery page
      'gallery.hero.title': 'Galleri',
      'gallery.hero.subtitle': 'Se et udvalg af vores seneste projekter',
      'gallery.filter.all': 'Alle',
      'gallery.filter.bathroom': 'Badeværelse',
      'gallery.filter.kitchen': 'Køkken',
      'gallery.filter.floor': 'Gulv',
      'gallery.filter.masonry': 'Murerarbejde',

      // Contact page
      'contact.hero.title': 'Kontakt os',
      'contact.hero.subtitle': 'Vi ser frem til at høre fra dig',
      'contact.form.title': 'Send os en besked',
      'contact.form.name': 'Navn',
      'contact.form.email': 'E-mail',
      'contact.form.phone': 'Telefon',
      'contact.form.service': 'Hvilken ydelse?',
      'contact.form.service.select': 'Vælg en ydelse',
      'contact.form.service.bathroom': 'Badeværelsesfliser',
      'contact.form.service.kitchen': 'Køkkenfliser',
      'contact.form.service.floor': 'Gulvfliser',
      'contact.form.service.masonry': 'Murerarbejde',
      'contact.form.service.renovation': 'Renovering',
      'contact.form.service.other': 'Andet',
      'contact.form.message': 'Besked',
      'contact.form.submit': 'Send besked',
      'contact.form.sending': 'Sender...',
      'contact.form.success': 'Tak for din besked! Vi vender tilbage hurtigst muligt.',
      'contact.form.error': 'Der opstod en fejl. Prøv venligst igen, eller ring til os direkte.',
      'contact.form.required': 'Dette felt er påkrævet',
      'contact.form.emailInvalid': 'Indtast venligst en gyldig e-mailadresse',
      'contact.info.title': 'Kontaktinformation',
      'contact.info.phone': 'Telefon',
      'contact.info.email': 'E-mail',
      'contact.info.hours': 'Åbningstider',
      'contact.info.hoursValue': 'Man-Fre: 07:00 - 16:00',
      'contact.info.area': 'Dækningsområde',
      'contact.info.areaValue': 'Storkøbenhavn og omegn',

      // Footer
      'footer.tagline': 'Professionel flise- og murerarbejde i Storkøbenhavn. Kvalitet, pålidelighed og håndværk du kan stole på.',
      'footer.nav': 'Navigation',
      'footer.contactTitle': 'Kontakt',
      'footer.area': 'Storkøbenhavn',
      'footer.rights': 'Alle rettigheder forbeholdes.',

      // Meta (handled separately)
      'meta.home.title': 'Murerfirmaet Kiel | Professionel Flise- & Murerarbejde i Storkøbenhavn',
      'meta.home.description': 'Murerfirmaet Kiel tilbyder professionel flisearbejde, badeværelsesrenovering og murerarbejde i Storkøbenhavn. Kontakt os for et uforpligtende tilbud.',
      'meta.services.title': 'Ydelser | Murerfirmaet Kiel — Flise- & Murerarbejde',
      'meta.services.description': 'Se vores ydelser: badeværelsesfliser, køkkenfliser, gulvfliser, murerarbejde og renovering i Storkøbenhavn.',
      'meta.about.title': 'Om os | Murerfirmaet Kiel',
      'meta.about.description': 'Lær Murerfirmaet Kiel at kende — over 20 års erfaring med professionel flise- og murerarbejde i Storkøbenhavn.',
      'meta.gallery.title': 'Galleri | Murerfirmaet Kiel — Se vores arbejde',
      'meta.gallery.description': 'Se billeder af vores seneste projekter — badeværelser, køkkener, gulve og murerarbejde i Storkøbenhavn.',
      'meta.contact.title': 'Kontakt | Murerfirmaet Kiel',
      'meta.contact.description': 'Kontakt Murerfirmaet Kiel for et uforpligtende tilbud på flise- og murerarbejde i Storkøbenhavn.'
    },
    en: {
      // Nav
      'nav.home': 'Home',
      'nav.services': 'Services',
      'nav.about': 'About',
      'nav.gallery': 'Gallery',
      'nav.contact': 'Contact',

      // A11y
      'a11y.skip': 'Skip to content',

      // Home — Hero
      'home.hero.title': 'Professional Tiling & Masonry',
      'home.hero.subtitle': 'Craftsmanship of the highest quality — Greater Copenhagen since 2005',
      'home.hero.cta': 'Get a free quote',
      'home.hero.cta2': 'See our work',

      // Home — Services
      'home.services.title': 'Our services',
      'home.services.subtitle': 'We deliver tailored solutions for every project — from elegant bathrooms to solid masonry constructions.',
      'home.services.bathroom.title': 'Bathroom tiling',
      'home.services.bathroom.desc': 'Complete tiling solutions for your bathroom — from design to finished result.',
      'home.services.kitchen.title': 'Kitchen tiling',
      'home.services.kitchen.desc': 'Stylish tiles that transform your kitchen with durable and beautiful surfaces.',
      'home.services.masonry.title': 'Masonry',
      'home.services.masonry.desc': 'Professional masonry — repair, renovation and new construction.',
      'home.services.all': 'View all services',

      // Home — Why
      'home.why.title': 'Why choose us?',
      'home.why.experience': 'Years of experience',
      'home.why.projects': 'Completed projects',
      'home.why.satisfaction': 'Customer satisfaction',

      // Home — Testimonial
      'home.testimonial.quote': '\u201CMurerfirmaet Kiel delivered a fantastic result in our bathroom. Professional work from start to finish — we highly recommend them.\u201D',
      'home.testimonial.author': '— Maria & Thomas, Frederiksberg',

      // Home — CTA
      'home.cta.title': 'Ready to start your project?',
      'home.cta.subtitle': 'Contact us today for a no-obligation conversation about your wishes and needs.',
      'home.cta.button': 'Contact us',

      // Services page
      'services.hero.title': 'Our services',
      'services.hero.subtitle': 'Quality solutions for every tiling and masonry project',
      'services.bathroom.title': 'Bathroom tiling',
      'services.bathroom.desc': 'We are specialists in bathroom renovation and tiling. From modern minimalist design to the classic, timeless look — we create bathrooms that impress.',
      'services.bathroom.l1': 'Complete bathroom renovation',
      'services.bathroom.l2': 'Wall and floor tiles',
      'services.bathroom.l3': 'Shower niches and wet rooms',
      'services.bathroom.l4': 'Waterproofing and membrane work',
      'services.kitchen.title': 'Kitchen tiling',
      'services.kitchen.desc': 'Give your kitchen a lift with professional tiling. We help you choose the right materials and create a kitchen that is both beautiful and practical.',
      'services.kitchen.l1': 'Splashbacks and wall tiles',
      'services.kitchen.l2': 'Floor tiles in all formats',
      'services.kitchen.l3': 'Mosaic work and decorative tiles',
      'services.floor.title': 'Floor tiling',
      'services.floor.desc': 'Professional floor tiling for every room in the home. We work with all types of tiles and formats — from large format to intricate patterns.',
      'services.floor.l1': 'Porcelain and natural stone',
      'services.floor.l2': 'Large format and plank tiles',
      'services.floor.l3': 'Underfloor heating compatible solutions',
      'services.masonry.title': 'Masonry',
      'services.masonry.desc': 'Solid and reliable masonry for both indoor and outdoor projects. We have extensive experience with all types of masonry constructions.',
      'services.masonry.l1': 'Bricklaying and repair',
      'services.masonry.l2': 'Plastering and facade renovation',
      'services.masonry.l3': 'Chimney repair',
      'services.masonry.l4': 'Concrete work and foundations',
      'services.renovation.title': 'Renovation',
      'services.renovation.desc': 'Complete renovation solutions for bathrooms, kitchens and other rooms. We manage the entire process from start to finish.',
      'services.renovation.l1': 'Total bathroom renovation',
      'services.renovation.l2': 'Partial renovation and upgrades',
      'services.renovation.l3': 'Consultation and project planning',
      'services.cta.title': 'Have a project in mind?',
      'services.cta.subtitle': 'We are happy to visit for a no-obligation conversation and assessment.',
      'services.cta.button': 'Contact us',

      // About page
      'about.hero.title': 'About us',
      'about.hero.subtitle': 'Meet the people behind Murerfirmaet Kiel',
      'about.story.title': 'Our story',
      'about.story.p1': 'Murerfirmaet Kiel was founded with a simple vision: to deliver craftsmanship of the highest quality to private homes in Greater Copenhagen. With over 20 years of experience in the industry, we have built a reputation based on reliability, precision and aesthetic sense.',
      'about.story.p2': 'We are specialists in bathroom renovation and tiling, but our expertise spans broadly across masonry and renovation. Whether it concerns a single bathroom or a complete renovation, we always deliver a result we ourselves are proud of.',
      'about.values.title': 'Our values',
      'about.values.quality.title': 'Quality craftsmanship',
      'about.values.quality.desc': 'We never compromise on quality. Every project is carried out with care and precision down to the smallest detail.',
      'about.values.reliable.title': 'Reliability',
      'about.values.reliable.desc': 'We keep agreements, timelines and budgets. You can trust that we deliver what we promise.',
      'about.values.personal.title': 'Personal service',
      'about.values.personal.desc': 'Every customer is unique. We listen to your wishes and tailor our work to your specific needs.',
      'about.area.title': 'Our service area',
      'about.area.desc': 'We serve all of Greater Copenhagen and surroundings, including Copenhagen, Frederiksberg, Amager, Nordhavn, Hellerup, Gentofte, Lyngby and surrounding municipalities.',
      'about.cta.title': 'Let\'s talk about your project',
      'about.cta.subtitle': 'We look forward to hearing from you.',
      'about.cta.button': 'Contact us',

      // Gallery page
      'gallery.hero.title': 'Gallery',
      'gallery.hero.subtitle': 'Browse a selection of our recent projects',
      'gallery.filter.all': 'All',
      'gallery.filter.bathroom': 'Bathroom',
      'gallery.filter.kitchen': 'Kitchen',
      'gallery.filter.floor': 'Floor',
      'gallery.filter.masonry': 'Masonry',

      // Contact page
      'contact.hero.title': 'Contact us',
      'contact.hero.subtitle': 'We look forward to hearing from you',
      'contact.form.title': 'Send us a message',
      'contact.form.name': 'Name',
      'contact.form.email': 'Email',
      'contact.form.phone': 'Phone',
      'contact.form.service': 'Which service?',
      'contact.form.service.select': 'Select a service',
      'contact.form.service.bathroom': 'Bathroom tiling',
      'contact.form.service.kitchen': 'Kitchen tiling',
      'contact.form.service.floor': 'Floor tiling',
      'contact.form.service.masonry': 'Masonry',
      'contact.form.service.renovation': 'Renovation',
      'contact.form.service.other': 'Other',
      'contact.form.message': 'Message',
      'contact.form.submit': 'Send message',
      'contact.form.sending': 'Sending...',
      'contact.form.success': 'Thank you for your message! We will get back to you as soon as possible.',
      'contact.form.error': 'An error occurred. Please try again, or call us directly.',
      'contact.form.required': 'This field is required',
      'contact.form.emailInvalid': 'Please enter a valid email address',
      'contact.info.title': 'Contact information',
      'contact.info.phone': 'Phone',
      'contact.info.email': 'Email',
      'contact.info.hours': 'Opening hours',
      'contact.info.hoursValue': 'Mon-Fri: 07:00 - 16:00',
      'contact.info.area': 'Service area',
      'contact.info.areaValue': 'Greater Copenhagen and surroundings',

      // Footer
      'footer.tagline': 'Professional tiling and masonry in Greater Copenhagen. Quality, reliability and craftsmanship you can trust.',
      'footer.nav': 'Navigation',
      'footer.contactTitle': 'Contact',
      'footer.area': 'Greater Copenhagen',
      'footer.rights': 'All rights reserved.',

      // Meta
      'meta.home.title': 'Murerfirmaet Kiel | Professional Tiling & Masonry in Greater Copenhagen',
      'meta.home.description': 'Murerfirmaet Kiel offers professional tiling, bathroom renovation and masonry in Greater Copenhagen. Contact us for a free quote.',
      'meta.services.title': 'Services | Murerfirmaet Kiel — Tiling & Masonry',
      'meta.services.description': 'View our services: bathroom tiling, kitchen tiling, floor tiling, masonry and renovation in Greater Copenhagen.',
      'meta.about.title': 'About | Murerfirmaet Kiel',
      'meta.about.description': 'Get to know Murerfirmaet Kiel — over 20 years of experience with professional tiling and masonry in Greater Copenhagen.',
      'meta.gallery.title': 'Gallery | Murerfirmaet Kiel — See our work',
      'meta.gallery.description': 'View photos of our latest projects — bathrooms, kitchens, floors and masonry in Greater Copenhagen.',
      'meta.contact.title': 'Contact | Murerfirmaet Kiel',
      'meta.contact.description': 'Contact Murerfirmaet Kiel for a free quote on tiling and masonry in Greater Copenhagen.'
    }
  };

  // Detect page key for meta tags
  function getPageKey() {
    var path = window.location.pathname.split('/').pop() || 'index.html';
    var map = {
      'index.html': 'home',
      'services.html': 'services',
      'about.html': 'about',
      'gallery.html': 'gallery',
      'contact.html': 'contact'
    };
    return map[path] || 'home';
  }

  function setLanguage(lang) {
    var dict = translations[lang];
    if (!dict) return;

    // Update text content for all data-i18n elements
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var key = el.getAttribute('data-i18n');
      if (dict[key] !== undefined) {
        el.textContent = dict[key];
      }
    });

    // Update placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(function (el) {
      var key = el.getAttribute('data-i18n-placeholder');
      if (dict[key] !== undefined) {
        el.placeholder = dict[key];
      }
    });

    // Update alt text
    document.querySelectorAll('[data-i18n-alt]').forEach(function (el) {
      var key = el.getAttribute('data-i18n-alt');
      if (dict[key] !== undefined) {
        el.alt = dict[key];
      }
    });

    // Update page title and meta description
    var pageKey = getPageKey();
    var titleKey = 'meta.' + pageKey + '.title';
    var descKey = 'meta.' + pageKey + '.description';
    if (dict[titleKey]) document.title = dict[titleKey];
    var metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc && dict[descKey]) metaDesc.setAttribute('content', dict[descKey]);

    // Update html lang attribute
    document.documentElement.lang = lang;

    // Update toggle button text
    var toggle = document.getElementById('lang-toggle');
    if (toggle) toggle.textContent = lang === 'da' ? 'EN' : 'DA';

    // Save preference
    localStorage.setItem('mk-lang', lang);
  }

  // Initialize
  var savedLang = localStorage.getItem('mk-lang') || 'da';

  // Check URL parameter
  var urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('lang') === 'en') savedLang = 'en';
  if (urlParams.get('lang') === 'da') savedLang = 'da';

  if (savedLang !== 'da') {
    setLanguage(savedLang);
  }

  // Toggle button
  var toggleBtn = document.getElementById('lang-toggle');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', function () {
      var current = document.documentElement.lang || 'da';
      setLanguage(current === 'da' ? 'en' : 'da');
    });
  }

  // Expose for external use
  window.MKi18n = { setLanguage: setLanguage, translations: translations };
})();
