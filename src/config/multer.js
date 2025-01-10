import multer from 'multer';


const storage = multer.memoryStorage();

const uploadmulter = multer({
    storage,
    limits: { fileSize: 20 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedMimeTypes = [
            'image/jpeg', 'image/png', 'image/gif',
            'video/mp4', 'video/mpeg', 'video/quicktime',
            'audio/mpeg', 'audio/wav', 'audio/x-wav', 'audio/aac', 'audio/x-aac', 'audio/mp4', 'audio/x-m4a'
        ];
        if (allowedMimeTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Chỉ chấp nhận file ảnh (JPEG, PNG, GIF), video (MP4, MPEG, MOV) hoặc audio (MP3, WAV, AAC)!'), false);
        }
    },
});

export default uploadmulter;
