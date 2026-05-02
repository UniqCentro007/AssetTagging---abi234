import React from 'react';

function TagInput({ tags, setTags }) {
  return (
    <div style={{ marginBottom: '20px' }}>
      <label><b>Enter Asset Tags:</b></label><br/>
      <input 
        type="text" 
        value={tags}
        placeholder="e.g., brand logo, smiling person"
        onChange={(e) => setTags(e.target.value)}
        style={{ width: '100%', padding: '10px', marginTop: '5px' }}
      />
      <p style={{ fontSize: '12px', color: 'gray' }}>
        Separate tags with commas ( , ) [cite: 32]
      </p>
    </div>
  );
}

export default TagInput;