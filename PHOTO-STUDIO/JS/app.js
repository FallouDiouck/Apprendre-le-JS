
class Carousel {

    /**
     * 
     * @param {HTMLElement} element 
     * @param {Object} option 
     * @param {Object} [option.slidesToScroll=1] Nombre d'éléments à faire défiler
     * @param {Object} [option.slidesVisible=1] Nombre d'éléments visibles dans un slide
     * @param {boolean} [option.loop=false] Doit-il boucler en fin de slide
     * @param {boolean} [option.infinite=false]
     * @param {boolean} [option.pagination=false] 
     * @param {boolean} [option.navigation=true]
     */
    constructor(element, option = {}) {
        this.element = element
        this.option = Object.assign({}, {
            slidesToScroll: 1,
            slidesVisible: 1,
            loop: false,
            infinite: false,
            pagination: false,
            navigation: true
        }, option)
        let children = [].slice.call(element.children)
        this.isMobile = false
        this.currentItem = 0
        this.offset = 0

        //Modification du DOM
        this.root = this.createDivWithClass('carousel')
        this.container = this.createDivWithClass('carousel__container')
        this.root.setAttribute('tabindex', '0')
        this.root.appendChild(this.container)
        this.element.appendChild(this.root)
        this.moveCallbacks = []
        this.items = children.map((child) => {
            let item = this.createDivWithClass('carousel__item')
            item.appendChild(child)
            return item
        })
        if (this.option.infinite) {
            this.offset = this.option.slidesVisible * 2 - 1
            this.items = [
                ...this.items.slice(this.items.length - this.offset).map(item => item.cloneNode(true)),
                ...this.items,
                ...this.items.slice(0, this.offset).map(item => item.cloneNode(true)),
            ]
            this.gotoItem(this.offset, false)
        }
        this.items.forEach(item => this.container.appendChild(item))
        this.setStyle()
        if (this.option.navigation) {
            this.createNavigation()
        }
        if (this.option.pagination) {
            this.createPagination()
        }

        this.moveCallbacks.forEach(cb => cb(this.currentItem))
        this.onWindowResize()
        window.addEventListener('resize', this.onWindowResize.bind(this))
        this.root.addEventListener('keyup', e => {
            if (e.key === 'ArrowRight' || e.key === 'Right') {
                this.next()
            } else if (e.key === 'ArrowLeft' || e.key === 'Left') {
                this.prev()
            }
        })
        if (this.option.infinite) {
            this.container.addEventListener('transitionend', this.resetInfinite.bind(this))
        }
    }

    /**
     * applique les bonnes dimensions aux éléments du carousel
     */
    setStyle() {
        let ratio = this.items.length / this.slidesVisible
        this.container.style.width = (ratio * 100) + "%"
        this.items.forEach(item => item.style.width = ((100 / this.slidesVisible) / ratio) + "%")
    }

    createNavigation() {
        let nextButton = this.createDivWithClass('carousel__next')
        let prevButton = this.createDivWithClass('carousel__prev')
        this.root.appendChild(nextButton)
        this.root.appendChild(prevButton)
        nextButton.addEventListener('click', this.next.bind(this))
        prevButton.addEventListener('click', this.prev.bind(this))
        if (this.option.loop === true) {
            return
        }

        this.onMove(index => {
            if (index === 0) {
                prevButton.classList.add('carousel__prev--hidden')
            } else {
                prevButton.classList.remove('carousel__prev--hidden')
            }

            if (this.items[this.currentItem + this.slidesVisible] === undefined) {
                nextButton.classList.add('carousel__next--hidden')
            } else {
                nextButton.classList.remove('carousel__next--hidden')
            }
        })
    }

    createPagination() {
        let pagination = this.createDivWithClass('carousel__pagination')
        let buttons = []
        this.root.appendChild(pagination)
        for (let i = 0; i < (this.items.length - 2 * this.offset); i = i + this.option.slidesToScroll) {
            let button = this.createDivWithClass('carousel__pagination__button')
            button.addEventListener('click', () => this.gotoItem(i + this.offset))
            pagination.appendChild(button)
            buttons.push(button)
        }

        this.onMove(index => {
            let count = this.items.length - 2 * this.offset
            buttons.forEach(btn => btn.classList.remove('carousel__pagination__button--active'))
            let activeIndex = Math.floor(((index - this.offset) % count) / this.option.slidesToScroll)
            buttons[activeIndex] && buttons[activeIndex].classList.add('carousel__pagination__button--active')
        })
    }

    next() {
        this.gotoItem(this.currentItem + this.slidesToScroll)
    }

    prev() {
        this.gotoItem(this.currentItem - this.slidesToScroll)
    }
    /**
     * 
     * @param {number} index 
     * @param {boolean} {animation=true}
     * @returns 
     */
    gotoItem(index, animation = true) {
        if (index < 0) {
            if (this.option.loop) {
                index = this.items.length - this.slidesVisible

            } else {
                return
            }
        } else if (index >= this.items.length || (this.items[this.currentItem + this.slidesVisible] === undefined && index > this.currentItem)) {
            if (this.option.loop) {
                index = 0
            } else {
                return
            }
        }
        let translateX = index * -100 / this.items.length
        if (animation === false) {
            this.container.style.transition = 'none'
        }
        this.container.style.transform = 'translate3d(' + translateX + '%, 0, 0)'
        this, this.container.offsetHeight  //force repaint
        this.currentItem = index
        if (animation === false) {
            this.container.style.transition = ''
        }
        this.moveCallbacks.forEach(cb => cb(index))
    }

