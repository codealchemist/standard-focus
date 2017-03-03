#!/usr/bin/env node
const standard = require('standard')
const gaze = require('gaze')
const fs = require('fs')
const path = require('path')
const clivas = require('clivas')
const args = require('yargs').argv
const replaceLine = require('line-replace')

let fixing = false
let lastMessage
let currentError

// Set command line input.
const readline = require('readline')
readline.emitKeypressEvents(process.stdin)
process.stdin.setRawMode(true)

// Hide cursor.
clivas.cursor(false)

// Match all js files outside node_modules.
const glob = ['**/*.js', '!node_modules', '!node_modules/**']

// print ascii art
var artFile = path.join(__dirname, './ascii-art.txt')
var art = fs.readFileSync(artFile, 'utf8')
console.log(art)
console.log('Press ENTER key to auto fix current line or "q" to quit.')
console.log()

// Start analyzing files.
if (!args.watched) run()

// Watch for file changes.
watch()

// Set event listeners.
setEvents()

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
    currentError = getError(results.results)

    // All good!
    if (!currentError) {
      clivas.clear()
      clivas.line(`
                    {white:Yay!} Everything looks amazing!

      `)
      process.exit()
    }

    // Display error.
    lastMessage =
    `ERR: {white:${currentError.file}}:${currentError.line}:${currentError.column} ` +
    `--> {red:${currentError.message}} ` +
    `{yellow:(${currentError.left} left)}`

    // Display error.
    clivas.clear()
    clivas.line(lastMessage)
  })
}

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

/**
 * Returns fixed code.
 *
 * @param  {string} code
 * @return {string}
 */
function fix (error, callback) {
  const source = error.source

  // Fix: Comment unused code.
  if (error.message.match(/(is assigned a value but never used|is defined but never used)/)) {
    const fixedString = `// ${source} // TODO: Remove unused code.`

    // Write fix to file.
    replaceLine({
      file: error.file,
      line: error.line,
      text: fixedString,
      callback
    })
    return
  }

  const spaceMatch = error.message.match(/Expected indentation of ([0-9]+) spaces but found ([0-9]+).$/)
  if (spaceMatch) {
    const expectedCount = spaceMatch[1]
    const spaces = ' '.repeat(expectedCount)
    const foundCount = spaceMatch[2]
    const spacesFound = ' '.repeat(foundCount)
    const fixedString = source.replace(spacesFound, spaces)

    // Write fix to file.
    replaceLine({
      file: error.file,
      line: error.line,
      text: fixedString,
      callback
    })
    return
  }

  // Fix: ;
  if (error.message.match(/Extra semicolon/)) {
    const fixedString = source.replace(';', '')

    // Write fix to file.
    replaceLine({
      file: error.file,
      line: error.line,
      text: fixedString,
      callback
    })
    return
  }

  // Fix: Tab.
  if (error.message.match(/(Unexpected tab character)|(Mixed spaces and tabs)/)) {
    const fixedString = source.replace(/\t/g, '  ')

    // Write fix to file.
    replaceLine({
      file: error.file,
      line: error.line,
      text: fixedString,
      callback
    })
    return
  }

  // Fix line using standard.
  standard.lintText(error.source, {fix: true}, (err, results) => {
    if (err) throw err

    const fixedLine = results.results[0]
    let fixedString = fixedLine.output

    let notFixed = false
    if (fixedString && error.source === fixedString.replace('\n', '')) notFixed = true

    if (!fixedString || notFixed) {
      clivas.clear()
      clivas.line(lastMessage)
      clivas.line(`{red:Unable to auto-fix, sorry.}`)
      fixing = false
      return
    }

    // Write fix to file.
    replaceLine({
      file: error.file,
      line: error.line,
      text: `${fixedString}`,
      addNewLine: false,
      callback
    })
  })
}

function setEvents () {
  // User interaction. Autofix? Exit?
  process.stdin.on('keypress', (str, key) => {
    // Exit on q or ctrl+c.
    if (key.name === 'q' || key.sequence === '\u0003') {
      clivas.line(`
        {yellow:Cya later!}
      `)
      process.exit()
    }

    // Auto fix.
    if (key.name === 'return') {
      if (fixing) {
        clivas.line('{red:-- WAIT!} Already fixing a line!')
        return
      }

      fixing = true
      fix(currentError, () => {
        fixing = false
      })
    }
  })
}

