var config = require('../config/settings'),
    logger = require('./logger'),
    constants = require('../models/constants.js'),
    uuid = require('uuid'),
    aws = require('aws-sdk'),
    s3c = require('s3');

aws.config.loadFromPath(__dirname + '/aws.json');

function uploadFile(localPath,callback) {
    var client = s3c.createClient(
        {
            s3Client: new aws.S3({params: {Bucket: config.getConfig().s3BucketName}})
        });
 
    var fileKey = "shared/" + uuid.v1() + ".pdf"; 
 
    var uploadParams = {
        localFile: localPath,
        s3Params: {
            Key: fileKey
        }
    };
    var uploader = client.uploadFile(uploadParams);
    logger.error('Starting upload of', localPath);
    uploader.on('error', function(err) {
        logger.error('unable to upload:', err.stack);
        callback(err);
    });
    uploader.on('end', function() {
        logger.log('done uploading to',fileKey);
        callback(null,{
            sourceType: constants.eSourceS3,
            data: {
                remoteKey:fileKey
            }
        });
    });    
}

function downloadFileToStream(remoteData,targetStream) {
 
    var s3 = new aws.S3({
        params: {
            Bucket: config.getConfig().s3BucketName,
        }
       });
    s3.getObject({Key:remoteData.data.remoteKey}).createReadStream().pipe(targetStream);
}


module.exports = {
	uploadFile:uploadFile,
    downloadFileToStream:downloadFileToStream
};