const yaml = require('yamljs')
const imageToPlate = require('./imageToPlate.js')
const exportStl = require('./exportStl.js')
const floydDither = require('floyd-steinberg')
const getPixels = require('get-pixels')
const path = require('path')
const proc = require('child_process')

const conf = yaml.load(__dirname.replace('/dist','')+'/default.yml')

const cvs = document.createElement('canvas')
const ctx = cvs.getContext('2d')
document.body.appendChild(cvs)

const log = document.querySelector('.status span')
const spinner = document.querySelector('.spinner')
spinner.style.opacity = 0

console.log('loading!')

document.addEventListener('drop', (e) => { 
  e.preventDefault()
	if (e.dataTransfer.files.length !== 1) return false

  var file = e.dataTransfer.files[0]
  const ext = path.extname(file.path) 
  const stlPath = file.path.replace(ext, '.stl') 

  log.innerHTML = 'loading ' + file.path

  getPixels(file.path, (e, pixels) => { 
    const w = pixels.shape[0]
    const h = pixels.shape[1]

    // dither image!
    const dither = floydDither(pixels)

    // draw preview to html canvas
    const data = new ImageData(
      new Uint8ClampedArray(dither.data),
        pixels.shape[0],
        pixels.shape[1]
    )

    ctx.clearRect(0, 0, cvs.width, cvs.height);
    cvs.width = data.width
    cvs.height = data.height
    cvs.style.marginLeft = -(data.width/2) + 'px' 
    cvs.style.marginTop = -(data.height/2) + 'px'
    ctx.putImageData(data,0,0)

    // process pixels & get THREE.js model for export
    log.innerHTML = '|･ω･)ﾉ making 3D plate from image pixels...'
    spinner.style.opacity = 1

    const plate = imageToPlate({
      width : w,
      height: h,
      conf: conf,
      data: dither.data
    })

    // export THREE.js model to file
    exportStl({file: stlPath}, plate, (e,success) => {
      if (e) log.innerHTML = e.message
      else {
        log.innerHTML = 'wrote STL file to ' + stlPath
        spinner.style.opacity = 0
        proc.exec('open '+path.dirname(stlPath), (e,se,so) => { 
           console.log(e,se,so) 
        })
      }
    })
  })
}, false)

document.addEventListener('dragover', (e) => {e.preventDefault()}, false)
