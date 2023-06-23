const { userModel } = require('../model')
const AWS = require('aws-sdk')
const fs = require('file-system')
const formidable = require('formidable')

module.exports = {
    file_upload_fn: async (req, res) => {
        const AWSCredentials = {
            accessKey: 'AKIATGOEAPUZQXAKM2ED',
            secret: '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',
            bucketName: 'treeone-one'
        }
        const s3 = new AWS.S3({
            accessKeyId: AWSCredentials.accessKey,
            secretAccessKey: AWSCredentials.secret
        })
        const uploadToS3 = (fileName) => {
            console.log('saroFile', fileName)
            const fileContent = fs.readFileSync(fileName.file.filepath)
            const filePath = fileName.file.originalFilename.replace(/\s/g, '')
            const contentType = fileName.file.mimetype.replace(/\s/g, '')
            const params = {
                Bucket: AWSCredentials.bucketName,
                Key: filePath,
                Body: fileContent,
                ContentType: contentType
            }
            s3.upload(params, async function (err, data) {
                if (err) {
                    throw err;
                }
                const getLastName = data.Location.substring(data.Location.lastIndexOf('/') + 1)
                const getTreeoneLink = "https://fileserver.treeone.one/view/" + getLastName
                console.log(`File upload success.. ${data.Location}`)
                fs.unlinkSync(fileName.file.filepath);
                return res.json(getTreeoneLink)
            })
        }
        const formdata = new formidable.IncomingForm()
        formdata.parse(req, async(_, fields, files) => {
            console.log('saroFilesssss', files)
            uploadToS3(files)
        })
    },
}