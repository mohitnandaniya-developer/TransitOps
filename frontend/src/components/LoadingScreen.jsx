export default function LoadingScreen() {
  return (
    <div className="loading-screen" role="status" aria-live="polite">
      <div className="loading-mark">TO</div>
      <div>Loading TransitOps</div>
    </div>
  );
}
