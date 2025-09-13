import React from 'react';
import DemoCard from './DemoCard';

function DemoGrid({ demos, currentUser, username, onAddDemo, onDeleteDemo }) {
  const userRole = currentUser?.role || 'USER';
  const fileSizeLimit = userRole === 'USERPLUS' ? 90 : 15;
  const allowedFormats = userRole === 'USERPLUS' ? 'MP3, WAV' : 'MP3';
  const demoLimit = userRole === 'USERPLUS' ? 6 : 3;
  return (
    <div className="demo-grid-container">
      <div className="demos-header">
        <h3>🎵 Demos</h3>
        {currentUser?.userName === username && (
          <>
            {demos.length < demoLimit ? (
              <button 
                className="add-demo-btn"
                onClick={onAddDemo}
              >
                ➕ Add Demo
              </button>
            ) : (
              <button 
                className="add-demo-btn demos-full"
                disabled
              >
                🚫 Demos Full
              </button>
            )}
          </>
        )}
      </div>
      
      {demos.length > 0 ? (
        <div className="demo-grid">
          {demos.map((demo) => (
            <DemoCard 
              key={demo.id} 
              demo={demo} 
              onDelete={onDeleteDemo}
              canDelete={currentUser?.userName === username}
            />
          ))}
        </div>
      ) : (
        <div className="no-demos">
          <div className="no-demos-content">
            <div className="no-demos-icon">🎵</div>
            <h4>No demos yet</h4>
            <p>Share your musical creations with the world!</p>
            {currentUser?.userName === username && (
              <button 
                className="add-first-demo-btn"
                onClick={onAddDemo}
              >
                Upload Your First Demo
              </button>
            )}
          </div>
        </div>
      )}
      
      {currentUser?.userName === username && demos.length >= demoLimit && (
        <div className="demo-limit-reached">
          <p>🎯 You've reached the demo limit ({demoLimit} demos)</p>
        </div>
      )}
      
      {currentUser?.userName === username && demos.length < demoLimit && (
        <div className="demo-requirements">
          <p>📋 File Requirements: {allowedFormats} format, max {fileSizeLimit}MB per file</p>
        </div>
      )}
    </div>
  );
}

export default DemoGrid;
