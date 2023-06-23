const redisclient = require('./config')
async function call() {
    await redisclient.redisclient.setkey('key', 'value');
    const value = await redisclient.redisclient.getkey('key');
    console.log(value)
}

call()


