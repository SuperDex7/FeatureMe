function ProgressBar({ value, max }) {
    return (
      <div className="progress-bar">
        <div className="progress-bar-completed" style={{ width: `${(value / max) * 100}%` }}>
        </div>
      </div>
    );
  }
  export default ProgressBar