    /**
     * Deplace le container pour donner l'impression d'un slide infinie
     */
    resetInfinite() {
        if (this.currentItem <= this.option.slidesToScroll) {
            this.gotoItem(this.currentItem + (this.items.length - 2 * this.offset), false)
        } else if (this.currentItem >= this.option.slidesToScroll) {
            this.gotoItem(this.currentItem - (this.items.length - 2 * this.offset), false)
        }
    }

    onMove(callback) {
        this.moveCallbacks.push(callback)
    }

    onWindowResize() {
        let mobile = window.innerWidth < 800
        if (mobile !== this.isMobile) {
            this.isMobile = mobile
            this.setStyle()
            this.moveCallbacks.forEach(cb => cb(this.currentItem))
        }
    }

    /**
     * 
     * @param {string} className 
     * @returns {HTMLElement}
     */
    createDivWithClass(className) {
        let div = document.createElement('div')
        div.setAttribute('class', className)
        return div
    }

    /**
     * 
     * @returns {number}
     */
    get slidesToScroll() {
        return this.isMobile ? 1 : this.option.slidesToScroll
    }

    /**
     * @returns {number}
     */
    get slidesVisible() {
        return this.isMobile ? 1 : this.option.slidesVisible
    }

}

let onReady = function () {

    const slides = document.querySelectorAll('.hero__image')
    let current = 0

    setInterval(() => {
        slides[current].classList.remove('active')
        current = (current + 1) % slides.length
        slides[current].classList.add('active')
    }, 4000)

    new Carousel(document.querySelector('#carouselRealisations'), {
        slidesToScroll: 1,
        slidesVisible: 3
    })

    const choixBtns = document.querySelectorAll('.choix__btn')

    choixBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Enlève active sur tous
            choixBtns.forEach(b => b.classList.remove('active'))
            // Met active sur celui cliqué
            btn.classList.add('active')
        })
    })

    const burger = document.getElementById('burger')
    const navLinks = document.getElementById('navLinks')

    // Ouvre et ferme le menu au clic sur le burger
    burger.addEventListener('click', () => {
        navLinks.classList.toggle('open')
    })

    // Ferme le menu quand on clique sur un lien
    navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('open')
        })
    })

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible')
            }
        })
    }, { threshold: 0.1 })

    // On cible tous les éléments importants automatiquement
    document.querySelectorAll(`
    .apropos__vision,
    .st_studio,
    .st_domicile,
    .st_bapteme,
    .st_even,
    .apropos__realisations,
    .reservation__form,
    .footer__logo,
    .footer__nav,
    .footer__contact,
    .hero__content h1,
    .hero__buttons,
    .hero__text,
    .section__titre
`).forEach(el => {
        el.classList.add('apparaitre')
        observer.observe(el)
    })

    const form = document.querySelector('.reservation__form')

    form.addEventListener('submit', async (e) => {
        e.preventDefault()

        const nom = document.getElementById('nomcomplet').value
        const email = document.getElementById('email').value
        const telephone = document.getElementById('telephone').value
        const date = document.getElementById('date').value

        if (!nom || !email || !telephone || !date) {
            alert('Veuillez remplir tous les champs !')
            return
        }

        const reponse = await fetch(form.action, {
            method: 'POST',
            body: new FormData(form),
            headers: { 'Accept': 'application/json' }
        })

        const popup = document.getElementById('popup')
        const popupMessage = document.getElementById('popupMessage')
        const popupClose = document.getElementById('popupClose')

        // Ferme le popup
        popupClose.addEventListener('click', () => {
            popup.classList.remove('visible')
        })

        // Dans le submit
        if (reponse.ok) {
            popupMessage.textContent = 'Réservation confirmée ! Nous vous contacterons bientôt.'
            popup.classList.add('visible')
            form.reset()
        } else {
            popupMessage.textContent = 'Une erreur est survenue. Veuillez réessayer !'
            popup.classList.add('visible')
        }
    })

    // ── SCROLLSPY ──
    const sections = document.querySelectorAll('section[id]')
    const navAnchors = document.querySelectorAll('.nav__links a')

    const scrollspy = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Enlève active sur tous les liens
                navAnchors.forEach(link => link.classList.remove('active'))

                // Trouve le lien qui correspond à la section visible
                const lienActif = document.querySelector(
                    `.nav__links a[href="#${entry.target.id}"]`
                )

                // Ajoute active sur ce lien
                if (lienActif) {
                    lienActif.classList.add('active')
                }
            }
        })
    }, {
        threshold: 0.3 // la section doit être visible à 30%
    })

    sections.forEach(section => scrollspy.observe(section))

    document.querySelector('.footer__copyright').textContent =
        `© ${new Date().getFullYear()} Focus Events. Tous droits réservés.`
}

if (document.readyState !== 'loading') {
    onReady()
} else {
    document.addEventListener('DOMContentLoaded', onReady)
}

