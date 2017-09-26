import path from 'path'
import _ from 'underscore'
import THREE from 'three'
import exportStl from './exportStl.js'
import floydDither from 'floyd-steinberg'
import getPixels from 'get-pixels'
import yaml from 'yamljs'

const conf = yaml.load(__dirname.replace('/dist','')+'/default.yml')

const pixelGeo = new THREE.CubeGeometry(
  conf.printer.line, 
  conf.printer.line, 
  conf.printer.line
)

const map = { // front : 8,9 & back : 10,11
  right : 0, // faces 0,1
  left : 2, // faces 2,3
  top : 4, // faces 4,5
  bottom : 6 // faces 6,7
}

export default function (opts, output) {
  // output is a callback expecting an object {log:string,pixels:pixarray}
  const ext = path.extname(opts.file) // file extension
  const stlPath = opts.file.replace(ext, '.stl') 

  getPixels(opts.file, (e, pixels) => { 
    const w = pixels.shape[0]
    const h = pixels.shape[1]
    const packagedPixels = {
      width : w, height: h, data: pixels.data, stlFileName: stlPath
    }

    // dither image!
    pixels.data = floydDither(pixels).data
    packagedPixels.data = pixels.data

    output({preview:pixels})
    output({log:'|･ω･)ﾉ making 3D plate from image pixels...'})

    setTimeout(() => {
      pixelsToGeometry(packagedPixels, output) 
    }, 80)
  })
}

function pixelsToGeometry (opts, output, geo) {
  // 1 unit / pixel is === to 1 mm
  // units have to equal printer line width
  const geo = new THREE.Geometry()
  const w = opts.width
  const h = opts.height
  const baseWidth = (w*conf.printer.line) + conf.plate.basePadding
  const baseHeight = (h*conf.printer.line) + conf.plate.basePadding
  const pixArray = opts.data
 
  for(let y = 0; y < h; y++) { // y row
    for(let x = 0; x < w; x++) { // x across y
      const val = pixArray[((w*y)+x)*4]

      const sides = { // find connected pixels : but don't flag exterior!
        right : pixArray[((w*y)+(x+1))*4],
        left : pixArray[((w*y)+(x-1))*4],
        top : pixArray[((w*(y-1))+x)*4],
        bottom : pixArray[((w*(y+1))+x)*4]
      }

      console.log(sides)
        
      // const sides = { // find connected pixels : but don't flag exterior
      //   right : (pixArray[((w*y)+(x+1))*4] === 0) ? true : false,
      //   left : (pixArray[((w*y)+(x-1))*4] === 0) ? true : false,
      //   top : (pixArray[((w*(y-1))+x)*4] === 0) ? true : false,
      //   bottom : (pixArray[((w*(y+1))+x)*4] === 0) ? true : false
      // }
     
      // if (val===0) makePixel(x,y,sides)
    }
  }

  return

  geo.scale(1,1,conf.plate.pixelHeight) 
  geo.center() 

  const rs = new THREE.Shape()
  const protoBase = 
    roundedRect(rs,0,0,baseHeight,baseWidth,conf.plate.baseBevel)

  const baseGeo = new THREE.ExtrudeGeometry(roundRectShape, {
    amount : conf.plate.baseHeight
  })

  baseGeo.center()
  const base = new THREE.Mesh(baseGeo)
  base.position.z = -conf.plate.pixelHeight
  base.updateMatrix()

  geo.merge(base.geometry, base.matrix)

  const model = new THREE.Mesh(geo)
  model.name = opts.stlFileName
  output({log: 'exporting STL file...'})
  exportStl(model, output)
}


function makePixel (x,y,sides,geo) {
  const pixel = new THREE.Mesh(pixelGeo.clone())
  let m = _.clone(map)

  pixel.position.x = (x * conf.printer.line)
  pixel.position.y = -(y * conf.printer.line)

  _.each(sides, (v,k) => { // remove colliding side
    if (v) { 
      pixel.geometry.faces.splice(m[k],2)
      _.each(m, (f,c) => { if (c!==k) m[c] = f-2})
    }
  })

  pixel.updateMatrix()
  geo.merge(pixel.geometry,pixel.matrix)
}

function roundedRect( ctx, x, y, width, height, radius ) {
   ctx.moveTo( x, y + radius )
   ctx.lineTo( x, y + height - radius )
   ctx.quadraticCurveTo( x, y + height, x + radius, y + height )
   ctx.lineTo( x + width - radius, y + height )
   ctx.quadraticCurveTo(x + width, y + height, x + width, y + height - radius)
   ctx.lineTo( x + width, y + radius )
   ctx.quadraticCurveTo( x + width, y, x + width - radius, y )
   ctx.lineTo( x + radius, y )
   ctx.quadraticCurveTo( x, y, x, y + radius )
}  
