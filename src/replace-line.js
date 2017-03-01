const fs = require('fs')
const readline = require('readline')
const stream = require('stream')

function replaceLine ({file, lineNumber, text, callback}) {
  const readStream = fs.createReadStream(file)
  const tempFile = `${file}.standard-focus`
  const writeStream = fs.createWriteStream(tempFile)
  const rl = readline.createInterface(readStream, stream)

  let currentLineNumber = 0
  rl.on('line', (line) => {
    ++currentLineNumber

    // Replace.
    if (currentLineNumber === lineNumber) {
      writeStream.write(text)
      return
    }

    // Save original line.
    writeStream.write(`${line}\n`)
  })

  rl.on('close', () => {
    // Finish writing to temp file and replace files.
    // Replace original file with fixed file (the temp file).
    writeStream.end(() => {
      try {
        const tmpFile = `${file}.tmp`
        fs.renameSync(file, tmpFile)
        fs.renameSync(tempFile, file)
        fs.unlink(tmpFile)
      } catch (e) {
        throw e
      }

      callback({file, lineNumber, text})
    })
  })
}

module.exports = replaceLine
