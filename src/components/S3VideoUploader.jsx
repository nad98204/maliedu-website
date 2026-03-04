import React, { useState } from 'react';
import { uploadVideoToS3 } from '../utils/s3UploadService';
import { UploadCloud, CheckCircle, AlertCircle, X } from 'lucide-react';

const S3VideoUploader = ({ onUploadSuccess }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [uploadedUrl, setUploadedUrl] = useState('');

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.type.startsWith('video/')) {
        setFile(selectedFile);
        setError(null);
        setUploadedUrl('');
      } else {
        setError('Vui lòng chọn một file video hợp lệ (mp4, mkv, webm...).');
        setFile(null);
      }
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    try {
      setUploading(true);
      setError(null);
      setProgress(0);

      const videoUrl = await uploadVideoToS3(file, (percent) => {
        setProgress(percent);
      });

      setUploadedUrl(videoUrl);
      if (onUploadSuccess) {
        onUploadSuccess(videoUrl);
      }

    } catch (err) {
      setError(err.message || 'Có lỗi xảy ra trong quá trình upload.');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setUploadedUrl('');
    setError(null);
    setProgress(0);
  };

  return (
    <div className="p-4 border border-blue-200 rounded-lg bg-blue-50 max-w-lg mx-auto shadow-sm">
      <h3 className="text-lg font-semibold text-blue-800 mb-4 flex items-center">
        <UploadCloud className="w-5 h-5 mr-2" />
        Tải video lên Long Vân Cloud
      </h3>

      {!file && !uploadedUrl && (
        <div className="border-2 border-dashed border-blue-300 bg-white p-6 rounded-lg text-center cursor-pointer hover:bg-blue-50 transition-colors">
          <label className="cursor-pointer flex flex-col items-center">
            <UploadCloud className="w-10 h-10 text-blue-400 mb-2" />
            <span className="text-sm text-gray-600">Nhấn để chọn file video của bạn</span>
            <input 
              type="file" 
              className="hidden" 
              accept="video/*" 
              onChange={handleFileChange} 
            />
          </label>
        </div>
      )}

      {file && !uploading && !uploadedUrl && (
        <div className="bg-white p-4 rounded-lg flex items-center justify-between shadow-sm border border-gray-100">
          <div className="overflow-hidden">
            <p className="text-sm font-medium text-gray-800 truncate">{file.name}</p>
            <p className="text-xs text-gray-500">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
          </div>
          <div className="flex space-x-2">
            <button 
              onClick={handleRemoveFile}
              className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <button 
              onClick={handleUpload}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition"
            >
              Tải lên ngay
            </button>
          </div>
        </div>
      )}

      {uploading && (
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <p className="text-sm font-medium text-gray-800 mb-2">Đang tải lên... {progress}%</p>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      )}

      {uploadedUrl && (
        <div className="bg-green-50 p-4 border border-green-200 rounded-lg">
          <div className="flex items-center text-green-700 mb-2">
            <CheckCircle className="w-5 h-5 mr-2" />
            <span className="font-medium">Upload thành công!</span>
          </div>
          <p className="text-sm text-gray-600 mb-2">File video của bạn đã sẵn sàng sử dụng.</p>
          <input 
            type="text" 
            readOnly 
            value={uploadedUrl} 
            className="w-full bg-white border border-green-300 rounded p-2 text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-green-500"
            onClick={(e) => e.target.select()}
          />
          <button 
            onClick={() => {
              navigator.clipboard.writeText(uploadedUrl);
              alert('Đã copy đường dẫn video!');
            }}
            className="mt-2 text-xs font-semibold text-green-700 underline hover:text-green-800"
          >
            Copy link
          </button>
          
          <div className="mt-4 pt-4 border-t border-green-200">
            <button
               onClick={handleRemoveFile}
               className="text-xs text-gray-600 hover:text-blue-600 font-medium flex items-center"
            >
              <UploadCloud className="w-3 h-3 mr-1" />
              Tải lên video khác
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg flex items-start border border-red-200">
          <AlertCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default S3VideoUploader;
