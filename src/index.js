#!/usr/bin/env node
const standard = require('standard')
const gaze = require('gaze')
const fs = require('fs')
const path = require('path')
const clivas = require('clivas')
const args = require('yargs').argv

// Match all js files outside node_modules.
const glob = ['**/*.js', '!node_modules', '!node_modules/**']

// print ascii art
var artFile = path.join(__dirname, './ascii-art.txt')
var art = fs.readFileSync(artFile, 'utf8')
console.log(art)

// Start analyzing files.
if (!args.watched) run()

// Watch for file changes.
watch()

// Watch for file changes.
// Launch standard after each change until there are no errors,
// displaying only one error at a time.
// This is what we call "standard-focus" ;)
function watch () {
  gaze(glob, function (err, watcher) {
    if (err) throw err

    // Display watched files and exit.
    if (args.watched) {
      const files = JSON.stringify(this.watched(), null, '\t')
      console.log('WATCHED FILES:')
      console.log(files)
      process.exit()
    }

    this.on('changed', (file) => {
      run()
    })
  })
}

function run () {
  standard.lintFiles(glob, (err, results) => {
    if (err) throw err

    // Get next error.
    const error = getError(results.results)

    // All good!
    if (!error) {
      clivas.clear()
      clivas.line(`
                    {white:Yay!} Everything looks amazing!

      `)
      process.exit()
    }

    // Display error.
    const message =
    `ERR: {white:${error.file}}:${error.line}:${error.column} ` +
    `--> {red:${error.message}} ` +
    `{yellow:(${error.left} left)}`

    clivas.clear()
    clivas.line(message)
  })

  function getError (errors) {
    // Iterate errors for all files.
    // Count errors and get next error message.
    let total = 0
    let next
    errors.map((error) => {
      if (!error.errorCount) return
      total += error.errorCount
      if (!next) {
        next = error.messages[0]
        next.file = error.filePath
      }
    })

    if (total) next.left = total
    return next
  }
}

