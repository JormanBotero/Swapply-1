// client/src/services/upload.js
export const uploadImage = async (file) => {
  // Validación básica
  const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
  const maxSize = 10 * 1024 * 1024; // 10MB


  if (!validTypes.includes(file.type)) {
    throw new Error('Tipo de archivo no permitido. Solo JPG, PNG, GIF.');
  }

  if (file.size > maxSize) {
    throw new Error('El tamaño del archivo excede 10MB.');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', 'Swapply'); // Tu preset Unsigned

  const res = await fetch(
    'https://api.cloudinary.com/v1_1/dnvnln2z3/image/upload',
    { method: 'POST', body: formData }
  );

  if (!res.ok) {
    throw new Error('Error subiendo imagen a Cloudinary');
  }

  const data = await res.json();
  return data.secure_url; // URL pública de la imagen
};
