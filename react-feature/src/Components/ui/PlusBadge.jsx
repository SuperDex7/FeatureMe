// FeatureMe logo shown next to Plus members' names. Styles: .fm-plus-badge in Styling/components.css.
function PlusBadge({ size = 22, className = "" }) {
  return (
    <img
      className={`fm-plus-badge ${className}`.trim()}
      src="/SVGs/Logo Gradient.svg"
      width={size}
      height={size}
      alt="FeatureMe Plus"
      title="FeatureMe Plus"
    />
  );
}

export default PlusBadge;
