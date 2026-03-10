/* ========================================
   AsiSeguros - Main JavaScript
   ======================================== */

document.addEventListener('DOMContentLoaded', () => {

  /* ---------- Apply Admin Config ---------- */
  applyAdminConfig();


  /* ---------- Header Scroll Effect ---------- */
  const header = document.querySelector('.header');
  const scrollTopBtn = document.querySelector('.scroll-top');

  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;

    // Sticky header shadow
    if (scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }

    // Scroll to top button
    if (scrollTopBtn) {
      if (scrollY > 400) {
        scrollTopBtn.classList.add('visible');
      } else {
        scrollTopBtn.classList.remove('visible');
      }
    }
  });

  // Scroll to top click
  if (scrollTopBtn) {
    scrollTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ---------- Mobile Menu ---------- */
  const menuToggle = document.querySelector('.menu-toggle');
  const navMenu = document.querySelector('.nav-menu');
  const overlay = document.createElement('div');
  overlay.className = 'menu-overlay';
  overlay.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(0,0,0,0.5); z-index: 999; display: none;
  `;
  document.body.appendChild(overlay);

  function toggleMenu() {
    menuToggle.classList.toggle('active');
    navMenu.classList.toggle('active');
    overlay.style.display = navMenu.classList.contains('active') ? 'block' : 'none';
    document.body.style.overflow = navMenu.classList.contains('active') ? 'hidden' : '';
  }

  if (menuToggle) {
    menuToggle.addEventListener('click', toggleMenu);
  }

  overlay.addEventListener('click', toggleMenu);

  // Mobile dropdown toggle
  const dropdownParents = document.querySelectorAll('.nav-menu > li');
  dropdownParents.forEach(item => {
    const link = item.querySelector('a');
    const dropdown = item.querySelector('.dropdown-menu');

    if (dropdown && window.innerWidth <= 768) {
      link.addEventListener('click', (e) => {
        if (window.innerWidth <= 768) {
          e.preventDefault();
          dropdown.classList.toggle('show');
        }
      });
    }
  });

  // Close menu on nav link click (mobile)
  document.querySelectorAll('.nav-menu a').forEach(link => {
    link.addEventListener('click', () => {
      if (window.innerWidth <= 768 && !link.nextElementSibling) {
        if (navMenu.classList.contains('active')) {
          toggleMenu();
        }
      }
    });
  });

  /* ---------- Scroll Reveal Animation ---------- */
  const revealElements = document.querySelectorAll('.reveal');

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        revealObserver.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.15,
    rootMargin: '0px 0px -50px 0px'
  });

  revealElements.forEach(el => revealObserver.observe(el));

  /* ---------- Counter Animation ---------- */
  const counters = document.querySelectorAll('.stat-number[data-target]');

  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const counter = entry.target;
        const target = parseInt(counter.getAttribute('data-target'));
        const suffix = counter.getAttribute('data-suffix') || '';
        const prefix = counter.getAttribute('data-prefix') || '';
        const duration = 2000;
        const step = target / (duration / 16);
        let current = 0;

        const updateCounter = () => {
          current += step;
          if (current < target) {
            counter.textContent = prefix + Math.floor(current).toLocaleString('es-CO') + suffix;
            requestAnimationFrame(updateCounter);
          } else {
            counter.textContent = prefix + target.toLocaleString('es-CO') + suffix;
          }
        };

        updateCounter();
        counterObserver.unobserve(counter);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(counter => counterObserver.observe(counter));

  /* ---------- Marquee Duplication ---------- */
  const marqueeTrack = document.querySelector('.marquee-track');
  if (marqueeTrack) {
    const items = marqueeTrack.innerHTML;
    marqueeTrack.innerHTML = items + items;
  }

  /* ---------- Smooth Scroll for Anchor Links ---------- */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;

      const targetEl = document.querySelector(targetId);
      if (targetEl) {
        e.preventDefault();
        const headerHeight = header.offsetHeight;
        const targetPosition = targetEl.offsetTop - headerHeight - 20;

        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
      }
    });
  });

  /* ---------- Contact Form ---------- */
  const contactForm = document.querySelector('#contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const formData = new FormData(contactForm);
      const data = Object.fromEntries(formData);

      // Validate required fields
      let isValid = true;
      contactForm.querySelectorAll('[required]').forEach(field => {
        if (!field.value.trim()) {
          field.style.borderColor = '#ef4444';
          isValid = false;
        } else {
          field.style.borderColor = '';
        }
      });

      if (!isValid) return;

      // Build WhatsApp message
      const message = encodeURIComponent(
        `Hola, quiero cotizar un seguro.\n\n` +
        `*Nombre:* ${data.nombre}\n` +
        `*Email:* ${data.email}\n` +
        `*Teléfono:* ${data.telefono}\n` +
        `*Tipo de seguro:* ${data.tipo_seguro}\n` +
        `*Mensaje:* ${data.mensaje || 'Sin mensaje adicional'}`
      );

      const waNumber = contactForm.getAttribute('data-whatsapp') || '573173712260';
      const whatsappURL = `https://wa.me/${waNumber}?text=${message}`;
      window.open(whatsappURL, '_blank');

      // Show success feedback
      const btn = contactForm.querySelector('button[type="submit"]');
      const originalText = btn.innerHTML;
      btn.innerHTML = '<i class="fas fa-check"></i> Mensaje enviado';
      btn.style.background = '#22c55e';
      btn.style.borderColor = '#22c55e';

      setTimeout(() => {
        btn.innerHTML = originalText;
        btn.style.background = '';
        btn.style.borderColor = '';
        contactForm.reset();
      }, 3000);
    });
  }

  /* ---------- Form Field Focus Effects ---------- */
  document.querySelectorAll('.form-group input, .form-group select, .form-group textarea').forEach(field => {
    field.addEventListener('focus', () => {
      field.parentElement.classList.add('focused');
    });
    field.addEventListener('blur', () => {
      field.parentElement.classList.remove('focused');
    });
  });

});

