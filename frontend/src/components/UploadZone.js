import React from 'react';

function UploadZone({ setFiles }) {
  const handleFileChange = (e) => {
    // Niraya files-a select panna Array-ah mathurom
    setFiles(Array.from(e.target.files));
  };

  return (
    <div style={{ border: '2px dashed #ccc', padding: '20px', textAlign: 'center' }}>
      <input 
        type="file" 
        multiple 
        onChange={handleFileChange} 
        accept="image/*"
      />
      <p>Drag and drop or select multiple marketing images [cite: 67]</p>
    </div>
  );
}

export default UploadZone;