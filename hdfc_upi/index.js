var crypto = require('crypto')
// SARAVANAN G - 26.11.2022//
// AES 128 ECB ENCRYPTION //
function encryption (input_value, secure_key) {
    if(input_value === null || input_value === '') {
        return 'Input Value is empty !!!!'
    } else if (secure_key === null || secure_key === '') {
        return 'Secure key is empty !!!!'
    } else {
        const cipher = crypto.createCipheriv('aes-128-ecb', Buffer.from(secure_key, 'hex'), null)
        let encrypted_result = cipher.update(input_value, 'utf8', 'hex')
        encrypted_result += cipher.final('hex')
        const encrypted = encrypted_result.toUpperCase()
        return encrypted
    }
}
// AES 128 ECB DECRYPTION //
function decryption (encrypted, secure_key) {
    if(encrypted === null || encrypted === '') {
        return 'Input Value is empty !!!!'
    } else if (secure_key === null || secure_key === '') {
        return 'Secure key is empty !!!!'
    } else {
        const decipher = crypto.createDecipheriv('aes-128-ecb', Buffer.from(secure_key, 'hex'), null)
        let decrypted = decipher.update(encrypted, 'hex', 'utf8')
        decrypted += decipher.final('utf8')
        return decrypted
    }
}
// const input_value = 'HDFC000000000214|10934562742|sumit039@hdfcbank|T|||||||||NA|NA'
// const secure_key = '214abcd43f85c9e68f25fc29d0db62e0'
// const encrypted = encryption(input_value, secure_key)
// const decrypted = decryption(encrypted, secure_key)
// console.log('encrypted: ', encrypted)
// console.log('decrypted: ', decrypted)

module.exports = {
    encryption,
    decryption
}