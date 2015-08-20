var formidable = require('formidable'),
    fs   = require('fs-extra'),
    util = require('util'),
    path = require("path");

function hashProfilPicName(username, filename, cb){
    var crypto = require('crypto'),
        shasum = crypto.createHash('md5');

    shasum.update(Date.now()+filename);
    cb(username+"_"+shasum.digest('hex')+path.extname(filename));
}

exports.uploadProfilPic = function(token,modelUser, req, res){
  
    var form = new formidable.IncomingForm();
    form.uploadDir = "/home/tiro/tmp/uploadprofil";
    form.parse(req, function(err, fields, files) {
        res.writeHead(200, {'content-type': 'text/plain'});
        res.write('received upload:\n\n');
        res.end(util.inspect({fields: fields, files: files}));
    });

    form.on('progress', function(bytesReceived, bytesExpected) {
        var percent_complete = (bytesReceived / bytesExpected) * 100;
    });

    form.on('end', function(fields, files){
        var temp_path = this.openedFiles[0].path;
        hashProfilPicName(token.username, this.openedFiles[0].name, function(newname){

                var   new_location = path.join(__dirname, '../public/images/profil/');
                
                fs.copy(temp_path, new_location + newname, function (err) {
                   
                });

                modelUser.findOneAndUpdate({username: token.username}, {$set:{profilPicUri:newname}}, function(err, user){
                   if(user.profilPicUri){
                       fs.unlinkSync( path.join(__dirname, '../public/images/profil/',user.profilPicUri));
                   }
                });

        });

    });
}