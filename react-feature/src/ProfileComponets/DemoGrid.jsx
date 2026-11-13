import DemoCard from './DemoCard';
import Icon from '../Components/ui/Icon';
import '../Styling/Demos.css';

function DemoGrid({ demos, currentUser, username, onAddDemo, onDeleteDemo }) {
  const isOwner = currentUser?.userName === username;
  const userRole = currentUser?.role || 'USER';
  const fileSizeLimit = userRole === 'USERPLUS' ? 90 : 15;
  const allowedFormats = userRole === 'USERPLUS' ? 'MP3 or WAV' : 'MP3';
  const demoLimit = userRole === 'USERPLUS' ? 6 : 3;
  const isFull = demos.length >= demoLimit;

  return (
    <div className="fm-demos">
      {isOwner && (
        <div className="fm-demos__bar">
          <p className="fm-demos__limit">
            {isFull
              ? `You've used all ${demoLimit} demo slots.`
              : `${demos.length} of ${demoLimit} demo slots used · ${allowedFormats}, up to ${fileSizeLimit} MB`}
          </p>
          <button type="button" className="fm-btn fm-btn--primary" onClick={onAddDemo} disabled={isFull}>
            <Icon name="plus" size={18} strokeWidth={2} />
            {isFull ? 'Demos full' : 'Add demo'}
          </button>
        </div>
      )}

      {demos.length > 0 ? (
        <div className="fm-demos__grid">
          {demos.map((demo) => (
            <DemoCard
              key={demo.id}
              demo={demo}
              onDelete={onDeleteDemo}
              canDelete={isOwner}
            />
          ))}
        </div>
      ) : (
        <div className="fm-state">
          <h3>No demos yet</h3>
          <p>{isOwner ? 'Add a demo so other artists can hear what you sound like.' : 'This artist hasn’t shared any demos yet.'}</p>
          {isOwner && (
            <button type="button" className="fm-btn fm-btn--secondary" onClick={onAddDemo}>Upload your first demo</button>
          )}
        </div>
      )}
    </div>
  );
}

export default DemoGrid;
