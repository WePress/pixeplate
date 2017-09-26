const fs = require('fs')
const THREE = require('three')
const through = require('through2')

module.exports = function (opts, model, cb) {
  const s = through()
  const file = fs.createWriteStream(opts.file,'utf8')
  const vector = new THREE.Vector3()
  const normalMatrixWorld = new THREE.Matrix3()

  s.pipe(file)

  s.write('solid\n')

  file.on('error', (e) => { cb(e,null) })
  file.on('close', () => { cb(null, true)

  if (model instanceof THREE.Mesh) {
    const geometry = model.geometry
    const matrixWorld = model.matrixWorld

    if( geometry instanceof THREE.Geometry) {
      var vertices = geometry.vertices
      var faces = geometry.faces
      normalMatrixWorld.getNormalMatrix(matrixWorld)

      for ( var i = 0, l = faces.length; i < l; i ++ ) {
        var face = faces[i]
        vector.copy(face.normal)
              .applyMatrix3(normalMatrixWorld)
              .normalize()

        s.write('\tfacet normal '+vector.x+' '+vector.y+' '+vector.z+'\n'
               +'\t\touter loop\n')

        var indices = [ face.a, face.b, face.c ]

        for ( var j = 0; j < 3; j ++ ) {
          vector.copy(vertices[indices[j]]).applyMatrix4(matrixWorld)
          s.write('\t\t\tvertex '+vector.x+' '+vector.y+' '+vector.z+'\n')
        }

        s.write('\t\tendloop\n\tendfacet\n')
      }
      s.end('endsolid')
    } 
  } else {
    cb(new Error(message:'Input should be a THREE.js mesh'), null)
    return
  }
}
