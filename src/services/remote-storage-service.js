var config = require('../config/settings'),
    logger = require('./logger'),
    constants = require('../models/constants.js'),
    uuid = require('uuid'),
    aws = require('aws-sdk'),
    s3c = require('s3'),
    _ = require('lodash'),
    S3Sizer = require('aws-s3-size');

aws.config.loadFromPath(__dirname + '/aws.json');

function getTotalUserFolderSize(user,callback) {
    new S3Sizer({configFile:__dirname + '/aws.json'}).getFolderSize(config.getConfig().s3BucketName, user._id.toString(),callback);           
}

function uploadFile(localPath,user,callback) {
    var client = s3c.createClient(
        {
            s3Client: new aws.S3({params: {Bucket: config.getConfig().s3BucketName}})
        });
 
    // separate users have their PDFs separate per a prefix which is their user
    // object ID. for now.
    var fileKey = user._id + '/' + uuid.v1() + '.pdf'; 
 
    var uploadParams = {
        localFile: localPath,
        s3Params: {
            Key: fileKey
        }
    };
    var uploader = client.uploadFile(uploadParams);
    logger.log('Starting upload of', localPath);
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

function downloadFileToStream(remoteData,targetStream,cb) {
    var downloadSize = 0;
 
    var s3 = new aws.S3({
        params: {
            Bucket: config.getConfig().s3BucketName,
        }
       });
    s3.getObject({Key:remoteData.data.remoteKey}).createReadStream()
    .on('error', function(err) {
        console.log('err');
        cb(err);
    })
    .on('data', function(chunk){
        downloadSize+=chunk.length;
    })    
    .on('end', function(){
        cb(null,downloadSize);
    })
    .pipe(targetStream);
}

function removeFile(remoteData,cb) {
    var s3 = new aws.S3({
        params: {
            Bucket: config.getConfig().s3BucketName,
        }
       });
    s3.deleteObject({Key:remoteData.data.remoteKey},cb);    
}

function removeFiles(remoteDatas,cb) {
    if(!remoteDatas || remoteDatas.length == 0)
        return cb();
    
    var params = {Delete:{
            Objects: _.map(remoteDatas,function(value){return {Key:value.data.remoteKey}})
        }};
    
    var s3 = new aws.S3({
        params: {
            Bucket: config.getConfig().s3BucketName,
        }
       });
    s3.deleteObjects(params,function(err,data) {
        if (err) console.log(err, err.stack); // an error occurred
        else     console.log(data);           // successful response
        cb(err);
        
    });      
}

module.exports = {
	uploadFile:uploadFile,
    downloadFileToStream:downloadFileToStream,
    removeFile:removeFile,
    removeFiles:removeFiles,
    getTotalUserFolderSize:getTotalUserFolderSize
};