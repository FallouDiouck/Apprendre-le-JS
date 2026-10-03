/**
 * Permet de rajouter la navigation tactile pour le carousel
 */
class CarouselTouchPlugin {

    /**
     * 
     * @param {Carousel} carousel 
     */
    constructor(carousel) {
        carousel.container.addEventListener('dragstart', e => e.preventDefault())
        carousel.container.addEventListener('mousedown', this.startDrag.bind(this))
        carousel.container.addEventListener('touchstart', this.startDrag.bind(this))
        window.addEventListener('mousemove', this.drag.bind(this))
        window.addEventListener('touchmove', this.drag.bind(this))
        window.addEventListener('touchend', this.endDrag.bind(this))
        window.addEventListener('mouseup', this.endDrag.bind(this))
        window.addEventListener('touchcancel', this.endDrag.bind(this))
        this.carousel = carousel
    }

    /**
     * Demarre le deplacement au touvhe
     * @param {MouseEvent|TouchEvent} e 
     */
    startDrag(e) {
        if (e.touches) {
            if (e.touches > 1) {
                return
            } else {
                e = e.touches[0]
            }
        }

        this.origin = { x: e.screenX, y: e.screenY }
        this.width = this.carousel.containerWidth
        this.carousel.disableTransition()
    }

    /**
     * Deplacement
     * @param {MouseEvent|TouchEvent} e 
     */
    drag(e) {
        if (this.origin) {
            let point = e.touches ? e.touches[0] : e
            let translate = { x: point.screenX - this.origin.x, y: point.screenY - this.origin.y }
            let baseTranslate = this.carousel.currentItem * (-100) / this.carousel.items.length
            this.lastTranslate = translate
            this.carousel.translate(baseTranslate + 100 * translate.x / this.width)
        }
    }

    /**
     * Fin du deplacement
     * @param {MouseEvent|TouchEvent} 
     */
    endDrag() {
        if (this.origin && this.lastTranslate) {
            this.carousel.enableTransition()
            if (Math.abs(this.lastTranslate.x / this.carousel.carouselWidth) > 0.2) {
                if (this.lastTranslate.x < 0) {
                    this.carousel.next()
                } else {
                    this.carousel.prev()
                }
            } else {
                this.carousel.gotoItem(this.carousel.currentItem)
            }
        }
        this.origin = null
    }
}


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
        this.moveCallbacks = []

        //Modification du DOM
        this.root = this.createDivWithClass('carousel')
        this.container = this.createDivWithClass('carousel__container')
        this.root.setAttribute('tabindex', '0')
        this.root.appendChild(this.container)
        this.element.appendChild(this.root)
        this.items = children.map((child) => {
            let item = this.createDivWithClass('carousel__item')
            item.appendChild(child)
            return item
        })
        if (this.option.infinite) {
            this.offset = this.option.slidesVisible + this.option.slidesVisible
            if (this.offset > children.length) {
                console.error("Vous n'avez pas assez d'elements dans le caroussel", element)
            }
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

        new CarouselTouchPlugin(this)
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

            let realIndex = index - this.offset
            if (realIndex < 0) realIndex += count
            if (realIndex >= count) realIndex -= count

            let activeIndex = Math.floor(realIndex / this.option.slidesToScroll)
            buttons[activeIndex] && buttons[activeIndex].classList.add('carousel__pagination__button--active')
        })
    }

    translate(percent) {
        this.container.style.transform = 'translate3d(' + percent + '%, 0, 0)'
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
            this.disableTransition()
        }

        this.translate(translateX)
        this, this.container.offsetHeight  //force repaint
        this.currentItem = index
        if (animation === false) {
            this.enableTransition()
        }
        this.moveCallbacks.forEach(cb => cb(index))
    }

    /**
     * Deplace le container pour donner l'impression d'un slide infinie
     */
    resetInfinite() {
        if (this.currentItem <= this.option.slidesToScroll) {
            this.gotoItem(this.currentItem + (this.items.length - 2 * this.offset), false)
        } else if (this.currentItem >= this.items.length - this.offset) {
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

    disableTransition() {
        this.container.style.transition = 'none'
    }

    enableTransition() {
        this.container.style.transition = ''
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

    /**
     * @returns {number}
     */
    get containerWidth() {
        return this.container.offsetWidth
    }

    /**
     * @returns {number}
     */
    get carouselWidth() {
        return this.root.offsetWidth
    }

}

let onReady = function () {

    new Carousel(document.querySelector('#carousel1'), {
        slidesToScroll: 3,
        slidesVisible: 3,
        loop: false
    })

    new Carousel(document.querySelector('#carousel2'), {
        slidesToScroll: 2,
        slidesVisible: 2,
        infinite: true,
        pagination: true
    })

    new Carousel(document.querySelector('#carousel3'), {
        slidesToScroll: 1,
        slidesVisible: 1
    })
}

if (document.readyState !== 'loading') {
    onReady()
}

document.addEventListener('DOMContentLoaded', onReady)