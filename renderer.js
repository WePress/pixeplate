import yaml from 'yamljs'
import imageToPlate from './imageToPlate.js'
import exportStl from './exportStl.js'
import floydDither from 'floyd-steinberg'
import getPixels from 'get-pixels'
import path from 'path'
import proc from 'child_process'

const conf = yaml.load(__dirname.replace('/dist','')+'/default.yml')

const cvs = document.createElement('canvas')
const ctx = cvs.getContext('2d')
document.body.appendChild(cvs)

const log = document.querySelector('.status span')
const spinner = document.querySelector('.spinner')
spinner.style.opacity = 0

document.addEventListener('drop', (e) => { 
  e.preventDefault()
	if (e.dataTransfer.files.length !== 1) return false

  let file = e.dataTransfer.files[0]
  const ext = path.extname(file) 
  const stlPath = file.replace(ext, '.stl') 

  log.innerHTML = 'loading ' + file.path

  getPixels(opts.file, (e, pixels) => { 
    const w = pixels.shape[0]
    const h = pixels.shape[1]
    const packagedPixels = {
      width : w, height: h, data: pixels.data, stlFileName: stlPath
    }

    // dither image!
    pixels.data = floydDither(pixels).data
    packagedPixels.data = pixels.data

    // draw preview to html canvas
    const data = new ImageData(
      new Uint8ClampedArray(pixels.data),
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

    const plate = imageToPlate({conf:conf,file:file.path})

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
