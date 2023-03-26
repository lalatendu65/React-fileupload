import React, {  useState } from "react";
// import { useDropzone } from "react-dropzone";
// import ReactPlayer from "react-player";
import AWS from "aws-sdk";
// import { LinearProgress } from "@mui/material";
import "./FileDropZone.css"


const MAX_SINGLE_UPLOAD_SIZE = 1024 * 1024 * 1024; //1GB
const MAX_MULTI_UPLOAD_SIZE = 1024 * 1024 * 1024; // 1GB

const s3 = new AWS.S3({
  accessKeyId: "AKIA6INZGGYOAV7BBVM3",
  secretAccessKey: "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",
  region: "Asia Pacific (Mumbai) ap-south-1",
});

const FileDropZone = () => {
    const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showVideo, setShowVideo] = useState(false);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type === "video/mp4") {
      setSelectedFile(file);
    } else {
      alert("Please select an mp4 file.");
    }
  };

  const handleFileDrop = (event) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && file.type === "video/mp4") {
      setSelectedFile(file);
    } else {
      alert("Please drop an mp4 file.");
    }
  };

  const handleFileUploadClick = () => {
    document.getElementById("file-input").click();
  };

  
  const handleUpload = async () => {
    try {
      const fileName = selectedFile.name;
      const fileSize = selectedFile.size;

      if (fileSize <= MAX_SINGLE_UPLOAD_SIZE) {
        // Use single part upload for files smaller than or equal to 5MB
        const params = {
          Bucket: "recats3",
          Key: fileName,
          Body: selectedFile,
        };
        await s3.upload(params).promise();
      } else {
        // Use multipart upload for files larger than 5MB
        const params = {
          Bucket: "recats3",
          Key: fileName,
          ContentType: "video/mp4",
        };
        const { uploadId } = await s3.createMultipartUpload(params).promise();

        const partSize = MAX_MULTI_UPLOAD_SIZE;
        const numParts = Math.ceil(fileSize / partSize);
        const partParams = Array.from({ length: numParts }).map((_, index) => ({
          Bucket: "recats3",
          Key: fileName,
          PartNumber: index + 1,
          UploadId: uploadId,
          Body: selectedFile.slice(index * partSize, (index + 1) * partSize),
        }));

        const { Parts: uploadedParts } = await Promise.all(
          partParams.map((params) => s3.uploadPart(params).promise())
        );

        await s3
          .completeMultipartUpload({
            Bucket: "recats3",
            Key: fileName,
            UploadId: uploadId,
            MultipartUpload: { Parts: uploadedParts },
          })
          .promise();
      }

      // Set state to show the video element and hide the dropzone
      setUploadProgress(100);
      setShowVideo(true);
      setSelectedFile(null);
    } catch (error) {
      console.error(error);
    }
  };




    return (
      <div
        className="file-drop-zone"
        onDrop={handleFileDrop}
        onDragOver={(event) => event.preventDefault()}
      >
        <input
          id="file-input"
          type="file"
          accept=".mp4"
          onChange={handleFileUpload}
          style={{ display: "none" }}
        />
        <div className="drop-zone-text">Drop an mp4 file here</div>
        <button type="button" onClick={handleFileUploadClick}>
          Select File
        </button>
        {selectedFile && (
          <div className="file-preview">{selectedFile.name}</div>
        )}
        {selectedFile && (
          <div className="upload-progress">{uploadProgress}% uploaded</div>
        )}
        {selectedFile && (
          <button type="button" onClick={handleUpload}>
            Upload
          </button>
        )}
      </div>
    );
  
  
}
export default FileDropZone
    