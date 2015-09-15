var formidable = require('formidable'),
    fs   = require('fs-extra'),
    im = require('imagemagick-native'),
    util = require('util'),
    path = require("path");

function hashProfilPicName(username, filename, cb){
    var crypto = require('crypto'),
        shasum = crypto.createHash('md5');

    shasum.update(Date.now()+filename);
    cb(username+"_"+shasum.digest('hex')+path.extname(filename));
}

function hashPostPicName(filename, cb){
    var crypto = require('crypto'),
        shasum = crypto.createHash('md5');

    shasum.update(Date.now()+filename);
    cb("Post_img"+shasum.digest('hex')+path.extname(filename));
}

function getRotate(orientationPic) {
  switch (orientationPic) {
    case "1":
        return 0;
    case "2":
        return 0;
    case "3":
        return 180;
    case "4":
        return 180;
    case "5":
        return 80;
    case "6":
        return 90;
    case "7":    
        return -90;
    case "8":
        return -90;
    default:
        return 0;
  }
}

exports.uploadProfilPic = function(token,orientationPic, modelUser, req, res){
    var form = new formidable.IncomingForm();
    form.uploadDir = "/home/tiro/tmp/uploadprofil";
    form.parse(req, function(err, fields, files) {
      /*  res.writeHead(200, {'content-type': 'text/plain'});
        res.write('received upload:\n\n');
        res.end(util.inspect({fields: fields, files: files}));*/
    });

    form.on('progress', function(bytesReceived, bytesExpected) {
        var percent_complete = (bytesReceived / bytesExpected) * 100;
        console.log(percent_complete);
    });

    form.on('end', function(fields, files){
        var temp_path = this.openedFiles[0].path;
        hashProfilPicName(token.username, this.openedFiles[0].name, function(newname){

                var   new_location = path.join(__dirname, '../public/images/profil/');
                
                fs.writeFileSync(new_location+newname, im.convert({
                    quality : 50,
                    srcData: fs.readFileSync(temp_path),
                    rotate: getRotate(orientationPic),
                    width: 250,
                    height: 250,
                    resizeStyle: 'aspectfit'
                }));

                modelUser.findOneAndUpdate({username: token.username}, {$set:{profilPicUri:newname}}, function(err, user){
                      if(user.profilPicUri){
                        try {
                          fs.unlinkSync( path.join(__dirname, '../public/images/profil/',user.profilPicUri));
                        } catch (e) {
                          console.log("error deleting file");
                        }
                        
                        res.status(200).send('received upload:\n\n');
                      }
                })
               

                

        });

    });
}

exports.uploadPostPic = function(token,decodedToken,PostModel, req, res){
  var Pchecker    = require('../../app/controllers/post.server.createChecker');
  var form = new formidable.IncomingForm();
  var date = Date.now();
  var _fields; 

  form.uploadDir = "/home/tiro/tmp/uploadpost";
  form.parse(req, function(err, fields, files) {
    /*  res.writeHead(200, {'content-type': 'text/plain'});
      res.write('received upload:\n\n');
      res.end(util.inspect({fields: fields, files: files}));*/
    _fields = fields;
  });

   form.on('progress', function(bytesReceived, bytesExpected) {
      var percent_complete = (bytesReceived / bytesExpected) * 100;
      console.log(percent_complete);
  });

 
  form.on('end', function(){
    var file = this.openedFiles[0];
    Pchecker.validFormCreatePhotoMode(_fields,decodedToken,  function(err, result) {
     if(!err){
        var temp_path = file.path;
        hashPostPicName(file.name, function(newname){

          var dateNow = Math.round(new Date().getTime()/1000);

          var   new_location = path.join(__dirname, '../public/images/post/');
                      
          var post = PostModel({
            creator : decodedToken.username,
            rawData : result.rawData,
            timer : dateNow + result.timerPostinSecond,
            dateCreation : dateNow,
            photoData : newname
          });

          console.log(post);


          post.save(function(err) {
            if(err){ 
              console.log(err);
              res.json(err); 
            }else{
                fs.writeFileSync(new_location+newname, im.convert({
                    srcData: fs.readFileSync(temp_path),
                    rotate: getRotate(_fields.orientationPIC),
                    quality : 90,
                    width: 720,
                    height: 1280,
                    resizeStyle: 'aspectfit'
                }));
                 console.log("file saved  "+newname);
                console.log("name db  "+post.photoData);

                res.json({success : true, timerTotal : result.timerTotal, JWToken: token});
            }
          });
        });
     }else{ 
      res.json(result); 
     }

    })   
  })
}