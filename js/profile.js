document.addEventListener('DOMContentLoaded', async function() {
    const navbar = document.querySelector('.navbar');
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const publicationItems = document.querySelectorAll('.publication-item');
    const dataStatus = document.getElementById('data-status');

    await initializeResearchGateData();

    async function initializeResearchGateData() {
        const statPublications = document.getElementById('stat-publications');
        const statCitations = document.getElementById('stat-citations');
        const statReads = document.getElementById('stat-reads');
        const totalPublications = document.getElementById('total-publications');

        try {
            const data = await ResearchGateDataFetcher.fetchData();
            
            updateStatWithAnimation(statPublications, data.publications);
            updateStatWithAnimation(statCitations, data.citations);
            updateStatWithAnimation(statReads, data.reads);
            
            if (totalPublications) {
                animateNumber(totalPublications, 0, data.publications, 1500);
            }

            updateDataStatus(data);
            
            console.log('ResearchGate data loaded:', data);
        } catch (error) {
            console.error('Failed to load ResearchGate data:', error);
            
            const fallback = CONFIG.fallbackData;
            updateStatWithAnimation(statPublications, fallback.publications);
            updateStatWithAnimation(statCitations, fallback.citations);
            updateStatWithAnimation(statReads, fallback.reads);
            
            if (totalPublications) {
                totalPublications.textContent = fallback.publications;
            }
            
            updateDataStatus({ isFallback: true });
        }
    }

    function updateStatWithAnimation(element, targetValue) {
        if (!element) return;
        animateNumber(element, 0, targetValue, 1500);
    }

    function animateNumber(element, start, end, duration) {
        const startTime = performance.now();
        const diff = end - start;
        
        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            const current = Math.floor(start + diff * easeProgress);
            
            element.textContent = current.toLocaleString();
            
            if (progress < 1) {
                requestAnimationFrame(update);
            }
        }
        
        requestAnimationFrame(update);
    }

    function updateDataStatus(data) {
        if (!dataStatus) return;
        
        if (data.fromCache) {
            const cachedTime = new Date(data.lastUpdated).toLocaleString();
            dataStatus.innerHTML = `
                <i class="fas fa-database"></i>
                <span>Data cached from ${cachedTime} | <a href="#" id="refresh-data">Refresh</a></span>
            `;
            dataStatus.classList.add('cached');
        } else if (data.isFallback) {
            dataStatus.innerHTML = `
                <i class="fas fa-exclamation-triangle"></i>
                <span>Using fallback data | <a href="#" id="refresh-data">Retry</a></span>
            `;
            dataStatus.classList.add('fallback');
        } else {
            dataStatus.innerHTML = `
                <i class="fas fa-check-circle"></i>
                <span>Data updated: ${new Date().toLocaleString()}</span>
            `;
            dataStatus.classList.add('success');
        }

        const refreshBtn = document.getElementById('refresh-data');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                dataStatus.innerHTML = `
                    <i class="fas fa-sync-alt fa-spin"></i>
                    <span>Refreshing data...</span>
                `;
                dataStatus.className = 'data-status';
                
                const freshData = await ResearchGateDataFetcher.refreshData();
                updateStatWithAnimation(document.getElementById('stat-publications'), freshData.publications);
                updateStatWithAnimation(document.getElementById('stat-citations'), freshData.citations);
                updateStatWithAnimation(document.getElementById('stat-reads'), freshData.reads);
                
                const totalPub = document.getElementById('total-publications');
                if (totalPub) {
                    animateNumber(totalPub, 0, freshData.publications, 1500);
                }
                
                updateDataStatus(freshData);
            });
        }
    }

    function handleScroll() {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }

        updateActiveNavLink();
    }

    function updateActiveNavLink() {
        const sections = document.querySelectorAll('section[id]');
        const scrollPosition = window.scrollY + 100;

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            const sectionId = section.getAttribute('id');

            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${sectionId}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    }

    navToggle.addEventListener('click', function() {
        navToggle.classList.toggle('active');
        navMenu.classList.toggle('active');
    });

    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                const offsetTop = targetSection.offsetTop - 70;
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }

            navToggle.classList.remove('active');
            navMenu.classList.remove('active');
        });
    });

    filterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            filterBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            const filter = this.getAttribute('data-filter');

            publicationItems.forEach(item => {
                const category = item.getAttribute('data-category');
                
                if (filter === 'all' || category === filter) {
                    item.classList.remove('hidden');
                    item.style.animation = 'fadeInUp 0.5s ease forwards';
                } else {
                    item.classList.add('hidden');
                }
            });
        });
    });

    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    const animatedElements = document.querySelectorAll('.research-card, .publication-item, .highlight-card');
    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });

    window.addEventListener('scroll', function() {
        handleScroll();
    });

    handleScroll();

    const researchCards = document.querySelectorAll('.research-card');
    researchCards.forEach((card, index) => {
        card.style.transitionDelay = `${index * 0.1}s`;
    });

    const publicationItemsAll = document.querySelectorAll('.publication-item');
    publicationItemsAll.forEach((item, index) => {
        item.style.transitionDelay = `${index * 0.05}s`;
    });

    setInterval(async () => {
        const data = await ResearchGateDataFetcher.fetchData();
        if (!data.fromCache) {
            console.log('Auto-refreshed data:', data);
        }
    }, 30 * 60 * 1000);

    const EmailProtection = {
        realEmail: 'whsopt@163.com',
        currentCaptcha: '',
        
        generateCaptcha() {
            const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
            let captcha = '';
            for (let i = 0; i < 5; i++) {
                captcha += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            this.currentCaptcha = captcha;
            return captcha;
        },
        
        init() {
            const modal = document.getElementById('captcha-modal');
            const display = document.getElementById('captcha-display');
            const input = document.getElementById('captcha-input');
            const revealBtn = document.getElementById('reveal-email-btn');
            const verifyBtn = document.getElementById('captcha-verify');
            const cancelBtn = document.getElementById('captcha-cancel');
            const refreshBtn = document.getElementById('captcha-refresh');
            const errorEl = document.getElementById('captcha-error');
            const emailDisplay = document.getElementById('email-display');
            
            if (!modal) return;
            
            const showCaptcha = () => {
                display.textContent = this.generateCaptcha();
                modal.classList.add('active');
                input.value = '';
                errorEl.textContent = '';
                input.focus();
            };
            
            const hideCaptcha = () => {
                modal.classList.remove('active');
            };
            
            const verifyCaptcha = () => {
                const userInput = input.value.toUpperCase().trim();
                if (userInput === this.currentCaptcha) {
                    hideCaptcha();
                    emailDisplay.textContent = this.realEmail;
                    emailDisplay.classList.add('email-revealed');
                    revealBtn.innerHTML = '<i class="fas fa-check"></i>';
                    revealBtn.disabled = true;
                    revealBtn.style.cursor = 'default';
                    revealBtn.title = 'Email revealed';
                } else {
                    errorEl.textContent = 'Incorrect code. Please try again.';
                    display.textContent = this.generateCaptcha();
                    input.value = '';
                    input.focus();
                }
            };
            
            revealBtn.addEventListener('click', showCaptcha);
            
            verifyBtn.addEventListener('click', verifyCaptcha);
            
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    verifyCaptcha();
                }
            });
            
            cancelBtn.addEventListener('click', hideCaptcha);
            
            refreshBtn.addEventListener('click', () => {
                refreshBtn.classList.add('spinning');
                setTimeout(() => {
                    refreshBtn.classList.remove('spinning');
                }, 500);
                display.textContent = this.generateCaptcha();
                input.value = '';
                input.focus();
            });
            
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    hideCaptcha();
                }
            });
            
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && modal.classList.contains('active')) {
                    hideCaptcha();
                }
            });
        }
    };
    
    EmailProtection.init();
});
