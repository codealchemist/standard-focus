# standard-focus
Lint your code with StandardJS and focus on one error at a time.

![screenshot](https://cldup.com/KgYRC8SNwu.gif)

## Install

`npm install --save-dev standard-focus`

## Usage

You can use `standard-focus` just like [StandardJS](https://github.com/feross/standard) in your `package.json` scripts:

```
{
  "name": "my-cool-package",
  "devDependencies": {
    "standard-focus": "*"
  },
  "scripts": {
    "test": "standard-focus && node my-tests.js",
    "just-standard-focus": "standard-focus"
  }
}
```

## Why?

I love using [StandardJS](https://github.com/feross/standard) but I wanted to completely focus on fixing one line at a time.
This is exactly what you can do with `standard-focus`.

## What's all about?

Please, see [StandardJS](https://github.com/feross/standard) for further reference.
