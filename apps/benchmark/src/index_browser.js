import { launch } from 'puppeteer'

const browser = await launch({
  product: process.argv[2],
  headless: true
})

const page = await browser.newPage()
await page.goto(`http://127.0.0.1:${process.env['PORT']}`)

const progress = setInterval(() => process.stdout.write('■'), 1000)

page.on('console', async message => {
  const text = message.text()
  if (text?.startsWith('__DONE__')) {
    clearInterval(progress)
    console.log('%ss', text.replace('__DONE__', ''))
    await browser.close()
  }
})
