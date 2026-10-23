const layers = [
  {
    canvas: document.querySelector('#inner-canvas'),
    element: document.querySelector('#inner-card'),
    name: 'inner',
  },
  {
    canvas: document.querySelector('#middle-canvas'),
    element: document.querySelector('#middle-card'),
    name: 'middle',
  },
  {
    canvas: document.querySelector('#outer-canvas'),
    element: document.querySelector('#outer-card'),
    name: 'outer',
  },
]

const status = document.querySelector('#support')
const fallback = document.querySelector('#fallback')
const clicker = document.querySelector('#clicker')
const counter = document.querySelector('#counter')
const interactionMode = document.querySelector('#interaction-mode')
const effectControls = [...document.querySelectorAll('[data-layer][data-effect]')]
const clearEffects = document.querySelector('#clear-effects')
const supportsHtmlInCanvas = typeof CanvasRenderingContext2D.prototype.drawElementImage === 'function'
const pointer = { x: window.innerWidth / 2, y: window.innerHeight / 2 }
const enabledEffects = new Map()

const syncEffectControls = () => {
  enabledEffects.clear()
  for (const input of effectControls) {
    if (!input.checked) continue
    const effectsForLayer = enabledEffects.get(input.dataset.layer) ?? []
    effectsForLayer.push(input.dataset.effect)
    enabledEffects.set(input.dataset.layer, effectsForLayer)
  }
  if (supportsHtmlInCanvas) requestPaintChain()
}

for (const input of effectControls) input.addEventListener('change', syncEffectControls)
clearEffects.addEventListener('click', () => {
  for (const input of effectControls) input.checked = false
  syncEffectControls()
})

document.addEventListener('pointermove', (event) => {
  pointer.x = event.clientX
  pointer.y = event.clientY
})

const configureCanvas = (canvas) => {
  if ('content' in HTMLCanvasElement.prototype) {
    canvas.setAttribute('content', 'drawable')
  } else {
    canvas.setAttribute('layoutsubtree', '')
  }
}

/**
 * Draws one DOM subtree into its canvas.
 *
 * @example
 * paintLayer({ canvas, element })
 */
const snapshotCanvas = (canvas) => {
  const snapshot = new OffscreenCanvas(canvas.width, canvas.height)
  snapshot.getContext('2d').drawImage(canvas, 0, 0)
  return snapshot
}

const pixelate = (canvas, context) => {
  const snapshot = snapshotCanvas(canvas)
  const blockSize = Math.max(8, Math.round(13 * window.devicePixelRatio))
  const width = Math.max(1, Math.ceil(canvas.width / blockSize))
  const height = Math.max(1, Math.ceil(canvas.height / blockSize))
  const tiny = new OffscreenCanvas(width, height)
  const tinyContext = tiny.getContext('2d')
  tinyContext.imageSmoothingEnabled = false
  tinyContext.drawImage(snapshot, 0, 0, width, height)
  context.clearRect(0, 0, canvas.width, canvas.height)
  context.imageSmoothingEnabled = false
  context.drawImage(tiny, 0, 0, width, height, 0, 0, canvas.width, canvas.height)
}

const fisheye = (canvas, context) => {
  const snapshot = snapshotCanvas(canvas)
  const bounds = canvas.getBoundingClientRect()
  const centerX = ((pointer.x - bounds.left) / bounds.width) * canvas.width
  const centerY = ((pointer.y - bounds.top) / bounds.height) * canvas.height
  const radius = Math.min(canvas.width, canvas.height) * 0.32
  const tile = Math.max(12, Math.round(14 * window.devicePixelRatio))

  context.drawImage(snapshot, 0, 0)
  context.save()
  context.beginPath()
  context.arc(centerX, centerY, radius, 0, Math.PI * 2)
  context.clip()

  for (let y = centerY - radius; y < centerY + radius; y += tile) {
    for (let x = centerX - radius; x < centerX + radius; x += tile) {
      const deltaX = x + tile / 2 - centerX
      const deltaY = y + tile / 2 - centerY
      const distance = Math.hypot(deltaX, deltaY)
      if (distance > radius) continue
      const normalized = distance / radius
      const sourceScale = 0.38 + normalized * normalized * 0.62
      const sourceX = centerX + deltaX * sourceScale - tile / 2
      const sourceY = centerY + deltaY * sourceScale - tile / 2
      context.drawImage(snapshot, sourceX, sourceY, tile, tile, x, y, tile + 1, tile + 1)
    }
  }

  context.restore()
  context.save()
  context.strokeStyle = 'rgb(199 146 255 / 70%)'
  context.lineWidth = 3 * window.devicePixelRatio
  context.beginPath()
  context.arc(centerX, centerY, radius, 0, Math.PI * 2)
  context.stroke()
  context.restore()
}

