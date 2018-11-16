const shortid = require('shortid');
const fs = require('fs');
const request = require('request');
const gm = require('gm');
const config = require('../config');

const uploadDir = '/convert';
const fullUploadDir = __dirname + uploadDir;

const convertPicture = async ({ stream, filename }) => {
  const id = shortid.generate()
  const destinationPath = `${fullUploadDir}/${filename}-${id}.${config.gm.image_format}`
  return new Promise((resolve, reject) =>
    gm(stream)
      .setFormat(`${config.gm.image_format}`)
      .resize(config.gm.image_width,config.gm.image_height)
      .write(destinationPath, error =>
        {
          if(error)
          {
            reject()
          }
          else{
            resolve( {path: destinationPath} )
          }
      })
  )
}

const postImage = ({path}) => {
   return new Promise((resolve, reject) => {
    var req = request({
      headers: {'Content-Type' : 'image/jpeg'},
      url:     config.imageserver.url,
      method: "POST"
    }, function optionalCallback (err, httpResponse, body) {
      if (err) {
        reject();
      }
      else{
        var bodyJson = JSON.parse(body)
        var url = bodyJson.url;
        resolve({url});
      }
    });
    var form = req.form();
    form.append('postimage', fs.createReadStream(path))
   });
};

const createUploadFolderIfNeeded = async () => {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(fullUploadDir)){
      fs.mkdirSync(fullUploadDir);
    }
    resolve()
  });
}

const deletePictureFromTempFolder = async ({path})=> {
  return new Promise((resolve, reject) => {
    if (fs.existsSync(path), err => reject(err)){
      fs.unlinkSync(path, (err)=>reject(err))
    }
    resolve()
  });
}

const processUpload = async upload => {
  const { stream, filename } = await upload;
  await createUploadFolderIfNeeded()
  const { path } = await convertPicture({ stream, filename });
  const {url} = await postImage({path});
  await deletePictureFromTempFolder({path});
  return {url, path};
}

module.exports = {processUpload}