/* ========================================
   APPLY ADMIN CONFIG TO FRONTEND
   ======================================== */
function applyAdminConfig() {
  const saved = localStorage.getItem('asiseguros_admin');
  if (!saved) return;

  let cfg;
  try { cfg = JSON.parse(saved); } catch { return; }

  // -- Toggle Modules (show/hide sections) --
  if (cfg.modules) {
    const sectionMap = {
      topbar: '.top-bar',
      hero: '.hero',
      marquee: '.marquee-section',
      about: '.about-section',
      services: '.services-section',
      why: '.why-section',
      stats: '.stats-section',
      productHighlight: '.product-highlight',
      testimonials: '.testimonials-section',
      cta: '.cta-section',
      contact: '.contact-section',
      whatsappFloat: '.whatsapp-float'
    };

    Object.entries(cfg.modules).forEach(([key, mod]) => {
      const selector = sectionMap[key];
      if (selector) {
        const el = document.querySelector(selector);
        if (el) el.style.display = mod.enabled ? '' : 'none';
      }
    });
  }

  // -- Site Info --
  if (cfg.site) {
    // Top bar phone
    const topPhone = document.querySelector('.top-bar-left a[href^="tel:"]');
    if (topPhone && cfg.site.phone) {
      topPhone.href = 'tel:' + cfg.site.phone.replace(/\s/g, '');
      topPhone.innerHTML = `<i class="fas fa-phone-alt"></i> ${cfg.site.phone}`;
    }

    // Top bar email
    const topEmail = document.querySelector('.top-bar-left a[href^="mailto:"]');
    if (topEmail && cfg.site.email) {
      topEmail.href = 'mailto:' + cfg.site.email;
      topEmail.innerHTML = `<i class="fas fa-envelope"></i> ${cfg.site.email}`;
    }

    // WhatsApp float
    const waFloat = document.querySelector('.whatsapp-float');
    if (waFloat && cfg.site.whatsapp) {
      waFloat.href = `https://wa.me/${cfg.site.whatsapp}?text=${encodeURIComponent('Hola, quiero información sobre seguros')}`;
    }

    // Footer contact items
    const footerWa = document.querySelector('.footer-contact-item a[href*="wa.me"]');
    if (footerWa && cfg.site.whatsapp) {
      footerWa.href = `https://wa.me/${cfg.site.whatsapp}`;
      footerWa.textContent = cfg.site.phone;
    }

    const footerEmail = document.querySelector('.footer-contact-item a[href^="mailto:"]');
    if (footerEmail && cfg.site.email) {
      footerEmail.href = 'mailto:' + cfg.site.email;
      footerEmail.textContent = cfg.site.email;
    }

    // Social links
    const socialMap = {
      facebook: 'fa-facebook-f',
      instagram: 'fa-instagram',
      linkedin: 'fa-linkedin-in',
      tiktok: 'fa-tiktok',
      youtube: 'fa-youtube'
    };

    Object.entries(socialMap).forEach(([key, iconClass]) => {
      if (cfg.site[key]) {
        document.querySelectorAll(`a[aria-label="${key.charAt(0).toUpperCase() + key.slice(1)}"]`).forEach(a => {
          a.href = cfg.site[key];
        });
      }
    });
  }

  // -- Hero --
  if (cfg.hero) {
    setText('.hero-badge', cfg.hero.badge, true);
    setHTML('.hero h1', cfg.hero.title);
    setText('.hero-text', cfg.hero.subtitle);
    setText('.hero-buttons .btn-primary', cfg.hero.ctaPrimary, true);
    setText('.hero-buttons .btn-secondary', cfg.hero.ctaSecondary, true);

    const stats = document.querySelectorAll('.hero-stat');
    if (stats[0]) {
      stats[0].querySelector('.hero-stat-number').textContent = cfg.hero.stat1Number;
      stats[0].querySelector('.hero-stat-label').textContent = cfg.hero.stat1Label;
    }
    if (stats[1]) {
      stats[1].querySelector('.hero-stat-number').textContent = cfg.hero.stat2Number;
      stats[1].querySelector('.hero-stat-label').textContent = cfg.hero.stat2Label;
    }
    if (stats[2]) {
      stats[2].querySelector('.hero-stat-number').textContent = cfg.hero.stat3Number;
      stats[2].querySelector('.hero-stat-label').textContent = cfg.hero.stat3Label;
    }
  }

  // -- About --
  if (cfg.about) {
    setText('.about-content .section-subtitle', cfg.about.subtitle);
    setText('.about-content .section-title', cfg.about.title);
    const paragraphs = document.querySelectorAll('.about-content > p');
    if (paragraphs[0]) paragraphs[0].innerHTML = cfg.about.paragraph1;
    if (paragraphs[1]) paragraphs[1].innerHTML = cfg.about.paragraph2;

    const badge = document.querySelector('.about-experience-badge');
    if (badge) {
      const num = badge.querySelector('.number');
      const txt = badge.querySelector('.text');
      if (num) num.textContent = cfg.about.experienceNumber;
      if (txt) txt.textContent = cfg.about.experienceText;
    }
  }

  // -- Stats Counters --
  if (cfg.stats) {
    const statItems = document.querySelectorAll('.stats-section .stat-item');
    const statsArr = [cfg.stats.stat1, cfg.stats.stat2, cfg.stats.stat3, cfg.stats.stat4];
    statsArr.forEach((s, i) => {
      if (statItems[i] && s) {
        const numEl = statItems[i].querySelector('.stat-number');
        const labelEl = statItems[i].querySelector('.stat-label');
        if (numEl) {
          numEl.setAttribute('data-target', s.number);
          numEl.setAttribute('data-suffix', s.suffix);
          numEl.textContent = '0';
        }
        if (labelEl) labelEl.textContent = s.label;
      }
    });
  }

  // -- Why Choose Us --
  if (cfg.why) {
    const whySection = document.querySelector('.why-section');
    if (whySection) {
      setText('.why-section .section-subtitle', cfg.why.subtitle);
      setText('.why-section .section-title', cfg.why.title);
      setText('.why-section .section-description', cfg.why.description);

      const cards = whySection.querySelectorAll('.why-card');
      cfg.why.cards.forEach((card, i) => {
        if (cards[i]) {
          const icon = cards[i].querySelector('.why-icon i');
          if (icon) icon.className = card.icon;
          const h3 = cards[i].querySelector('h3');
          if (h3) h3.textContent = card.title;
          const p = cards[i].querySelector('p');
          if (p) p.textContent = card.text;
        }
      });
    }
  }

  // -- CTA --
  if (cfg.ctaSection) {
    setText('.cta-content h2', cfg.ctaSection.title);
    setText('.cta-content > p', cfg.ctaSection.description);
    setText('.cta-buttons .btn-primary', cfg.ctaSection.btnPrimary, true);
    setText('.cta-buttons .btn-secondary', cfg.ctaSection.btnSecondary, true);
  }

  // -- Insurance Types (services cards + form select) --
  if (cfg.insuranceTypes) {
    const serviceCards = document.querySelectorAll('.service-card');
    const catKeys = ['personas', 'generales', 'empresariales', 'arl'];

    catKeys.forEach((key, i) => {
      const cat = cfg.insuranceTypes[key];
      if (!cat) return;

      // Toggle service card visibility
      if (serviceCards[i]) {
        serviceCards[i].style.display = cat.enabled ? '' : 'none';
        const p = serviceCards[i].querySelector('p');
        if (p) p.textContent = cat.description;
      }
    });

    // Update the contact form select options
    const select = document.getElementById('tipo_seguro');
    if (select) {
      // Keep the first placeholder option
      const placeholder = select.querySelector('option[disabled]');
      const otroOption = '<option value="Otro">Otro</option>';
      let optionsHTML = placeholder ? placeholder.outerHTML : '';

      Object.entries(cfg.insuranceTypes).forEach(([catKey, cat]) => {
        if (!cat.enabled) return;
        const enabledSubs = Object.entries(cat.subtypes).filter(([, s]) => s.enabled);
        if (enabledSubs.length === 0) return;

        optionsHTML += `<optgroup label="${cat.label}">`;
        enabledSubs.forEach(([, sub]) => {
          optionsHTML += `<option value="${sub.label}">${sub.label}</option>`;
        });
        optionsHTML += '</optgroup>';
      });

      optionsHTML += otroOption;
      select.innerHTML = optionsHTML;
    }
  }

  // -- Testimonials --
  if (cfg.testimonials && cfg.testimonials.length > 0) {
    const grid = document.querySelector('.testimonials-grid');
    if (grid) {
      grid.innerHTML = cfg.testimonials.map(t => `
        <div class="testimonial-card reveal">
          <i class="fas fa-quote-right testimonial-quote-icon"></i>
          <div class="testimonial-stars">
            <i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i>
          </div>
          <p class="testimonial-text">"${escapeHTML(t.text)}"</p>
          <div class="testimonial-author">
            <div class="testimonial-avatar">${escapeHTML(t.initials)}</div>
            <div class="testimonial-info">
              <strong>${escapeHTML(t.name)}</strong>
              <span>${escapeHTML(t.role)}</span>
            </div>
          </div>
        </div>
      `).join('');
    }
  }

  // -- WhatsApp in contact form --
  if (cfg.site && cfg.site.whatsapp) {
    const contactForm = document.querySelector('#contactForm');
    if (contactForm) {
      contactForm.setAttribute('data-whatsapp', cfg.site.whatsapp);
    }
  }
}

/* ---------- Helpers ---------- */
function setText(selector, text, preserveIcon) {
  const el = document.querySelector(selector);
  if (!el || !text) return;
  if (preserveIcon) {
    const icon = el.querySelector('i');
    const iconHTML = icon ? icon.outerHTML + ' ' : '';
    el.innerHTML = iconHTML + text;
  } else {
    el.textContent = text;
  }
}

function setHTML(selector, html) {
  const el = document.querySelector(selector);
  if (el && html) el.innerHTML = html;
}

function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
