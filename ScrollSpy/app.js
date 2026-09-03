const ratio = .6

const activate = function (elem) {
  const id = elem.getAttribute('id')
  const anchor = document.querySelector(`a[href="#${id}"]`)
  if (anchor === null) {
    return null
  }
  anchor.parentElement
    .querySelectorAll('.active')
    .forEach(node => node.classList.remove('active'))
  anchor.classList.add('active')
}

const callback = function (entries) {
  entries.forEach(function (entry) {
    if (entry.isIntersecting) {
      activate(entry.target)
    }
  })
}

const y = Math.round(window.innerHeight * ratio)
const observer = new IntersectionObserver(callback, {
  rootMargin: `-${window.innerHeight - y - 1}px 0px -${y}px 0px`
})

document.querySelectorAll('[data-spy]').forEach(function (section) {
    observer.observe(section)
})