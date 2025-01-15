
import cloudinary from '../config/cloudinary.js';
import { v4 as uuidv4 } from 'uuid';

export const uploadImage = async (files) => {
    try {
        if (!files || files.length === 0) {
            throw new Error('Vui lòng chọn ít nhất một file để upload.');
        }

        const uploadPromises = files.map((file) =>
            new Promise((resolve, reject) => {

                const cleanPublicId = file.originalname
                    .split('.')[0]
                    .trim()
                    .replace(/\s+/g, '_')
                    .replace(/[^a-zA-Z0-9_]/g, '');
                const uniquePublicId = `${cleanPublicId}_${uuidv4()}`;
                cloudinary.uploader.upload_stream(
                    {
                        folder: 'SugoiHub',
                        public_id: uniquePublicId
                    },
                    (error, result) => {
                        if (error) {
                            return reject(error);
                        }
                        if (!result) {
                            return reject(new Error('Upoad thất bại'));
                        }
                        resolve({
                            url: result.secure_url,
                            publicId: result.public_id,
                        });
                    }
                ).end(file.buffer);
            })
        );

        const uploadedFiles = await Promise.all(uploadPromises);
        return uploadedFiles;
    } catch (error) {
        console.error('Upload error details:', error);
        throw new Error(`Upload thất bại: ${error.message}`);
    }
}




export const deleteImage = async (publicId) => {
    try {
        if (!publicId) {
            throw new Error('publicId là bắt buộc để xóa ảnh.');
        }

        const result = await cloudinary.uploader.destroy(publicId);

        if (result.result !== 'ok') {
            throw new Error(`Không thể xóa ảnh với publicId: ${publicId}`);
        }

        console.log(`Ảnh với publicId: ${publicId} đã được xóa.`);
        return result;
    } catch (error) {
        console.error(`Lỗi khi xóa ảnh: ${error.message}`);
        throw new Error(`Xóa ảnh thất bại: ${error.message}`);
    }
};




export const uploadVideo = async (files) => {
    try {
        if (!files || files.length === 0) {
            throw new Error('Vui lòng chọn ít nhất một file để upload.');
        }


        const uploadPromises = files.map(async (file) => {
            if (!file.originalname) {
                throw new Error('File không hợp lệ, thiếu tên file (originalname).');
            }

            const cleanPublicId = file.originalname
                .split('.')[0]
                .trim()
                .replace(/\s+/g, '_')
                .replace(/[^a-zA-Z0-9_]/g, '');
            const uniquePublicId = `${cleanPublicId}_${uuidv4()}`;

            const result = await new Promise((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    {
                        folder: 'SugoiHub_videos',
                        public_id: uniquePublicId,
                        resource_type: 'video',
                    },
                    (error, result) => {
                        if (error) return reject(error);
                        if (!result) return reject(new Error('Upload video thất bại'));
                        resolve({
                            url: result.secure_url,
                            publicId: result.public_id,
                        });
                    }
                );


                uploadStream.end(file.buffer);
            });

            return result;
        });


        const uploadedVideos = await Promise.all(uploadPromises);
        return uploadedVideos;
    } catch (error) {
        console.error('Lỗi upload video:', error.message);
        throw new Error(`Upload nhiều video thất bại: ${error.message}`);
    }
};

export const deleteVideo = async (publicId) => {
    try {
        if (!publicId) {
            throw new Error('publicId là bắt buộc để xóa video.');
        }

        const result = await cloudinary.uploader.destroy(publicId, {
            resource_type: 'video'
        });

        if (result.result !== 'ok') {
            throw new Error(`Không thể xóa video với publicId: ${publicId}`);
        }

        console.log(`Video với publicId: ${publicId} đã được xóa.`);
        return result;
    } catch (error) {
        console.error(`Lỗi khi xóa video: ${error.message}`);
        throw new Error(`Xóa video thất bại: ${error.message}`);
    }
};


export const uploadVoice = async (file) => {
    try {
        if (!file) {
            throw new Error('Vui lòng chọn một file để upload.');
        }

        const cleanPublicId = file.originalname
            .split('.')[0]
            .trim()
            .replace(/\s+/g, '_')
            .replace(/[^a-zA-Z0-9_]/g, '');
        const uniquePublicId = `${cleanPublicId}_${uuidv4()}`;


        const uploadedVoice = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream(
                {
                    folder: 'SugoiHub_voice',
                    public_id: uniquePublicId,
                    resource_type: 'video',
                    format: 'mp3',
                },
                (error, result) => {
                    if (error) {
                        return reject(error);
                    }
                    if (!result) {
                        return reject(new Error('Upload thất bại'));
                    }
                    resolve({
                        url: result.secure_url,
                        publicId: result.public_id,
                    });
                }
            ).end(file.buffer);
        });

        return uploadedVoice;
    } catch (error) {
        console.error('Upload voice error details:', error);
        throw new Error(`Upload thất bại: ${error.message}`);
    }
};

export const deleteVoice = async (publicId) => {
    try {
        if (!publicId) {
            throw new Error('publicId là bắt buộc để xóa ghi âm.');
        }

        const result = await cloudinary.uploader.destroy(publicId, {
            resource_type: 'video'
        });

        if (result.result !== 'ok') {
            throw new Error(`Không thể xóa voice với publicId: ${publicId}`);
        }

        console.log(`Voice với publicId: ${publicId} đã được xóa.`);
        return result;
    } catch (error) {
        console.error('Lỗi xóa ', error);
        throw new Error(`Xóa thất bại: ${error.message}`);
    }
}



