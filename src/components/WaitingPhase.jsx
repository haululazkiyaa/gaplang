import "./WaitingPhase.css";

function WaitingPhase({ message, icon }) {
  return (
    <div className="waiting-phase">
      <div className="waiting-icon">{icon}</div>
      <div className="waiting-message">{message}</div>
      <div className="waiting-spinner">
        <div className="spinner-dot"></div>
        <div className="spinner-dot"></div>
        <div className="spinner-dot"></div>
      </div>
    </div>
  );
}

export default WaitingPhase;