const psychedelic = (canvas, context) => {
  const snapshot = snapshotCanvas(canvas)
  const scale = window.devicePixelRatio
  const phase = performance.now() / 24
  const offset = (5 + Math.sin(performance.now() / 260) * 3) * scale

  context.clearRect(0, 0, canvas.width, canvas.height)
  context.save()
  context.filter = `hue-rotate(${phase}deg) saturate(2.2) contrast(1.12)`
  context.globalAlpha = 0.78
  context.drawImage(snapshot, 0, 0)
  context.globalCompositeOperation = 'screen'
  context.globalAlpha = 0.32
  context.filter = `hue-rotate(${phase + 120}deg) saturate(3)`
  context.drawImage(snapshot, offset, 0)
  context.filter = `hue-rotate(${phase + 240}deg) saturate(3)`
  context.drawImage(snapshot, -offset, 0)
  context.restore()
}

const effects = { pixelate, fisheye, psychedelic }

const paintLayer = ({ canvas, element, name }) => {
  const context = canvas.getContext('2d')
  context.reset()
  const transform = context.drawElementImage(element, 0, 0)

  // Chrome <155 returned a transform used to align hit testing.
  if (transform !== undefined && typeof transform?.toString === 'function') {
    element.style.transform = transform.toString()
  } else if (element.style.transform) {
    element.style.transform = ''
  }

  for (const effect of enabledEffects.get(name) ?? []) effects[effect](canvas, context)
}

const requestPaintChain = () => {
  layers[0].canvas.requestPaint()
}

const resizeLayer = ({ canvas }) => {
  const bounds = canvas.getBoundingClientRect()
  const scale = window.devicePixelRatio
  const width = Math.round(bounds.width * scale)
  const height = Math.round(bounds.height * scale)

  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width
    canvas.height = height
  }
}

clicker.addEventListener('click', () => {
  counter.textContent = String(Number(counter.textContent) + 1)
  if (supportsHtmlInCanvas) requestPaintChain()
})

if (supportsHtmlInCanvas) {
  status.textContent = 'API active · click the deepest layer'
  status.classList.add('supported')
  interactionMode.textContent = 'Canvas mode: a click proves nested hit-testing reached the real button.'
  syncEffectControls()

  for (const [index, layer] of layers.entries()) {
    configureCanvas(layer.canvas)
    layer.canvas.addEventListener('paint', () => {
      paintLayer(layer)
      const parent = layers[index + 1]
      if (parent) queueMicrotask(() => parent.canvas.requestPaint())
    })
  }

  const observer = new ResizeObserver(() => {
    for (const layer of layers) resizeLayer(layer)
    requestPaintChain()
  })

  for (const { canvas } of layers) observer.observe(canvas)

  requestPaintChain()

  const animate = () => {
    requestPaintChain()
    requestAnimationFrame(animate)
  }
  requestAnimationFrame(animate)
} else {
  status.textContent = 'Experimental API unavailable'
  status.classList.add('unsupported')
  fallback.hidden = false
  document.body.classList.add('unsupported-demo')
  clicker.textContent = 'Test ordinary DOM fallback'
  interactionMode.textContent = 'Fallback mode: this click is normal DOM, not a canvas hit-test.'
  document.querySelector('#effect-controls').disabled = true

  // A normal browser understands <canvas>, so its fallback children are not
  // painted. Unwrap the same DOM from the inside out to show the composition.
  for (const { canvas, element } of layers) canvas.replaceWith(element)
}
