// ============================================================
// NdiJob Global · Asonye Realest Group
// Main Script
// ============================================================

// ---------- Navbar scroll behaviour ----------
const navbar  = document.getElementById('navbar');
const navLinks = document.getElementById('navLinks');
const navToggle = document.getElementById('navToggle');

window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 60);
  updateActiveNavLink();
}, { passive: true });

// ---------- Mobile menu ----------
navToggle.addEventListener('click', () => {
  navLinks.classList.toggle('open');
  navToggle.classList.toggle('open');
  document.body.style.overflow = navLinks.classList.contains('open') ? 'hidden' : '';
});

navLinks.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('open');
    navToggle.classList.remove('open');
    document.body.style.overflow = '';
  });
});

// ---------- Active nav link on scroll ----------
function updateActiveNavLink() {
  const sections = document.querySelectorAll('section[id], footer[id]');
  let current = 'home';
  sections.forEach(s => {
    if (window.scrollY + 140 >= s.offsetTop) current = s.id;
  });
  navLinks.querySelectorAll('a').forEach(a => {
    a.classList.toggle('active', a.getAttribute('href') === `#${current}`);
  });
}

// ---------- Scroll fade-in animations ----------
const fadeObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      // Stagger siblings in the same parent grid/group
      const siblings = Array.from(entry.target.parentElement.querySelectorAll('.fade-up:not(.visible)'));
      const delay = siblings.indexOf(entry.target);
      setTimeout(() => {
        entry.target.classList.add('visible');
      }, delay * 60);
      fadeObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.fade-up').forEach(el => fadeObserver.observe(el));

// Stagger cards individually for grid sections
const cardObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const parent = entry.target.closest('.events-grid, .gallery-grid, .activities-grid, .projects-grid');
      if (parent) {
        const cards = Array.from(parent.children);
        const idx   = cards.indexOf(entry.target);
        setTimeout(() => {
          entry.target.style.opacity   = '1';
          entry.target.style.transform = 'translateY(0)';
        }, idx * 80);
      }
      cardObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.06, rootMargin: '0px 0px -30px 0px' });

document.querySelectorAll(
  '.event-card, .gallery-cell, .activity-card, .project-card, .value-tile, .timeline-item'
).forEach(el => {
  el.style.opacity   = '0';
  el.style.transform = 'translateY(24px)';
  el.style.transition = 'opacity 0.55s ease, transform 0.55s ease';
  cardObserver.observe(el);
});

// ---------- Video Modal ----------
function openVideoModal(title, date, note) {
  document.getElementById('modalTitle').textContent = title;
  document.getElementById('modalDate').textContent  = date;
  document.getElementById('modalNote').textContent  = note;
  document.getElementById('videoModal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeVideoModal() {
  document.getElementById('videoModal').classList.remove('open');
  document.body.style.overflow = '';
}

// ---------- Photo Modal ----------
const photoGradients = {
  gimg_1: 'linear-gradient(145deg, #0f2d1c 0%, #1a5c38 50%, #2d8a57 100%)',
  gimg_2: 'linear-gradient(145deg, #7a3a10 0%, #c9991a 100%)',
  gimg_3: 'linear-gradient(145deg, #6b2020 0%, #b85c3a 100%)',
  gimg_4: 'linear-gradient(145deg, #1a3252 0%, #2b6cb0 60%, #4299e1 100%)',
  gimg_5: 'linear-gradient(145deg, #2d1654 0%, #6b46c1 100%)',
  gimg_6: 'linear-gradient(145deg, #1a4040 0%, #2c7a7b 100%)',
  gimg_7: 'linear-gradient(145deg, #3a2010 0%, #8b5e3c 100%)',
};

function openPhotoModal(title, sub) {
  // Find the clicked cell's image class to mirror it in modal
  const clickedImg = event.currentTarget.querySelector('.gallery-img');
  let gradient = 'linear-gradient(145deg, #1a5c38, #0f2d1c)';
  if (clickedImg) {
    const cls = Array.from(clickedImg.classList).find(c => c.startsWith('gimg-'));
    if (cls) {
      const key = cls.replace('-', '_');
      gradient = photoGradients[key] || gradient;
    }
  }
  document.getElementById('photoModalImg').style.background = gradient;
  document.getElementById('photoModalTitle').textContent = title;
  document.getElementById('photoModalSub').textContent   = sub;
  document.getElementById('photoModal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closePhotoModal() {
  document.getElementById('photoModal').classList.remove('open');
  document.body.style.overflow = '';
}

// ---------- Donate Modal ----------
function openDonateModal(type) {
  document.getElementById('donateLocalPane').style.display = type === 'local' ? '' : 'none';
  document.getElementById('donateIntlPane').style.display  = type === 'intl'  ? '' : 'none';
  document.getElementById('donateModal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeDonateModal() {
  document.getElementById('donateModal').classList.remove('open');
  document.body.style.overflow = '';
}

// Expose to inline handlers
window.openVideoModal   = openVideoModal;
window.closeVideoModal  = closeVideoModal;
window.openPhotoModal   = openPhotoModal;
window.closePhotoModal  = closePhotoModal;
window.openDonateModal  = openDonateModal;
window.closeDonateModal = closeDonateModal;

// ---------- Background Music ----------
function toggleMusic() {
  const audio = document.getElementById('bgMusic');
  const btn   = document.getElementById('musicBtn');
  if (audio.paused) {
    audio.volume = 0.3;
    audio.play().then(() => {
      btn.classList.add('playing');
    }).catch(() => {});
  } else {
    audio.pause();
    btn.classList.remove('playing');
  }
}
window.toggleMusic = toggleMusic;

// Auto-start music on first user interaction (browsers block autoplay before interaction)
let musicStarted = false;
const musicToast = document.getElementById('musicToast');

// Delay listeners so scroll-restoration on page load doesn't trigger music immediately
setTimeout(() => {
  document.addEventListener('scroll',     startMusicOnce, { once: true, passive: true });
  document.addEventListener('click',      startMusicOnce, { once: true });
  document.addEventListener('touchstart', startMusicOnce, { once: true, passive: true });
}, 3000);

function startMusicOnce() {
  if (musicStarted) return;
  musicStarted = true;
  const audio = document.getElementById('bgMusic');
  const btn   = document.getElementById('musicBtn');
  audio.volume = 0.3;
  audio.play().then(() => {
    btn.classList.add('playing');
  }).catch(() => {});
  musicToast.classList.add('hidden');
}

// ---------- Video autoplay on scroll ----------
const videoAutoObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    const video = entry.target;
    if (entry.isIntersecting) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  });
}, { threshold: 0.5 });

document.querySelectorAll('.event-video').forEach(v => videoAutoObserver.observe(v));

// ---------- Keyboard close ----------
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  closeVideoModal();
  closePhotoModal();
  closeDonateModal();
  navLinks.classList.remove('open');
  navToggle.classList.remove('open');
  document.body.style.overflow = '';
});

// ---------- Smooth scroll polyfill for older browsers ----------
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});
